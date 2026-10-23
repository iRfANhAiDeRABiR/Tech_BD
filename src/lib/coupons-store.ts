import prisma from "@/lib/prisma";

export type CouponDiscountType = "PERCENTAGE" | "FIXED";

export interface CouponItem {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  isActive: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  isActive?: boolean;
  expiresAt?: string | Date | null;
  usageLimit?: number | null;
  description?: string | null;
}

export interface UpdateCouponInput {
  code?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  isActive?: boolean;
  expiresAt?: string | Date | null;
  usageLimit?: number | null;
  description?: string | null;
}

// In-memory cache for ultra-fast validation during checkout and page loads
let cachedCoupons: CouponItem[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20_000; // 20 seconds

const globalForCoupons = globalThis as unknown as {
  __isCouponsTableInitialized?: boolean;
};

export async function ensureCouponTable(): Promise<boolean> {
  if (globalForCoupons.__isCouponsTableInitialized) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Coupon" (
        "id" TEXT PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
        "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 10,
        "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "maxDiscount" DOUBLE PRECISION,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP(3),
        "usageLimit" INTEGER,
        "usedCount" INTEGER NOT NULL DEFAULT 0,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "idx_coupon_code" ON "Coupon" ("code");
      CREATE INDEX IF NOT EXISTS "idx_coupon_is_active" ON "Coupon" ("isActive");
    `);

    // Seed default coupons if table is newly created
    const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      `SELECT COUNT(*) as count FROM "Coupon"`
    );
    const count = Number(countRows?.[0]?.count ?? 0);

    if (count === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Coupon" ("id", "code", "discountType", "discountValue", "minOrderAmount", "maxDiscount", "isActive", "description", "createdAt", "updatedAt")
        VALUES 
          ('cp-techbd10', 'TECHBD10', 'PERCENTAGE', 10, 0, NULL, true, '10% off storewide', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('cp-save10', 'SAVE10', 'PERCENTAGE', 10, 0, NULL, true, '10% off storewide', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('cp-safe10', 'SAFE10', 'PERCENTAGE', 10, 0, NULL, true, '10% off storewide', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("code") DO NOTHING;
      `);
    }

    globalForCoupons.__isCouponsTableInitialized = true;
    return true;
  } catch (err) {
    console.error("Failed to ensure Coupon table:", err);
    return false;
  }
}

export function invalidateCouponCache() {
  cachedCoupons = null;
  lastCacheTime = 0;
}

