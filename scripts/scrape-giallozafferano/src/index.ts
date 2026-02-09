import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { discoverAllRecipes } from './discover.js';
import { scrapeRecipes } from './scrape.js';
import { estimateNutrition } from './estimate-nutrition.js';
import { uploadRecipes } from './upload.js';
import type { Progress, RawRecipe, EnrichedRecipe } from './types.js';

const PROGRESS_FILE = new URL('../data/progress.json', import.meta.url).pathname;

function loadProgress(): Progress {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8')) as Progress;
  }
  return {
    discoveredUrls: [],
    scrapedUrls: [],
    estimatedUrls: [],
    uploadedUrls: [],
    recipes: {},
    enriched: {},
  };
}

function saveProgress(progress: Progress): void {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

const args = process.argv.slice(2);
const scrapeOnly = args.includes('--scrape-only');
const estimateOnly = args.includes('--estimate-only');
const uploadOnly = args.includes('--upload-only');

async function main() {
  const progress = loadProgress();

  // Step 1: Discover
  if (!scrapeOnly && !estimateOnly && !uploadOnly) {
    if (progress.discoveredUrls.length === 0) {
      console.log('\n=== Step 1: Discovering recipe URLs ===');
      const discovered = await discoverAllRecipes();
      progress.discoveredUrls = discovered.map((d) => d.url);

      // Store category info in recipes map as stubs
      for (const d of discovered) {
        if (!progress.recipes[d.url]) {
          progress.recipes[d.url] = {
            name: '',
            sourceUrl: d.url,
            sourceCategory: d.category,
            imageUrl: undefined,
            ingredients: [],
            instructions: [],
            prepTime: 0,
            cookTime: 0,
            servings: 4,
          };
        }
      }
      saveProgress(progress);
      console.log(`Discovered ${progress.discoveredUrls.length} URLs`);
    } else {
      console.log(`Skipping discovery: ${progress.discoveredUrls.length} URLs already found`);
    }
  }

  // Step 2: Scrape
  if (!estimateOnly && !uploadOnly) {
    const unscraped = progress.discoveredUrls.filter((url) => !progress.scrapedUrls.includes(url));

    if (unscraped.length > 0) {
      console.log(`\n=== Step 2: Scraping ${unscraped.length} recipes ===`);
      const urlsWithCategories = unscraped.map((url) => ({
        url,
        category: progress.recipes[url]?.sourceCategory ?? 'unknown',
      }));

      const scraped = await scrapeRecipes(urlsWithCategories, (url, recipe) => {
        if (recipe) {
          progress.recipes[url] = recipe;
          progress.scrapedUrls.push(url);
        } else {
          progress.scrapedUrls.push(url); // Mark as attempted
        }

        // Save every 10 recipes
        if (progress.scrapedUrls.length % 10 === 0) {
          saveProgress(progress);
          console.log(`  Progress: ${progress.scrapedUrls.length}/${progress.discoveredUrls.length}`);
        }
      });

      saveProgress(progress);
      console.log(`Scraped ${scraped.size} recipes successfully`);
    } else {
      console.log('Skipping scraping: all URLs already scraped');
    }
  }

  // Step 3: Estimate nutrition
  if (!scrapeOnly && !uploadOnly) {
    const unestimated = Object.keys(progress.recipes).filter(
      (url) => progress.scrapedUrls.includes(url) &&
               !progress.estimatedUrls.includes(url) &&
               progress.recipes[url].name !== '', // skip stub entries
    );

    if (unestimated.length > 0) {
      console.log(`\n=== Step 3: Estimating nutrition for ${unestimated.length} recipes ===`);
      const recipesToEstimate: RawRecipe[] = unestimated.map((url) => progress.recipes[url]);

      const enriched = await estimateNutrition(recipesToEstimate, (url, recipe) => {
        progress.estimatedUrls.push(url);
        progress.enriched[url] = recipe;
        // Save every batch (10 recipes)
        if (progress.estimatedUrls.length % 10 === 0) {
          saveProgress(progress);
          console.log(`  Estimated: ${progress.estimatedUrls.length}/${progress.estimatedUrls.length + unestimated.length - progress.estimatedUrls.length}`);
        }
      });

      saveProgress(progress);
      console.log(`Estimated nutrition for ${enriched.size} recipes`);
    } else {
      console.log('Skipping estimation: all recipes already estimated');
    }
  }

  // Step 4: Upload
  if (!scrapeOnly && !estimateOnly) {
    const unuploaded = Object.keys(progress.enriched).filter(
      (url) => !progress.uploadedUrls.includes(url),
    );

    if (unuploaded.length > 0) {
      console.log(`\n=== Step 4: Uploading ${unuploaded.length} recipes ===`);
      const recipesToUpload: EnrichedRecipe[] = unuploaded.map((url) => progress.enriched[url]);

      await uploadRecipes(recipesToUpload);

      progress.uploadedUrls.push(...unuploaded);
      saveProgress(progress);
      console.log('Upload complete');
    } else {
      console.log('Skipping upload: all recipes already uploaded');
    }
  }

  console.log('\n=== Done ===');
  console.log(`  Discovered: ${progress.discoveredUrls.length}`);
  console.log(`  Scraped: ${progress.scrapedUrls.length}`);
  console.log(`  Estimated: ${progress.estimatedUrls.length}`);
  console.log(`  Uploaded: ${progress.uploadedUrls.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
