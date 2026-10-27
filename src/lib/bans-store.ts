import prisma from "@/lib/prisma";
import { invalidateProxyBanCache } from "@/proxy";

export type BanType = "IP" | "USER";

export interface AccessBanItem {
  id: string;
  type: BanType;
  target: string;
  targetEmail: string | null;
  targetPhone: string | null;
  targetUserId: string | null;
  targetUsername: string | null;
  reason: string;
  notes: string | null;
  bannedBy: string | null;
  isActive: boolean;
  expiresAt: string | null;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBanInput {
  type: BanType;
  target: string;
  targetEmail?: string | null;
  targetPhone?: string | null;
  targetUserId?: string | null;
  targetUsername?: string | null;
  reason?: string;
  notes?: string | null;
  bannedBy?: string | null;
  expiresAt?: string | Date | null;
}

export interface RegisteredUserSummary {
  id: string;
  username: string | null;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
}

// In-memory cache for ultra-fast middleware and route checks
let cachedBans: AccessBanItem[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20_000; // 20 seconds
const globalForBans = globalThis as unknown as {
  __isBansTableInitialized?: boolean;
};

export async function ensureBanTable(): Promise<boolean> {
  if (globalForBans.__isBansTableInitialized) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AccessBan" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "target" TEXT NOT NULL,
        "targetEmail" TEXT,
        "targetPhone" TEXT,
        "targetUserId" TEXT,
        "targetUsername" TEXT,
        "reason" TEXT NOT NULL DEFAULT 'Policy violation',
        "notes" TEXT,
        "bannedBy" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP(3),
        "hitCount" INTEGER NOT NULL DEFAULT 0,
        "lastHitAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "idx_access_ban_target" ON "AccessBan" ("target");
      CREATE INDEX IF NOT EXISTS "idx_access_ban_type_active" ON "AccessBan" ("type", "isActive");
      CREATE INDEX IF NOT EXISTS "idx_access_ban_target_email" ON "AccessBan" ("targetEmail");
      CREATE INDEX IF NOT EXISTS "idx_access_ban_target_user_id" ON "AccessBan" ("targetUserId");
    `);
    globalForBans.__isBansTableInitialized = true;
    return true;
  } catch (err) {
    console.error("Failed to ensure AccessBan table:", err);
    return false;
  }
}

export function invalidateBanCache() {
  cachedBans = null;
  lastCacheTime = 0;
  try {
    invalidateProxyBanCache();
  } catch {
    // Non-blocking
  }
}

export async function getAllBans(options?: {
  type?: string;
  status?: string;
  search?: string;
}): Promise<AccessBanItem[]> {
  await ensureBanTable();

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        "id", "type", "target", "targetEmail", "targetPhone", "targetUserId", "targetUsername",
        "reason", "notes", "bannedBy", "isActive", "expiresAt", "hitCount", "lastHitAt", "createdAt", "updatedAt"
      FROM "AccessBan"
      ORDER BY "createdAt" DESC
    `);

    let items: AccessBanItem[] = (rows || []).map((row) => ({
      id: String(row.id),
      type: row.type as BanType,
      target: String(row.target),
      targetEmail: row.targetEmail ? String(row.targetEmail) : null,
      targetPhone: row.targetPhone ? String(row.targetPhone) : null,
      targetUserId: row.targetUserId ? String(row.targetUserId) : null,
      targetUsername: row.targetUsername ? String(row.targetUsername) : null,
      reason: String(row.reason || "Policy violation"),
      notes: row.notes ? String(row.notes) : null,
      bannedBy: row.bannedBy ? String(row.bannedBy) : null,
      isActive: Boolean(row.isActive),
      expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
      hitCount: Number(row.hitCount ?? 0),
      lastHitAt: row.lastHitAt ? new Date(row.lastHitAt).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    }));

    // Filtering
    if (options?.type && options.type !== "ALL") {
      items = items.filter((item) => item.type === options.type);
    }

    if (options?.status) {
      const now = new Date();
      if (options.status === "ACTIVE") {
        items = items.filter((item) => item.isActive && (!item.expiresAt || new Date(item.expiresAt) > now));
      } else if (options.status === "EXPIRED") {
        items = items.filter((item) => item.isActive && item.expiresAt && new Date(item.expiresAt) <= now);
      } else if (options.status === "REVOKED") {
        items = items.filter((item) => !item.isActive);
      }
    }

    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.target.toLowerCase().includes(q) ||
          (item.targetEmail && item.targetEmail.toLowerCase().includes(q)) ||
          (item.targetUsername && item.targetUsername.toLowerCase().includes(q)) ||
          (item.targetPhone && item.targetPhone.toLowerCase().includes(q)) ||
          item.reason.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    return items;
  } catch (err) {
    console.error("Error fetching access bans:", err);
    return [];
  }
}

