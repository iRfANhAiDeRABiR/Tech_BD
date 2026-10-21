import type { ProductSummary } from "@/types/product";

const searchAliases: Record<string, string[]> = {
  "365": ["microsoft 365", "office 365", "o365", "office365", "m365"],
  adobe: [
    "creative cloud",
    "photoshop",
    "illustrator",
    "premiere",
    "after effects",
  ],
  bind: ["email linked", "account linked", "sync"],
  home: ["hb", "home business", "home and business"],
  office: ["microsoft office", "ms office"],
  pro: ["professional"],
  sync: ["email sync", "account sync", "linked"],
  windows: ["win", "windows os"],
};

function normalizeText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchVariants(term: string) {
  const normalizedTerm = normalizeText(term);
  const variants = new Set([normalizedTerm]);

  Object.entries(searchAliases).forEach(([primaryTerm, aliases]) => {
    const normalizedPrimary = normalizeText(primaryTerm);
    const normalizedAliases = aliases.map(normalizeText);
    const matchedAlias = normalizedAliases.some(
      (alias) => alias === normalizedTerm || normalizedTerm.includes(alias),
    );

    if (normalizedTerm === normalizedPrimary || matchedAlias) {
      variants.add(normalizedPrimary);
      normalizedAliases.forEach((alias) => variants.add(alias));
    }
  });

  return Array.from(variants).filter(Boolean);
}

function getSearchTokens(term: string) {
  return Array.from(new Set(normalizeText(term).split(" ").filter(Boolean)));
}

export function scoreProductSearchMatch(
  product: ProductSummary,
  categoryName: string,
  searchTerm: string,
) {
  const searchVariants = getSearchVariants(searchTerm);
  const queryTokens = getSearchTokens(searchTerm);

  if (!searchVariants.length || !queryTokens.length) {
    return 0;
  }

  const normalizedName = normalizeText(product.name);
  const normalizedCategory = normalizeText(categoryName);
  const normalizedCategorySlug = normalizeText(product.category);
  const normalizedBadge = normalizeText(product.badge ?? "");
  const normalizedDescription = normalizeText(product.desc);
  const normalizedOptions = normalizeText(
    product.options
      ?.map((option) =>
        [option.name, option.description].filter(Boolean).join(" "),
      )
      .join(" ") ?? "",
  );
  const searchableText = [
    normalizedName,
    normalizedCategory,
    normalizedCategorySlug,
    normalizedBadge,
    normalizedDescription,
    normalizedOptions,
  ]
    .filter(Boolean)
    .join(" ");
  const searchableWords = searchableText.split(" ");

  const allTokensMatch = queryTokens.every((token) =>
    searchableWords.some(
      (word) => word === token || word.startsWith(token) || word.includes(token),
    ),
  );

  if (!allTokensMatch) {
    return 0;
  }

  return searchVariants.reduce((bestScore, variant) => {
    const variantTokens = getSearchTokens(variant);
    const nameWords = normalizedName.split(" ");
    const categoryWords = normalizedCategory.split(" ");
    const categorySlugWords = normalizedCategorySlug.split(" ");
    let score = 1;

    if (normalizedName === variant) score += 1000;
    if (normalizedName.startsWith(variant)) score += 700;
    if (normalizedName.includes(variant)) score += 500;
    if (normalizedCategory === variant || normalizedCategorySlug === variant) {
      score += 450;
    }
    if (normalizedCategory.includes(variant)) score += 250;
    if (normalizedBadge === variant) score += 120;
    if (normalizedOptions.includes(variant)) score += 90;
    if (normalizedDescription.includes(variant)) score += 60;

    variantTokens.forEach((token) => {
      if (nameWords.includes(token)) score += 90;
      else if (normalizedName.includes(token)) score += 45;

      if (categoryWords.includes(token)) score += 60;
      if (categorySlugWords.includes(token)) score += 60;
      if (normalizedOptions.includes(token)) score += 20;
      if (normalizedDescription.includes(token)) score += 10;
    });

    return Math.max(bestScore, score);
  }, 0);
}