export async function getAllCoupons(options?: {
  status?: "all" | "active" | "inactive";
  search?: string;
}): Promise<CouponItem[]> {
  await ensureCouponTable();

  const now = Date.now();
  if (!cachedCoupons || now - lastCacheTime > CACHE_TTL_MS) {
    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          "id", "code", "discountType", "discountValue", "minOrderAmount", 
          "maxDiscount", "isActive", "expiresAt", "usageLimit", "usedCount", 
          "description", "createdAt", "updatedAt"
        FROM "Coupon"
        ORDER BY "createdAt" DESC;
      `);

      cachedCoupons = rows.map((r) => ({
        id: String(r.id),
        code: String(r.code).toUpperCase(),
        discountType: (r.discountType === "FIXED" ? "FIXED" : "PERCENTAGE") as CouponDiscountType,
        discountValue: Number(r.discountValue || 0),
        minOrderAmount: Number(r.minOrderAmount || 0),
        maxDiscount: r.maxDiscount != null ? Number(r.maxDiscount) : null,
        isActive: Boolean(r.isActive),
        expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
        usageLimit: r.usageLimit != null ? Number(r.usageLimit) : null,
        usedCount: Number(r.usedCount || 0),
        description: r.description ? String(r.description) : null,
        createdAt: new Date(r.createdAt || Date.now()).toISOString(),
        updatedAt: new Date(r.updatedAt || Date.now()).toISOString(),
      }));
      lastCacheTime = now;
    } catch (err) {
      console.error("Failed to fetch coupons from DB:", err);
      // Fallback to in-memory defaults if DB is temporarily unreachable
      if (!cachedCoupons) {
        cachedCoupons = [
          {
            id: "cp-techbd10",
            code: "TECHBD10",
            discountType: "PERCENTAGE",
            discountValue: 10,
            minOrderAmount: 0,
            maxDiscount: null,
            isActive: true,
            expiresAt: null,
            usageLimit: null,
            usedCount: 0,
            description: "10% off storewide",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "cp-save10",
            code: "SAVE10",
            discountType: "PERCENTAGE",
            discountValue: 10,
            minOrderAmount: 0,
            maxDiscount: null,
            isActive: true,
            expiresAt: null,
            usageLimit: null,
            usedCount: 0,
            description: "10% off storewide",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    }
  }

  let result = [...cachedCoupons];

  if (options?.status === "active") {
    result = result.filter((c) => c.isActive);
  } else if (options?.status === "inactive") {
    result = result.filter((c) => !c.isActive);
  }

  if (options?.search) {
    const q = options.search.trim().toUpperCase();
    result = result.filter(
      (c) =>
        c.code.includes(q) ||
        (c.description && c.description.toUpperCase().includes(q))
    );
  }

  return result;
}

export async function getCouponByCode(code: string): Promise<CouponItem | null> {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const all = await getAllCoupons();
  return all.find((c) => c.code === cleanCode) || null;
}

export async function getCouponById(id: string): Promise<CouponItem | null> {
  if (!id) return null;
  const all = await getAllCoupons();
  return all.find((c) => c.id === id) || null;
}

export async function createCoupon(input: CreateCouponInput): Promise<CouponItem> {
  await ensureCouponTable();

  const id = `cp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanCode = input.code.trim().toUpperCase();
  const discountType = input.discountType === "FIXED" ? "FIXED" : "PERCENTAGE";
  const discountValue = Math.max(0, Number(input.discountValue) || 0);
  const minOrderAmount = Math.max(0, Number(input.minOrderAmount) || 0);
  const maxDiscount = input.maxDiscount != null && input.maxDiscount > 0 ? Number(input.maxDiscount) : null;
  const isActive = input.isActive !== false;
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  const usageLimit = input.usageLimit != null && input.usageLimit > 0 ? Math.floor(input.usageLimit) : null;
  const description = input.description ? input.description.trim() : null;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Coupon" (
      "id", "code", "discountType", "discountValue", "minOrderAmount", 
      "maxDiscount", "isActive", "expiresAt", "usageLimit", "usedCount", 
      "description", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
    id,
    cleanCode,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    isActive,
    expiresAt,
    usageLimit,
    description
  );

  invalidateCouponCache();
  const created = await getCouponById(id);
  if (!created) throw new Error("Failed to create coupon.");
  return created;
}

export async function updateCoupon(id: string, input: UpdateCouponInput): Promise<CouponItem> {
  await ensureCouponTable();
  const existing = await getCouponById(id);
  if (!existing) throw new Error("Coupon not found.");

  const cleanCode = input.code !== undefined ? input.code.trim().toUpperCase() : existing.code;
  const discountType =
    input.discountType !== undefined
      ? input.discountType === "FIXED"
        ? "FIXED"
        : "PERCENTAGE"
      : existing.discountType;
  const discountValue =
    input.discountValue !== undefined ? Math.max(0, Number(input.discountValue) || 0) : existing.discountValue;
  const minOrderAmount =
    input.minOrderAmount !== undefined ? Math.max(0, Number(input.minOrderAmount) || 0) : existing.minOrderAmount;
  const maxDiscount =
    input.maxDiscount !== undefined
      ? input.maxDiscount != null && input.maxDiscount > 0
        ? Number(input.maxDiscount)
        : null
      : existing.maxDiscount;
  const isActive = input.isActive !== undefined ? Boolean(input.isActive) : existing.isActive;
  const expiresAt =
    input.expiresAt !== undefined ? (input.expiresAt ? new Date(input.expiresAt) : null) : existing.expiresAt ? new Date(existing.expiresAt) : null;
  const usageLimit =
    input.usageLimit !== undefined
      ? input.usageLimit != null && input.usageLimit > 0
        ? Math.floor(input.usageLimit)
        : null
      : existing.usageLimit;
  const description = input.description !== undefined ? (input.description ? input.description.trim() : null) : existing.description;

  await prisma.$executeRawUnsafe(
    `UPDATE "Coupon" SET 
      "code" = $1,
      "discountType" = $2,
      "discountValue" = $3,
      "minOrderAmount" = $4,
      "maxDiscount" = $5,
      "isActive" = $6,
      "expiresAt" = $7,
      "usageLimit" = $8,
      "description" = $9,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = $10;`,
    cleanCode,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    isActive,
    expiresAt,
    usageLimit,
    description,
    id
  );

  invalidateCouponCache();
  const updated = await getCouponById(id);
  if (!updated) throw new Error("Failed to update coupon.");
  return updated;
}

