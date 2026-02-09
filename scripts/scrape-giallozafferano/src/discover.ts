import { chromium, type Browser, type Page } from 'playwright';

const CATEGORIES = [
  { name: 'Antipasti', url: 'https://www.giallozafferano.it/ricette-cat/Antipasti/' },
  { name: 'Primi piatti', url: 'https://www.giallozafferano.it/ricette-cat/Primi/' },
  { name: 'Secondi piatti', url: 'https://www.giallozafferano.it/ricette-cat/Secondi-piatti/' },
  { name: 'Contorni', url: 'https://www.giallozafferano.it/ricette-cat/Contorni/' },
  { name: 'Piatti Unici', url: 'https://www.giallozafferano.it/ricette-cat/Piatti-Unici/' },
  { name: 'Dolci', url: 'https://www.giallozafferano.it/ricette-cat/Dolci-e-Desserts/' },
  { name: 'Lievitati', url: 'https://www.giallozafferano.it/ricette-cat/Lievitati/' },
  { name: 'Insalate', url: 'https://www.giallozafferano.it/ricette-cat/Insalate/' },
];

const MAX_PER_CATEGORY = 200;
const MAX_PAGES = 15;

interface DiscoveredRecipe {
  url: string;
  category: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function discoverRecipesInCategory(
  page: Page,
  categoryUrl: string,
  categoryName: string,
): Promise<DiscoveredRecipe[]> {
  const seen = new Set<string>();
  const recipes: DiscoveredRecipe[] = [];

  for (let pageNum = 1; pageNum <= MAX_PAGES && recipes.length < MAX_PER_CATEGORY; pageNum++) {
    const url = pageNum === 1 ? categoryUrl : `${categoryUrl}page${pageNum}/`;

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
    if (!response || response.status() >= 400) {
      console.log(`    Page ${pageNum}: HTTP ${response?.status() ?? 'timeout'}, stopping`);
      break;
    }

    await delay(2000);

    // Extract recipe URLs — they live on ricette.giallozafferano.it
    const urls = await page.evaluate(() => {
      const links = document.querySelectorAll<HTMLAnchorElement>('a[href]');
      return Array.from(links)
        .map((a) => a.href)
        .filter((href) => href.includes('ricette.giallozafferano.it') && href.endsWith('.html'));
    });

    let newCount = 0;
    for (const recipeUrl of urls) {
      const clean = recipeUrl.split('?')[0].replace(/^http:/, 'https:');
      if (!seen.has(clean)) {
        seen.add(clean);
        recipes.push({ url: clean, category: categoryName });
        newCount++;
      }
    }

    console.log(`    Page ${pageNum}: ${newCount} new recipes (total: ${recipes.length})`);

    if (newCount === 0) break; // no more recipes on this page
  }

  return recipes.slice(0, MAX_PER_CATEGORY);
}

export async function discoverAllRecipes(): Promise<DiscoveredRecipe[]> {
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    console.log(`Discovering recipes from ${CATEGORIES.length} categories...`);

    const allRecipes: DiscoveredRecipe[] = [];
    const seenUrls = new Set<string>();

    for (const cat of CATEGORIES) {
      console.log(`  ${cat.name} (${cat.url})`);
      const recipes = await discoverRecipesInCategory(page, cat.url, cat.name);

      for (const r of recipes) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allRecipes.push(r);
        }
      }

      console.log(`  => ${recipes.length} from ${cat.name} (total unique: ${allRecipes.length})`);
      await delay(1000);
    }

    console.log(`Total discovered: ${allRecipes.length} unique recipe URLs`);
    return allRecipes;
  } finally {
    await browser.close();
  }
}
