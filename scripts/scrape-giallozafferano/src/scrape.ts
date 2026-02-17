import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { RawRecipe, RawIngredient } from './types.js';

const CONCURRENCY = 3;
const DELAY_MS = 2000;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Longer units MUST come before shorter ones to avoid greedy prefix matches (e.g. 'ml' before 'l')
const UNITS = 'kg|ml|cl|dl|cucchiai?o?|cucchiain[oi]?|pizzico|spicchi?o?|fett[aei]|bicchier[ei]?|foglie?|mazzetto|bustina?|vasetto|ciuff[oi]?|rametti?|rami?|g|l';

function parseAmount(str: string): number {
  const s = str.replace(',', '.');
  if (s.includes('/')) {
    const [num, den] = s.split('/');
    return parseFloat(num) / parseFloat(den);
  }
  const fractionMap: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667 };
  return fractionMap[s] ?? (parseFloat(s) || 0);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&frac12;/g, '½')
    .replace(/&frac14;/g, '¼')
    .replace(/&frac34;/g, '¾');
}

function parseItalianIngredient(text: string): RawIngredient {
  const trimmed = decodeHtmlEntities(text.trim());

  // Handle "q.b." (quanto basta) anywhere
  if (/q\.?\s*b\.?/i.test(trimmed)) {
    const name = trimmed.replace(/\s*q\.?\s*b\.?\s*/gi, '').trim();
    return { name: name || trimmed, amount: 0, unit: 'q.b.' };
  }

  // Pattern 1: "Name 150 g" — amount+unit at END (giallozafferano format)
  const endMatch = trimmed.match(new RegExp(`^(.+?)\\s+([\\.\\d,/½¼¾⅓⅔]+)\\s*(${UNITS})(?![a-zA-Zà-ü])\\s*$`, 'i'));
  if (endMatch) {
    return {
      name: endMatch[1].trim(),
      amount: parseAmount(endMatch[2]),
      unit: endMatch[3].trim(),
    };
  }

  // Pattern 2: "Name 3" — bare number at END (e.g. "Uova 1", "Gamberi 12")
  const endBareMatch = trimmed.match(/^(.+?)\s+([\d.,/½¼¾⅓⅔]+)\s*$/);
  if (endBareMatch && endBareMatch[1].length > 1) {
    return {
      name: endBareMatch[1].trim(),
      amount: parseAmount(endBareMatch[2]),
      unit: 'pz',
    };
  }

  // Pattern 3: "150 g di farina" — amount+unit at START (standard format)
  const startMatch = trimmed.match(new RegExp(`^([\\d.,/½¼¾⅓⅔]+)\\s*(${UNITS})(?![a-zA-Zà-ü])\\s*(?:di\\s+)?(.+)$`, 'i'));
  if (startMatch) {
    return {
      name: startMatch[3].trim(),
      amount: parseAmount(startMatch[1]),
      unit: startMatch[2].trim(),
    };
  }

  // Pattern 4: "2 uova" — bare number at START
  const startBareMatch = trimmed.match(/^([\d.,/½¼¾⅓⅔]+)\s+(.+)$/);
  if (startBareMatch) {
    return {
      name: startBareMatch[2].trim(),
      amount: parseAmount(startBareMatch[1]),
      unit: 'pz',
    };
  }

  return { name: trimmed, amount: 1, unit: 'pz' };
}

export { parseItalianIngredient };

