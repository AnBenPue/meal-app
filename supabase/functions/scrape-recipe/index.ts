import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── JSON-LD extraction ──

function extractJsonLdRecipe(html: string): Record<string, unknown> | null {
  // Use indexOf-based extraction instead of regex to handle large HTML reliably
  const TAG_OPEN = 'application/ld+json';
  const SCRIPT_CLOSE = '</script>';
  let pos = 0;

  while (true) {
    const tagIdx = html.indexOf(TAG_OPEN, pos);
    if (tagIdx === -1) break;

    // Find the end of the opening <script> tag
    const contentStart = html.indexOf('>', tagIdx);
    if (contentStart === -1) break;

    // Find the closing </script>
    const contentEnd = html.indexOf(SCRIPT_CLOSE, contentStart);
    if (contentEnd === -1) break;

    const jsonStr = html.slice(contentStart + 1, contentEnd).trim();
    pos = contentEnd + SCRIPT_CLOSE.length;

    try {
      const json = JSON.parse(jsonStr);
      const recipe = findRecipeInJsonLd(json);
      if (recipe) return recipe;
    } catch {
      // malformed JSON-LD block, try next
    }
  }
  return null;
}

function findRecipeInJsonLd(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Direct Recipe type
  if (obj["@type"] === "Recipe" || (Array.isArray(obj["@type"]) && obj["@type"].includes("Recipe"))) {
    return obj;
  }

  // @graph array
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
  }

  return null;
}

// ── ISO 8601 duration parsing ──

function parseDuration(iso: unknown): number {
  if (typeof iso !== "string") return 0;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 60 + minutes + Math.ceil(seconds / 60);
}

// ── Ingredient string parsing ──

const UNIT_MAP: Record<string, string> = {
  g: "g",
  gram: "g",
  grams: "g",
  kg: "g",
  kilogram: "g",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  l: "ml",
  liter: "ml",
  liters: "ml",
  cup: "cup",
  cups: "cup",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  piece: "piece",
  pieces: "piece",
  slice: "slice",
  slices: "slice",
  clove: "piece",
  cloves: "piece",
  lb: "oz",
  lbs: "oz",
  pound: "oz",
  pounds: "oz",
};

const MULTIPLIERS: Record<string, number> = {
  kg: 1000,
  kilogram: 1000,
  l: 1000,
  liter: 1000,
  liters: 1000,
  lb: 16,
  lbs: 16,
  pound: 16,
  pounds: 16,
};

interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
}

function parseIngredientString(text: string): ParsedIngredient {
  const cleaned = text.replace(/\s+/g, " ").trim();

  // Try: "2 cups flour", "1/2 tsp salt", "1.5 oz cheese"
  const match = cleaned.match(
    /^([\d./]+(?:\s*[-–]\s*[\d./]+)?)\s+([a-zA-Z]+\.?)\s+(.+)$/,
  );

  if (match) {
    const amount = parseFraction(match[1]);
    const rawUnit = match[2].replace(/\.$/, "").toLowerCase();
    const mappedUnit = UNIT_MAP[rawUnit];

    if (mappedUnit) {
      const multiplier = MULTIPLIERS[rawUnit] || 1;
      return {
        name: match[3].trim(),
        amount: Math.round(amount * multiplier * 100) / 100,
        unit: mappedUnit,
      };
    }
  }

  // Try: "2 eggs", "3 tomatoes" (number + name, no unit)
  const numMatch = cleaned.match(/^([\d./]+(?:\s*[-–]\s*[\d./]+)?)\s+(.+)$/);
  if (numMatch) {
    const amount = parseFraction(numMatch[1]);
    return { name: numMatch[2].trim(), amount, unit: "piece" };
  }

  // Fallback: entire string as name
  return { name: cleaned, amount: 1, unit: "piece" };
}

function parseFraction(s: string): number {
  // Handle ranges like "1-2": take the first number
  const rangePart = s.split(/[-–]/)[0].trim();

  if (rangePart.includes("/")) {
    const parts = rangePart.split("/");
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }
  return parseFloat(rangePart) || 1;
}

