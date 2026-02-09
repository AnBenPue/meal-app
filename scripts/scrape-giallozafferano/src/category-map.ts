const CATEGORY_MAP: Record<string, string> = {
  'antipasti': 'snack',
  'primi piatti': 'lunch',
  'primi': 'lunch',
  'secondi piatti': 'dinner',
  'secondi': 'dinner',
  'contorni': 'lunch',
  'piatti unici': 'dinner',
  'dolci': 'snack',
  'dessert': 'snack',
  'lievitati': 'breakfast',
  'pane': 'breakfast',
  'salse e sughi': 'dinner',
  'sughi': 'dinner',
  'insalate': 'lunch',
  'zuppe': 'lunch',
  'minestre': 'lunch',
  'bevande': 'snack',
  'marmellate e conserve': 'snack',
  'torte salate': 'dinner',
  'pizze e focacce': 'dinner',
  'pasta fresca': 'lunch',
};

export function mapCategory(italianCategory: string): string {
  const normalized = italianCategory.toLowerCase().trim();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return 'dinner'; // default fallback
}