export async function toggleCouponActive(id: string, isActive: boolean): Promise<boolean> {
  await ensureCouponTable();
  await prisma.$executeRawUnsafe(
    `UPDATE "Coupon" SET "isActive" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2;`,
    Boolean(isActive),
    id
  );
  invalidateCouponCache();
  return true;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  await ensureCouponTable();
  await prisma.$executeRawUnsafe(`DELETE FROM "Coupon" WHERE "id" = $1;`, id);
  invalidateCouponCache();
  return true;
}

export async function incrementCouponUsage(code: string): Promise<void> {
  if (!code) return;
  const cleanCode = code.trim().toUpperCase();
  try {
    await ensureCouponTable();
    await prisma.$executeRawUnsafe(
      `UPDATE "Coupon" SET "usedCount" = "usedCount" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "code" = $1;`,
      cleanCode
    );
    invalidateCouponCache();
  } catch (err) {
    console.warn(`Could not increment coupon usage for ${cleanCode}:`, err);
  }
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  discountAmount: number;
  label?: string;
  message?: string;
  coupon?: CouponItem;
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const cleanCode = (code || "").trim().toUpperCase();

  if (!cleanCode) {
    return {
      valid: false,
      code: "",
      discountAmount: 0,
      message: "অনুগ্রহ করে কুপন কোড প্রবেশ করান।",
    };
  }

  const coupon = await getCouponByCode(cleanCode);

  if (!coupon) {
    return {
      valid: false,
      code: cleanCode,
      discountAmount: 0,
      message: "কুপন কোডটি সঠিক নয়। অনুগ্রহ করে যাচাই করে লিখুন।",
    };
  }

  // Check Active / Inactive status
  if (!coupon.isActive) {
    return {
      valid: false,
      code: cleanCode,
      discountAmount: 0,
      message: "এই কুপনটি বর্তমানে নিষ্ক্রিয় (Inactive) রয়েছে।",
    };
  }

  // Check Expiry Date
  if (coupon.expiresAt) {
    const expiry = new Date(coupon.expiresAt).getTime();
    if (Date.now() > expiry) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        message: "এই কুপনটির মেয়াদ শেষ হয়ে গেছে।",
      };
    }
  }

  // Check Usage Limit
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      code: cleanCode,
      discountAmount: 0,
      message: "এই কুপনটির সর্বোচ্চ ব্যবহারের সীমা অতিক্রম করেছে।",
    };
  }

  // Check Minimum Order Amount
  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      code: cleanCode,
      discountAmount: 0,
      message: `এই কুপনটি ব্যবহার করতে ন্যূনতম ৳${coupon.minOrderAmount.toLocaleString("en-BD")} টাকার অর্ডার করতে হবে।`,
    };
  }

  // Calculate Discount Amount
  let discountAmount = 0;
  let label = "";

  if (coupon.discountType === "PERCENTAGE") {
    const rawDiscount = Math.round(subtotal * (coupon.discountValue / 100));
    discountAmount = coupon.maxDiscount != null ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
    discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
    label = `${coupon.discountValue}% off storewide`;
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, Math.round(coupon.discountValue)));
    label = `৳${coupon.discountValue.toLocaleString("en-BD")} off`;
  }

  return {
    valid: true,
    code: cleanCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    label: coupon.description || label,
    coupon,
    message: `${cleanCode} কুপন সফলভাবে যুক্ত হয়েছে!`,
  };
}