export async function getActiveBansCached(): Promise<AccessBanItem[]> {
  const now = Date.now();
  if (cachedBans && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedBans;
  }

  const all = await getAllBans();
  const currentDate = new Date();
  cachedBans = all.filter(
    (ban) => ban.isActive && (!ban.expiresAt || new Date(ban.expiresAt) > currentDate)
  );
  lastCacheTime = now;
  return cachedBans;
}

export async function createBan(input: CreateBanInput): Promise<AccessBanItem> {
  await ensureBanTable();

  const id = `ban_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const cleanTarget = input.target.trim();
  const cleanEmail = input.targetEmail?.trim().toLowerCase() || null;
  const cleanPhone = input.targetPhone?.trim() || null;
  const cleanUserId = input.targetUserId?.trim() || null;
  const cleanUsername = input.targetUsername?.trim() || null;
  const cleanReason = input.reason?.trim() || "Policy violation";
  const cleanNotes = input.notes?.trim() || null;
  const cleanBannedBy = input.bannedBy?.trim() || "Admin";

  const expiresDate = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "AccessBan" (
      "id", "type", "target", "targetEmail", "targetPhone", "targetUserId", "targetUsername",
      "reason", "notes", "bannedBy", "isActive", "expiresAt", "hitCount", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11::timestamp, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `,
    id,
    input.type,
    cleanTarget,
    cleanEmail,
    cleanPhone,
    cleanUserId,
    cleanUsername,
    cleanReason,
    cleanNotes,
    cleanBannedBy,
    expiresDate
  );

  invalidateBanCache();

  return {
    id,
    type: input.type,
    target: cleanTarget,
    targetEmail: cleanEmail,
    targetPhone: cleanPhone,
    targetUserId: cleanUserId,
    targetUsername: cleanUsername,
    reason: cleanReason,
    notes: cleanNotes,
    bannedBy: cleanBannedBy,
    isActive: true,
    expiresAt: expiresDate,
    hitCount: 0,
    lastHitAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function revokeBan(id: string): Promise<boolean> {
  await ensureBanTable();
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "AccessBan" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
      id
    );
    invalidateBanCache();
    return true;
  } catch (err) {
    console.error("Error revoking ban:", err);
    return false;
  }
}

export async function reactivateBan(id: string, newExpiresAt?: string | null): Promise<boolean> {
  await ensureBanTable();
  try {
    if (newExpiresAt !== undefined) {
      const expDate = newExpiresAt ? new Date(newExpiresAt).toISOString() : null;
      await prisma.$executeRawUnsafe(
        `UPDATE "AccessBan" SET "isActive" = true, "expiresAt" = $2::timestamp, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
        id,
        expDate
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "AccessBan" SET "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
        id
      );
    }
    invalidateBanCache();
    return true;
  } catch (err) {
    console.error("Error reactivating ban:", err);
    return false;
  }
}

export async function deleteBan(id: string): Promise<boolean> {
  await ensureBanTable();
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "AccessBan" WHERE "id" = $1`, id);
    invalidateBanCache();
    return true;
  } catch (err) {
    console.error("Error deleting ban:", err);
    return false;
  }
}

export async function recordBanHit(id: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "AccessBan" SET "hitCount" = "hitCount" + 1, "lastHitAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
      id
    );
  } catch {
    // Non-blocking
  }
}