// ── Nutrition extraction ──

interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function extractNutrition(data: unknown): RecipeNutrition {
  const result: RecipeNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!data || typeof data !== "object") return result;

  const nut = data as Record<string, unknown>;
  result.calories = parseNutrientValue(nut.calories);
  result.protein = parseNutrientValue(nut.proteinContent);
  result.carbs = parseNutrientValue(nut.carbohydrateContent);
  result.fat = parseNutrientValue(nut.fatContent);

  return result;
}

function parseNutrientValue(val: unknown): number {
  if (typeof val === "number") return Math.round(val * 10) / 10;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : Math.round(n * 10) / 10;
  }
  return 0;
}

// ── Instructions flattening ──

function flattenInstructions(arr: unknown): string[] {
  if (!arr) return [];
  if (typeof arr === "string") return [arr];

  if (!Array.isArray(arr)) return [];

  const result: string[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) result.push(trimmed);
    } else if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;

      // HowToStep
      if (obj.text) {
        const text = String(obj.text).trim();
        if (text) result.push(text);
      }

      // HowToSection with itemListElement
      if (Array.isArray(obj.itemListElement)) {
        result.push(...flattenInstructions(obj.itemListElement));
      }
    }
  }
  return result;
}

// ── Ingredients flattening ──

function flattenIngredients(arr: unknown): ParsedIngredient[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map(parseIngredientString);
}

// ── Main normalizer ──

interface ScrapedRecipe {
  name: string;
  ingredients: ParsedIngredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: RecipeNutrition;
  imageUrl?: string;
}

function normalizeRecipe(data: Record<string, unknown>): ScrapedRecipe {
  const name = String(data.name || "Untitled Recipe").trim();
  const ingredients = flattenIngredients(data.recipeIngredient);
  const instructions = flattenInstructions(data.recipeInstructions);
  const prepTime = parseDuration(data.prepTime);
  const cookTime = parseDuration(data.cookTime);

  let servings = 1;
  if (data.recipeYield) {
    const yieldVal = Array.isArray(data.recipeYield)
      ? data.recipeYield[0]
      : data.recipeYield;
    const parsed = parseInt(String(yieldVal), 10);
    if (!isNaN(parsed) && parsed > 0) servings = parsed;
  }

  const nutrition = extractNutrition(data.nutrition);

  let imageUrl: string | undefined;
  if (data.image) {
    if (typeof data.image === "string") {
      imageUrl = data.image;
    } else if (Array.isArray(data.image) && data.image.length > 0) {
      imageUrl = typeof data.image[0] === "string"
        ? data.image[0]
        : (data.image[0] as Record<string, unknown>)?.url as string | undefined;
    } else if (typeof data.image === "object") {
      imageUrl = (data.image as Record<string, unknown>).url as string | undefined;
    }
  }

  return {
    name,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
    nutrition,
    imageUrl,
  };
}

// ── Edge Function handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Parse request
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return jsonResponse({ error: "Missing or invalid URL" });
    }

    // Validate URL scheme
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return jsonResponse({ error: "Invalid URL format" });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return jsonResponse({ error: "Only http and https URLs are supported" });
    }

    // Fetch the page with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let pageRes: Response;
    try {
      pageRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MealApp/1.0; +https://mealappws.vercel.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return jsonResponse({ error: "Request timed out fetching the URL" });
      }
      return jsonResponse({ error: "Failed to fetch the URL" });
    } finally {
      clearTimeout(timeout);
    }

    if (!pageRes.ok) {
      return jsonResponse(
        { error: `The URL returned HTTP ${pageRes.status}` },
      );
    }

    const html = await pageRes.text();
    const recipeData = extractJsonLdRecipe(html);

    if (!recipeData) {
      return jsonResponse(
        { error: "No recipe data found on this page. The site may not include structured recipe data." },
      );
    }

    const recipe = normalizeRecipe(recipeData);
    return jsonResponse(recipe);
  } catch {
    return jsonResponse({ error: "Internal server error" });
  }
});
