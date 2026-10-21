export const optionTypeValues = [
  "RETAIL_KEY",
  "BIND_KEY",
  "OEM_KEY",
  "SUBSCRIPTION",
  "OTHER",
] as const;

export const productStatusValues = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

function createSlug(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length >= 2 ? slug : `product-${Date.now()}`;
}

type ParsedOption = {
  id?: string;
  name: string;
  type: (typeof optionTypeValues)[number];
  sku?: string;
  price: number;
  originalPrice?: number;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

type ParsedProductForm = {
  id?: string;
  name: string;
  slug: string;
  categoryId: number;
  badge?: string;
  price: number;
  originalPrice?: number;
  shortDescription: string;
  descriptionHtml: string;
  imageUrl?: string;
  icon?: string;
  color?: string;
  gradient?: string;
  status: (typeof productStatusValues)[number];
  isFeatured: boolean;
  outOfStock: boolean;
  sortOrder: number;
  options: ParsedOption[];
};

function parseOptionalText(value: FormDataEntryValue | null, maxLength: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function parseOptionalProductId(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;

  if (text.length < 2 || text.length > 120 || !/^[A-Za-z0-9][A-Za-z0-9._~-]*$/.test(text)) {
    throw new Error("Product ID must be 2-120 URL-safe characters.");
  }

  return text;
}

function parseRequiredText(value: FormDataEntryValue | null, fieldName: string, minLength: number, maxLength: number) {
  const text = String(value ?? "").trim();
  if (text.length < minLength || text.length > maxLength) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return text;
}

function parseInteger(value: FormDataEntryValue | null, fieldName: string) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) {
    throw new Error(`${fieldName} must be an integer.`);
  }
  return numberValue;
}

function parseOptionalInteger(value: FormDataEntryValue | null, fieldName: string) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const numberValue = Number(text);
  if (!Number.isInteger(numberValue)) {
    throw new Error(`${fieldName} must be an integer.`);
  }
  return numberValue;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on";
}

function parseProductOptions(value: string): ParsedOption[] {
  let rawOptions: unknown;

  try {
    rawOptions = JSON.parse(value);
  } catch {
    throw new Error("Product options contain invalid JSON.");
  }

  if (!Array.isArray(rawOptions) || rawOptions.length > 30) {
    throw new Error("Product options are invalid.");
  }

  return rawOptions.map((option) => {
    if (!option || typeof option !== "object") {
      throw new Error("Product options are invalid.");
    }

    const typedOption = option as Record<string, unknown>;
    const name = String(typedOption.name ?? "").trim();
    const type = String(typedOption.type ?? "") as ParsedOption["type"];

    if (!name || name.length > 100) {
      throw new Error("Product options are invalid.");
    }

    if (!optionTypeValues.includes(type)) {
      throw new Error("Product options are invalid.");
    }

    const price = Number(typedOption.price);
    const originalPrice = typedOption.originalPrice === null || typedOption.originalPrice === undefined || typedOption.originalPrice === ""
      ? undefined
      : Number(typedOption.originalPrice);
    const sortOrder = Number(typedOption.sortOrder ?? 0);

    if (!Number.isInteger(price) || price < 0) {
      throw new Error("Product options are invalid.");
    }

    if (originalPrice !== undefined && (!Number.isInteger(originalPrice) || originalPrice < 0)) {
      throw new Error("Product options are invalid.");
    }

    if (!Number.isInteger(sortOrder) || sortOrder < -9999 || sortOrder > 9999) {
      throw new Error("Product options are invalid.");
    }

    return {
      id: typeof typedOption.id === "string" ? typedOption.id : undefined,
      name,
      type,
      sku: parseOptionalText(typedOption.sku as FormDataEntryValue | null, 100),
      price,
      originalPrice,
      description: parseOptionalText(typedOption.description as FormDataEntryValue | null, 2000),
      isDefault: Boolean(typedOption.isDefault),
      isActive: typedOption.isActive !== false,
      sortOrder,
    };
  });
}

export function parseProductForm(formData: FormData) {
  const id = parseOptionalProductId(formData.get("storefrontProductId"));
  const name = parseRequiredText(formData.get("name"), "Name", 2, 160);
  const slug = String(formData.get("slug") || "").trim() || createSlug(name);
  const categoryId = parseInteger(formData.get("categoryId"), "Category");
  const price = parseInteger(formData.get("price"), "Price");
  const originalPrice = parseOptionalInteger(formData.get("originalPrice"), "Original price");
  const sortOrder = parseInteger(formData.get("sortOrder"), "Sort order");
  const status = String(formData.get("status") || "") as (typeof productStatusValues)[number];

  if (!productStatusValues.includes(status)) {
    throw new Error("Status is invalid.");
  }

  return {
    id,
    name,
    slug,
    categoryId,
    badge: parseOptionalText(formData.get("badge"), 30),
    price,
    originalPrice,
    shortDescription: parseRequiredText(formData.get("shortDescription"), "Short description", 2, 5000),
    descriptionHtml: parseRequiredText(formData.get("descriptionHtml"), "Description", 2, 100000),
    imageUrl: parseOptionalText(formData.get("imageUrl"), 2048),
    icon: parseOptionalText(formData.get("icon"), 20),
    color: parseOptionalText(formData.get("color"), 40),
    gradient: parseOptionalText(formData.get("gradient"), 200),
    status,
    isFeatured: parseBoolean(formData.get("isFeatured")),
    outOfStock: parseBoolean(formData.get("outOfStock")),
    sortOrder,
    options: parseProductOptions(String(formData.get("options") || "[]")),
  } satisfies ParsedProductForm;
}