"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItemInput, CartLine } from "@/types/cart";

const STORAGE_KEY = "tsbd-cart-v1";
const MAX_QUANTITY = 99;

interface CartContextValue {
  items: CartLine[];
  isHydrated: boolean;
  itemCount: number;
  addItem: (item: string | CartItemInput, quantity?: number) => void;
  removeItem: (productId: string, optionId?: string) => void;
  updateQuantity: (productId: string, quantity: number, optionId?: string) => void;
  reconcileCart: (isLineAvailable: (line: CartLine) => boolean) => void;
  clearCart: () => void;
  getQuantity: (productId: string, optionId?: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeProductId(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function getCartLineKey(productId: string, optionId?: string) {
  return `${productId}:${optionId ?? "base"}`;
}

function normalizeCartItemInput(item: string | CartItemInput): CartItemInput {
  if (typeof item === "string") {
    return { productId: item };
  }

  return item;
}

function normalizeItems(value: unknown): CartLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const lines = new Map<string, CartLine>();

  value.forEach((item) => {
    if (!isRecord(item)) {
      return;
    }

    const productId = normalizeProductId(item.productId);
    const quantity = Number(item.quantity);
    const optionId =
      typeof item.optionId === "string" && item.optionId.trim()
        ? item.optionId
        : undefined;
    const optionName =
      typeof item.optionName === "string" && item.optionName.trim()
        ? item.optionName
        : undefined;
    const optionType =
      typeof item.optionType === "string" && item.optionType.trim()
        ? item.optionType
        : undefined;
    const unitPrice = Number(item.unitPrice);
    const originalPriceValue =
      item.originalPrice === null
        ? null
        : Number(item.originalPrice);

    if (
      !productId ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    const safeQuantity = Math.min(
      MAX_QUANTITY,
      Math.max(1, Math.floor(quantity)),
    );

    const key = getCartLineKey(productId, optionId);
    const existingLine = lines.get(key);
    const existingQuantity = existingLine?.quantity ?? 0;

    lines.set(key, {
      productId,
      optionId,
      optionName,
      optionType,
      unitPrice:
        Number.isFinite(unitPrice) && unitPrice >= 0
          ? Math.floor(unitPrice)
          : undefined,
      originalPrice:
        originalPriceValue === null
          ? null
          : Number.isFinite(originalPriceValue) && originalPriceValue >= 0
            ? Math.floor(originalPriceValue)
            : undefined,
      quantity: Math.min(MAX_QUANTITY, existingQuantity + safeQuantity),
    });
  });

  return Array.from(lines.values());
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(STORAGE_KEY);

      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart);
        // Cart state is intentionally restored after the server-rendered pass.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(normalizeItems(parsedCart));
      }
    } catch {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage may be disabled; the in-memory cart remains available.
      }
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch {
      // The cart still works in memory if storage is unavailable.
    }
  }, [items, isHydrated]);

  const addItem = useCallback(
    (item: string | CartItemInput, quantity = 1) => {
      const cartItem = normalizeCartItemInput(item);
      const productId = normalizeProductId(cartItem.productId);
      const optionId = cartItem.optionId?.trim() || undefined;
      const unitPrice = Number(cartItem.unitPrice);
      const originalPriceValue =
        cartItem.originalPrice === null
          ? null
          : Number(cartItem.originalPrice);

      if (
        !productId ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return;
      }

      const safeQuantity = Math.min(
        MAX_QUANTITY,
        Math.max(1, Math.floor(quantity)),
      );

      setItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) => item.productId === productId && item.optionId === optionId,
        );

        if (!existingItem) {
          return [
            ...currentItems,
            {
              productId,
              optionId,
              optionName: cartItem.optionName?.trim() || undefined,
              optionType: cartItem.optionType?.trim() || undefined,
              unitPrice:
                Number.isFinite(unitPrice) && unitPrice >= 0
                  ? Math.floor(unitPrice)
                  : undefined,
              originalPrice:
                originalPriceValue === null
                  ? null
                  : Number.isFinite(originalPriceValue) && originalPriceValue >= 0
                    ? Math.floor(originalPriceValue)
                    : undefined,
              quantity: safeQuantity,
            },
          ];
        }

        return currentItems.map((item) =>
          item.productId === productId && item.optionId === optionId
            ? {
                ...item,
                quantity: Math.min(
                  MAX_QUANTITY,
                  item.quantity + safeQuantity,
                ),
              }
            : item,
        );
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string, optionId?: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.productId === productId && item.optionId === optionId),
      ),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, optionId?: string) => {
      if (!Number.isFinite(quantity) || quantity <= 0) {
        removeItem(productId, optionId);
        return;
      }

      const safeQuantity = Math.min(
        MAX_QUANTITY,
        Math.max(1, Math.floor(quantity)),
      );

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.productId === productId && item.optionId === optionId
            ? {
                ...item,
                quantity: safeQuantity,
              }
            : item,
        ),
      );
    },
    [removeItem],
  );

  const reconcileCart = useCallback(
    (isLineAvailable: (line: CartLine) => boolean) => {
      setItems((currentItems) => {
        const availableItems = currentItems.filter(isLineAvailable);

        return availableItems.length === currentItems.length
          ? currentItems
          : availableItems;
      });
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getQuantity = useCallback(
    (productId: string, optionId?: string) =>
      items.find((item) => item.productId === productId && item.optionId === optionId)
        ?.quantity ?? 0,
    [items],
  );

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
    [items],
  );

  const contextValue = useMemo<CartContextValue>(
    () => ({
      items,
      isHydrated,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      reconcileCart,
      clearCart,
      getQuantity,
    }),
    [
      items,
      isHydrated,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      reconcileCart,
      clearCart,
      getQuantity,
    ],
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider.",
    );
  }

  return context;
}