async function scrapeRecipePage(page: Page, url: string, category: string): Promise<RawRecipe | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(1000);

    // Try JSON-LD first
    const jsonLd = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent ?? '');
          // Could be an array or single object
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Recipe') return item;
            if (item['@graph']) {
              const recipe = item['@graph'].find((g: Record<string, unknown>) => g['@type'] === 'Recipe');
              if (recipe) return recipe;
            }
          }
        } catch { /* skip */ }
      }
      return null;
    });

    if (jsonLd) {
      return parseJsonLd(jsonLd, url, category);
    }

    // Fallback: DOM scraping
    return await scrapeDom(page, url, category);
  } catch (err) {
    console.error(`  Failed to scrape ${url}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

function parseDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] ?? '0') * 60) + parseInt(match[2] ?? '0');
}

function parseJsonLd(data: Record<string, unknown>, url: string, category: string): RawRecipe {
  const name = (data.name as string) ?? 'Unknown';
  const imageField = data.image;
  let imageUrl: string | undefined;
  if (typeof imageField === 'string') {
    imageUrl = imageField;
  } else if (Array.isArray(imageField) && imageField.length > 0) {
    imageUrl = typeof imageField[0] === 'string' ? imageField[0] : (imageField[0] as Record<string, unknown>)?.url as string;
  } else if (imageField && typeof imageField === 'object') {
    imageUrl = (imageField as Record<string, unknown>).url as string;
  }

  const ingredientRaw = data.recipeIngredient as string[] | undefined;
  const ingredients = (ingredientRaw ?? []).map(parseItalianIngredient);

  const instructionsRaw = data.recipeInstructions;
  let instructions: string[] = [];
  if (Array.isArray(instructionsRaw)) {
    instructions = instructionsRaw.map((step) => {
      if (typeof step === 'string') return step;
      if (step && typeof step === 'object' && 'text' in step) return String(step.text);
      return '';
    }).filter(Boolean);
  }

  const servingsRaw = data.recipeYield;
  let servings = 4;
  if (typeof servingsRaw === 'number') {
    servings = servingsRaw;
  } else if (typeof servingsRaw === 'string') {
    servings = parseInt(servingsRaw) || 4;
  } else if (Array.isArray(servingsRaw) && servingsRaw.length > 0) {
    servings = parseInt(String(servingsRaw[0])) || 4;
  }

  return {
    name,
    sourceUrl: url,
    sourceCategory: category,
    imageUrl,
    ingredients,
    instructions,
    prepTime: parseDuration(data.prepTime as string | undefined),
    cookTime: parseDuration(data.cookTime as string | undefined),
    servings,
  };
}

async function scrapeDom(page: Page, url: string, category: string): Promise<RawRecipe | null> {
  const data = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent?.trim() ?? 'Unknown';
    const image = document.querySelector<HTMLImageElement>('.gz-featured-image img, .recipe-media img')?.src;

    const ingredientEls = document.querySelectorAll('.gz-ingredient, [class*="ingredient"] li');
    const ingredients = Array.from(ingredientEls).map((el) => el.textContent?.trim() ?? '');

    const instructionEls = document.querySelectorAll('.gz-content-recipe-step p, [class*="instruction"] p, [class*="step"] p');
    const instructions = Array.from(instructionEls)
      .map((el) => el.textContent?.trim() ?? '')
      .filter(Boolean);

    return { title, image, ingredients, instructions };
  });

  if (!data.ingredients.length && !data.instructions.length) return null;

  return {
    name: data.title,
    sourceUrl: url,
    sourceCategory: category,
    imageUrl: data.image,
    ingredients: data.ingredients.filter(Boolean).map(parseItalianIngredient),
    instructions: data.instructions,
    prepTime: 0,
    cookTime: 0,
    servings: 4,
  };
}

export async function scrapeRecipes(
  urlsWithCategories: { url: string; category: string }[],
  onProgress?: (url: string, recipe: RawRecipe | null) => void,
): Promise<Map<string, RawRecipe>> {
  const results = new Map<string, RawRecipe>();
  const browser: Browser = await chromium.launch({ headless: true });

  try {
    // Process in batches of CONCURRENCY
    for (let i = 0; i < urlsWithCategories.length; i += CONCURRENCY) {
      const batch = urlsWithCategories.slice(i, i + CONCURRENCY);

      const promises = batch.map(async ({ url, category }) => {
        const context: BrowserContext = await browser.newContext({
          userAgent: 'Mozilla/5.0 (compatible; MealApp-Scraper/1.0)',
        });
        const page = await context.newPage();

        try {
          const recipe = await scrapeRecipePage(page, url, category);
          if (recipe) {
            results.set(url, recipe);
          }
          onProgress?.(url, recipe);
        } finally {
          await context.close();
        }
      });

      await Promise.all(promises);
      await delay(DELAY_MS);
    }
  } finally {
    await browser.close();
  }

  return results;
}
