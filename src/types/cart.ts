export interface CartLine {
  productId: string;
  optionId?: string;
  optionName?: string;
  optionType?: string;
  unitPrice?: number;
  originalPrice?: number | null;
  quantity: number;
}

export interface CartItemInput {
  productId: string;
  optionId?: string;
  optionName?: string;
  optionType?: string;
  unitPrice?: number;
  originalPrice?: number | null;
}