export async function checkAccessBan(params: {
  ip?: string | null;
  email?: string | null;
  userId?: string | null;
  phone?: string | null;
}): Promise<{ isBanned: boolean; ban?: AccessBanItem }> {
  try {
    const activeBans = await getActiveBansCached();
    if (!activeBans || activeBans.length === 0) {
      return { isBanned: false };
    }

    const cleanIp = params.ip ? params.ip.trim() : null;
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : null;
    const cleanUserId = params.userId ? params.userId.trim() : null;
    const cleanPhone = params.phone ? params.phone.replace(/[^0-9]/g, "") : null;

    for (const ban of activeBans) {
      // 1. IP Check
      if (ban.type === "IP" && cleanIp) {
        // Direct match
        if (ban.target === cleanIp) {
          // Asynchronously record hit
          recordBanHit(ban.id);
          return { isBanned: true, ban };
        }
        // Subnet check if target contains / (e.g. 192.168.1.0/24)
        if (ban.target.includes("/") && isIpInCidr(cleanIp, ban.target)) {
          recordBanHit(ban.id);
          return { isBanned: true, ban };
        }
      }

      // 2. User Account Check
      if (ban.type === "USER") {
        if (cleanUserId && ban.targetUserId && ban.targetUserId === cleanUserId) {
          recordBanHit(ban.id);
          return { isBanned: true, ban };
        }
        if (cleanEmail && ban.targetEmail && ban.targetEmail.toLowerCase() === cleanEmail) {
          recordBanHit(ban.id);
          return { isBanned: true, ban };
        }
        if (cleanUserId && ban.target === cleanUserId) {
          recordBanHit(ban.id);
          return { isBanned: true, ban };
        }
        if (cleanEmail && ban.target.toLowerCase() === cleanEmail) {
          recordBanHit(ban.id);
          return { isBanned: true, ban };
        }
        if (cleanPhone && ban.targetPhone && ban.targetPhone.replace(/[^0-9]/g, "") === cleanPhone) {
          recordBanHit(ban.id);
          return { isBanned: true, ban };
        }
      }
    }

    return { isBanned: false };
  } catch (err) {
    console.error("Error in checkAccessBan:", err);
    return { isBanned: false };
  }
}

export async function getRegisteredUsersList(): Promise<RegisteredUserSummary[]> {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        "id"::text, 
        "username", 
        "email", 
        "full_name" as "fullName", 
        COALESCE("phone_e164"::text, "whatsapp_e164"::text) as "phone", 
        "created_at" as "createdAt"
      FROM "profiles"
      ORDER BY "created_at" DESC
      LIMIT 200
    `);

    return (rows || []).map((r) => ({
      id: String(r.id),
      username: r.username ? String(r.username) : null,
      email: r.email ? String(r.email) : null,
      fullName: r.fullName ? String(r.fullName) : null,
      phone: r.phone ? String(r.phone) : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn("Could not query profiles for users list:", err);
    return [];
  }
}

export async function unbanIp(ip: string): Promise<boolean> {
  await ensureBanTable();
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "AccessBan" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "type" = 'IP' AND "target" = $1`,
      ip.trim()
    );
    invalidateBanCache();
    return true;
  } catch (err) {
    console.error("Error unbanning IP:", err);
    return false;
  }
}

// Simple IPv4 in CIDR helper
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split("/");
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false;

    const ipParts = ip.split(".").map(Number);
    const rangeParts = range.split(".").map(Number);
    if (ipParts.length !== 4 || rangeParts.length !== 4) return false;

    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const rangeNum = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];

    const mask = bits === 0 ? 0 : (~0 << (32 - bits));
    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

