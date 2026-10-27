import prisma from "@/lib/prisma";

export interface DownloadAccessCode {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

let tableInitialized = false;

export async function ensureAccessCodeTable(): Promise<boolean> {
  if (tableInitialized) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DownloadAccessCode" (
        "id" TEXT PRIMARY KEY,
        "code" TEXT NOT NULL,
        "label" TEXT NOT NULL DEFAULT 'Master Download Access Code',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "lastUsedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "idx_download_access_code_lower" ON "DownloadAccessCode" (LOWER("code"));
    `);

    // Check if at least one default code exists, if not initialize with a secure default
    const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      `SELECT COUNT(*) as count FROM "DownloadAccessCode"`
    );
    const count = Number(countRows?.[0]?.count ?? 0);

    if (count === 0) {
      const defaultId = `dac_${Date.now()}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DownloadAccessCode" ("id", "code", "label", "isActive", "usageCount", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        defaultId,
        "TECHBD-VIP-ACCESS",
        "Admin Master Access Code"
      );
    }

    tableInitialized = true;
    return true;
  } catch (err) {
    console.error("Failed to ensure DownloadAccessCode table:", err);
    return false;
  }
}

/**
 * Retrieve the primary active download access code
 */
export async function getActiveDownloadAccessCode(): Promise<DownloadAccessCode | null> {
  await ensureAccessCodeTable();
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "code", "label", "isActive", "usageCount", "lastUsedAt", "createdAt", "updatedAt"
       FROM "DownloadAccessCode"
       WHERE "isActive" = true
       ORDER BY "updatedAt" DESC
       LIMIT 1`
    );

    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      code: String(r.code),
      label: String(r.label || "Master Download Access Code"),
      isActive: Boolean(r.isActive),
      usageCount: Number(r.usageCount ?? 0),
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    };
  } catch (err) {
    console.error("Error getting active download access code:", err);
    return null;
  }
}

/**
 * Retrieve all configured download access codes
 */
export async function getAllDownloadAccessCodes(): Promise<DownloadAccessCode[]> {
  await ensureAccessCodeTable();
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "code", "label", "isActive", "usageCount", "lastUsedAt", "createdAt", "updatedAt"
       FROM "DownloadAccessCode"
       ORDER BY "createdAt" DESC`
    );

    return (rows || []).map((r) => ({
      id: String(r.id),
      code: String(r.code),
      label: String(r.label || "Download Access Code"),
      isActive: Boolean(r.isActive),
      usageCount: Number(r.usageCount ?? 0),
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Error getting download access codes:", err);
    return [];
  }
}

/**
 * Set or update the primary download access code
 */
export async function setDownloadAccessCode(params: {
  code: string;
  label?: string;
  isActive?: boolean;
}): Promise<DownloadAccessCode> {
  await ensureAccessCodeTable();

  const cleanCode = params.code.trim();
  const cleanLabel = params.label?.trim() || "Master Download Access Code";
  const isActive = params.isActive ?? true;

  // Check if an entry already exists to update
  const existing = await getAllDownloadAccessCodes();

  if (existing.length > 0) {
    const targetId = existing[0].id;
    await prisma.$executeRawUnsafe(
      `UPDATE "DownloadAccessCode"
       SET "code" = $1, "label" = $2, "isActive" = $3, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $4`,
      cleanCode,
      cleanLabel,
      isActive,
      targetId
    );

    return {
      ...existing[0],
      code: cleanCode,
      label: cleanLabel,
      isActive,
      updatedAt: new Date().toISOString(),
    };
  }

  // Create new code entry
  const newId = `dac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO "DownloadAccessCode" ("id", "code", "label", "isActive", "usageCount", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    newId,
    cleanCode,
    cleanLabel,
    isActive
  );

  return {
    id: newId,
    code: cleanCode,
    label: cleanLabel,
    isActive,
    usageCount: 0,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Toggle active status of a download access code
 */
export async function toggleDownloadAccessCode(
  id: string,
  isActive: boolean
): Promise<boolean> {
  await ensureAccessCodeTable();
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "DownloadAccessCode" SET "isActive" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
      isActive,
      id
    );
    return true;
  } catch (err) {
    console.error("Error toggling download access code:", err);
    return false;
  }
}

/**
 * Validate an input code submitted by user/guest.
 * If valid, increments usageCount and updates lastUsedAt.
 */
export async function validateDownloadAccessCode(
  inputCode: string
): Promise<{ isValid: boolean; matchedCode?: DownloadAccessCode }> {
  if (!inputCode) return { isValid: false };
  await ensureAccessCodeTable();

  const clean = inputCode.trim().toLowerCase();

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "code", "label", "isActive", "usageCount", "lastUsedAt", "createdAt", "updatedAt"
       FROM "DownloadAccessCode"
       WHERE "isActive" = true AND LOWER("code") = $1
       LIMIT 1`,
      clean
    );

    if (!rows || rows.length === 0) {
      return { isValid: false };
    }

    const r = rows[0];
    const matchedId = String(r.id);

    // Asynchronously increment usage counter and touch lastUsedAt
    prisma.$executeRawUnsafe(
      `UPDATE "DownloadAccessCode"
       SET "usageCount" = "usageCount" + 1, "lastUsedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $1`,
      matchedId
    ).catch(() => {});

    return {
      isValid: true,
      matchedCode: {
        id: matchedId,
        code: String(r.code),
        label: String(r.label || "Master Download Access Code"),
        isActive: Boolean(r.isActive),
        usageCount: Number(r.usageCount ?? 0) + 1,
        lastUsedAt: new Date().toISOString(),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error("Error validating download access code:", err);
    return { isValid: false };
  }
}

