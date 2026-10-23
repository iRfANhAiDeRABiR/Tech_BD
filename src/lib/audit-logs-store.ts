import prisma from "@/lib/prisma";

export type EventCategory =
  | "ORDERS"
  | "CATALOG"
  | "CATEGORIES"
  | "DOWNLOADS"
  | "SECURITY"
  | "AUTH"
  | "SYSTEM";

export type EventSeverity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

export interface AdminEventLogItem {
  id: string;
  action: string;
  category: EventCategory;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: string | null;
  adminEmail: string | null;
  ipAddress: string | null;
  severity: EventSeverity;
  createdAt: string;
}

export interface CreateEventLogInput {
  action: string;
  category: EventCategory;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  details?: Record<string, any> | string | null;
  adminEmail?: string | null;
  ipAddress?: string | null;
  severity?: EventSeverity;
}

let isTableInitialized = false;

export async function ensureEventLogTable(): Promise<boolean> {
  if (isTableInitialized) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminEventLog" (
        "id" TEXT PRIMARY KEY,
        "action" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'SYSTEM',
        "entityType" TEXT NOT NULL DEFAULT 'General',
        "entityId" TEXT,
        "entityName" TEXT,
        "details" TEXT,
        "adminEmail" TEXT,
        "ipAddress" TEXT,
        "severity" TEXT NOT NULL DEFAULT 'INFO',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "idx_admin_event_log_created_at" ON "AdminEventLog" ("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS "idx_admin_event_log_category" ON "AdminEventLog" ("category");
      CREATE INDEX IF NOT EXISTS "idx_admin_event_log_action" ON "AdminEventLog" ("action");
      CREATE INDEX IF NOT EXISTS "idx_admin_event_log_admin_email" ON "AdminEventLog" ("adminEmail");
      CREATE INDEX IF NOT EXISTS "idx_admin_event_log_entity_id" ON "AdminEventLog" ("entityId");
    `);
    isTableInitialized = true;
    return true;
  } catch (err) {
    console.error("Failed to ensure AdminEventLog table:", err);
    return false;
  }
}

export async function logAdminEvent(input: CreateEventLogInput): Promise<AdminEventLogItem | null> {
  await ensureEventLogTable();

  try {
    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const action = input.action.trim();
    const category = input.category;
    const entityType = input.entityType || "General";
    const entityId = input.entityId ? String(input.entityId).trim() : null;
    const entityName = input.entityName ? String(input.entityName).trim() : null;
    
    let detailsString: string | null = null;
    if (typeof input.details === "object" && input.details !== null) {
      detailsString = JSON.stringify(input.details);
    } else if (typeof input.details === "string") {
      detailsString = input.details.trim();
    }

    const adminEmail = input.adminEmail ? String(input.adminEmail).trim() : null;
    const ipAddress = input.ipAddress ? String(input.ipAddress).trim() : null;
    const severity = input.severity || "INFO";

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "AdminEventLog" (
        "id", "action", "category", "entityType", "entityId", "entityName", "details", "adminEmail", "ipAddress", "severity", "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP
      )
    `,
      id,
      action,
      category,
      entityType,
      entityId,
      entityName,
      detailsString,
      adminEmail,
      ipAddress,
      severity
    );

    return {
      id,
      action,
      category,
      entityType,
      entityId,
      entityName,
      details: detailsString,
      adminEmail,
      ipAddress,
      severity,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Failed to record admin event log:", err);
    return null;
  }
}

