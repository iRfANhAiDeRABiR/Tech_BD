export type ProductCategory = string;

export interface ProductOption {
  id: string;
  name: string;
  type:
    | "RETAIL_KEY"
    | "BIND_KEY"
    | "OEM_KEY"
    | "SUBSCRIPTION"
    | "OTHER";
  price: number;
  originalPrice: number | null;
  description: string | null;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  category: ProductCategory;
  badge: string;
  price: number;
  originalPrice: number | null;
  desc: string;
  longDesc: string;
  image: string;
  icon: string;
  color: string;
  gradient: string;
  outOfStock?: boolean;
  options?: ProductOption[];
}

export type ProductSummary = Omit<Product, "longDesc">;

export interface StoreCategory {
  slug: string;
  name: string;
  description: string;
  count: number;
  image: string | null;
  accent: string;
}