export async function getAdminEventLogs(options?: {
  category?: string;
  severity?: string;
  search?: string;
  limit?: number;
}): Promise<AdminEventLogItem[]> {
  await ensureEventLogTable();

  try {
    const limit = options?.limit || 200;
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        "id", "action", "category", "entityType", "entityId", "entityName", 
        "details", "adminEmail", "ipAddress", "severity", "createdAt"
      FROM "AdminEventLog"
      ORDER BY "createdAt" DESC
      LIMIT ${Number(limit)}
    `);

    let items: AdminEventLogItem[] = (rows || []).map((row) => ({
      id: String(row.id),
      action: String(row.action),
      category: row.category as EventCategory,
      entityType: String(row.entityType || "General"),
      entityId: row.entityId ? String(row.entityId) : null,
      entityName: row.entityName ? String(row.entityName) : null,
      details: row.details ? String(row.details) : null,
      adminEmail: row.adminEmail ? String(row.adminEmail) : null,
      ipAddress: row.ipAddress ? String(row.ipAddress) : null,
      severity: (row.severity as EventSeverity) || "INFO",
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    }));

    if (options?.category && options.category !== "ALL") {
      items = items.filter((item) => item.category === options.category);
    }

    if (options?.severity && options.severity !== "ALL") {
      items = items.filter((item) => item.severity === options.severity);
    }

    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.action.toLowerCase().includes(q) ||
          item.entityType.toLowerCase().includes(q) ||
          (item.entityName && item.entityName.toLowerCase().includes(q)) ||
          (item.entityId && item.entityId.toLowerCase().includes(q)) ||
          (item.adminEmail && item.adminEmail.toLowerCase().includes(q)) ||
          (item.details && item.details.toLowerCase().includes(q)) ||
          (item.ipAddress && item.ipAddress.toLowerCase().includes(q))
      );
    }

    return items;
  } catch (err) {
    console.error("Error fetching admin event logs:", err);
    return [];
  }
}

export interface RecentIpActivityItem {
  ip: string;
  count: number;
  lastSeenAt: string;
  lastAction: string;
  associatedEmail: string | null;
  associatedName: string | null;
  orderNumber?: string | null;
  isBanned: boolean;
  banId: string | null;
}

export async function getRecentIpActivityList(): Promise<RecentIpActivityItem[]> {
  await ensureEventLogTable();

  try {
    // 1. Get recent logs that have an ipAddress
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT "ipAddress" as ip, "action", "entityName", "adminEmail", "details", "createdAt"
      FROM "AdminEventLog"
      WHERE "ipAddress" IS NOT NULL AND "ipAddress" != ''
      ORDER BY "createdAt" DESC
      LIMIT 300
    `).catch(() => []);

    // 2. Also check recent orders
    const recentOrders = await prisma.order.findMany({
      take: 60,
      orderBy: { createdAt: "desc" },
      select: {
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        notes: true,
        createdAt: true,
      },
    }).catch(() => []);

    // 3. Get active IP bans from AccessBan
    const activeBans = await prisma.$queryRawUnsafe<any[]>(`
      SELECT "id", "target" FROM "AccessBan" WHERE "type" = 'IP' AND "isActive" = true
    `).catch(() => []);

    const bannedMap = new Map<string, string>();
    for (const b of activeBans || []) {
      bannedMap.set(String(b.target).trim(), String(b.id));
    }

    const ipMap = new Map<string, RecentIpActivityItem>();

    // Process orders first
    for (const ord of recentOrders) {
      if (ord.notes) {
        const match = ord.notes.match(/\[IP:\s*([^\]]+)\]/i);
        if (match && match[1]) {
          const ip = match[1].trim();
          if (ip && ip !== "unknown") {
            ipMap.set(ip, {
              ip,
              count: 1,
              lastSeenAt: new Date(ord.createdAt).toISOString(),
              lastAction: `অর্ডার সম্পন্ন: ${ord.orderNumber}`,
              associatedEmail: ord.customerEmail || null,
              associatedName: ord.customerName || null,
              orderNumber: ord.orderNumber,
              isBanned: bannedMap.has(ip),
              banId: bannedMap.get(ip) || null,
            });
          }
        }
      }
    }

    // Process event logs
    for (const row of rows || []) {
      const ip = String(row.ip).trim();
      if (!ip || ip === "unknown") continue;

      let name: string | null = null;
      let email: string | null = row.adminEmail ? String(row.adminEmail) : null;
      let orderNum: string | null = null;

      if (row.details) {
        try {
          const parsed = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
          if (parsed.customerName) name = parsed.customerName;
          if (parsed.customerEmail) email = parsed.customerEmail;
          if (parsed.orderNumber) orderNum = parsed.orderNumber;
        } catch {}
      }

      const existing = ipMap.get(ip);
      if (existing) {
        existing.count += 1;
        if (!existing.associatedName && name) existing.associatedName = name;
        if (!existing.associatedEmail && email) existing.associatedEmail = email;
        if (!existing.orderNumber && orderNum) existing.orderNumber = orderNum;
      } else {
        ipMap.set(ip, {
          ip,
          count: 1,
          lastSeenAt: new Date(row.createdAt).toISOString(),
          lastAction: String(row.action),
          associatedEmail: email,
          associatedName: name || (row.entityName ? String(row.entityName) : null),
          orderNumber: orderNum,
          isBanned: bannedMap.has(ip),
          banId: bannedMap.get(ip) || null,
        });
      }
    }

    return Array.from(ipMap.values()).sort(
      (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    );
  } catch (err) {
    console.error("Error in getRecentIpActivityList:", err);
    return [];
  }
}

export async function clearAllLogs(): Promise<boolean> {
  await ensureEventLogTable();
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "AdminEventLog"`);
    return true;
  } catch (err) {
    console.error("Error clearing admin event logs:", err);
    return false;
  }
}

