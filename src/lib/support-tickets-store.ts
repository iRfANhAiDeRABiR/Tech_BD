import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import {
  SupportTicket,
  SupportTicketMessage,
  CreateTicketInput,
  TicketStatus,
  TicketPriority,
} from "@/types/support-ticket";

const JSON_STORE_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "support-tickets.json"
);

const globalForTickets = globalThis as unknown as {
  __isTicketsTableInitialized?: boolean;
};

// Fallback JSON operations
async function readJsonFallback(): Promise<SupportTicket[]> {
  try {
    const content = await fs.readFile(JSON_STORE_PATH, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonFallback(tickets: SupportTicket[]): Promise<void> {
  try {
    const dir = path.dirname(JSON_STORE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(JSON_STORE_PATH, JSON.stringify(tickets, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write to fallback support-tickets.json:", err);
  }
}

export async function ensureSupportTicketTable(): Promise<boolean> {
  if (globalForTickets.__isTicketsTableInitialized) return true;
  if (!process.env.DATABASE_URL) return false;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SupportTicket" (
        "id" TEXT PRIMARY KEY,
        "ticketCode" TEXT NOT NULL UNIQUE,
        "subject" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "priority" TEXT NOT NULL DEFAULT 'Normal',
        "status" TEXT NOT NULL DEFAULT 'Open',
        "customerName" TEXT NOT NULL,
        "customerPhone" TEXT NOT NULL DEFAULT '',
        "customerEmail" TEXT NOT NULL,
        "orderNumber" TEXT,
        "deviceInfo" TEXT,
        "messagesJson" TEXT NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "idx_support_ticket_code" ON "SupportTicket" ("ticketCode");
      CREATE INDEX IF NOT EXISTS "idx_support_ticket_status" ON "SupportTicket" ("status");
      CREATE INDEX IF NOT EXISTS "idx_support_ticket_email" ON "SupportTicket" ("customerEmail");
    `);

    globalForTickets.__isTicketsTableInitialized = true;
    return true;
  } catch (err) {
    console.warn("Could not initialize SupportTicket PostgreSQL table, using JSON fallback:", err);
    return false;
  }
}

interface RawTicketRow {
  id: string;
  ticketCode: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderNumber: string | null;
  deviceInfo: string | null;
  messagesJson: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function mapRowToTicket(row: RawTicketRow): SupportTicket {
  let messages: SupportTicketMessage[] = [];
  try {
    messages = typeof row.messagesJson === "string" ? JSON.parse(row.messagesJson) : [];
  } catch {
    messages = [];
  }

  return {
    id: row.id,
    ticketCode: row.ticketCode,
    subject: row.subject,
    category: row.category as any,
    priority: (row.priority as TicketPriority) || "Normal",
    status: (row.status as TicketStatus) || "Open",
    customerName: row.customerName,
    customerPhone: row.customerPhone || "",
    customerEmail: row.customerEmail,
    orderNumber: row.orderNumber || undefined,
    deviceInfo: row.deviceInfo || undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    messages,
  };
}

export async function getAllSupportTicketsServer(options?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<SupportTicket[]> {
  const hasDb = await ensureSupportTicketTable();

  if (!hasDb) {
    const list = await readJsonFallback();
    return filterTickets(list, options);
  }

  try {
    const rows = await prisma.$queryRawUnsafe<RawTicketRow[]>(`
      SELECT * FROM "SupportTicket"
      ORDER BY "updatedAt" DESC
    `);

    const tickets = rows.map(mapRowToTicket);
    // Sync to local JSON fallback in background
    writeJsonFallback(tickets).catch(() => {});
    return filterTickets(tickets, options);
  } catch (err) {
    console.warn("DB error loading tickets, falling back to JSON:", err);
    const list = await readJsonFallback();
    return filterTickets(list, options);
  }
}

function filterTickets(
  tickets: SupportTicket[],
  options?: { status?: string; category?: string; search?: string }
): SupportTicket[] {
  let filtered = [...tickets];

  if (options?.status && options.status !== "all" && options.status !== "All") {
    filtered = filtered.filter(
      (t) => t.status.toLowerCase() === options.status?.toLowerCase()
    );
  }

  if (options?.category && options.category !== "all" && options.category !== "All") {
    filtered = filtered.filter(
      (t) => t.category.toLowerCase() === options.category?.toLowerCase()
    );
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.ticketCode.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.toLowerCase().includes(q) ||
        t.customerEmail.toLowerCase().includes(q) ||
        (t.orderNumber && t.orderNumber.toLowerCase().includes(q))
    );
  }

  return filtered;
}

export async function getSupportTicketByIdServer(id: string): Promise<SupportTicket | null> {
  const hasDb = await ensureSupportTicketTable();

  if (hasDb) {
    try {
      const rows = await prisma.$queryRawUnsafe<RawTicketRow[]>(
        `SELECT * FROM "SupportTicket" WHERE "id" = $1 OR "ticketCode" = $1 LIMIT 1`,
        id
      );
      if (rows && rows.length > 0) {
        return mapRowToTicket(rows[0]);
      }
    } catch {
      // Fallback
    }
  }

  const list = await readJsonFallback();
  return list.find((t) => t.id === id || t.ticketCode === id) || null;
}

export async function createSupportTicketServer(
  input: CreateTicketInput & { ticketCode?: string }
): Promise<SupportTicket> {
  const code = input.ticketCode || Math.random().toString(36).substring(2, 8).toUpperCase();
  const id = `tkt-${code.toLowerCase()}`;
  const now = new Date();

  const firstMsg: SupportTicketMessage = {
    id: `msg-${Date.now()}`,
    sender: "customer",
    senderName: input.customerName.trim(),
    message: input.description.trim(),
    createdAt: now.toISOString(),
  };

  const newTicket: SupportTicket = {
    id,
    ticketCode: code,
    subject: input.subject.trim(),
    category: input.category,
    priority: input.priority || "Normal",
    status: "Open",
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail.trim(),
    orderNumber: input.orderNumber?.trim() || undefined,
    deviceInfo: input.deviceInfo || undefined,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    messages: [firstMsg],
  };

  const hasDb = await ensureSupportTicketTable();
  if (hasDb) {
    try {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "SupportTicket" (
          "id", "ticketCode", "subject", "category", "priority", "status",
          "customerName", "customerPhone", "customerEmail", "orderNumber",
          "deviceInfo", "messagesJson", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT ("id") DO UPDATE SET
          "messagesJson" = EXCLUDED."messagesJson",
          "updatedAt" = EXCLUDED."updatedAt"
      `,
        id,
        code,
        newTicket.subject,
        newTicket.category,
        newTicket.priority,
        newTicket.status,
        newTicket.customerName,
        newTicket.customerPhone,
        newTicket.customerEmail,
        newTicket.orderNumber || null,
        newTicket.deviceInfo || null,
        JSON.stringify(newTicket.messages),
        now,
        now
      );
    } catch (e) {
      console.warn("DB insert error, saving to JSON fallback:", e);
    }
  }

  // Always update JSON fallback
  const list = await readJsonFallback();
  const updatedList = [newTicket, ...list.filter((t) => t.id !== id)];
  await writeJsonFallback(updatedList);

  return newTicket;
}

export async function addReplyToSupportTicketServer(
  ticketId: string,
  message: string,
  sender: "customer" | "support",
  senderName: string
): Promise<SupportTicket | null> {
  const ticket = await getSupportTicketByIdServer(ticketId);
  if (!ticket) return null;

  const now = new Date();
  const newMsg: SupportTicketMessage = {
    id: `msg-${Date.now()}`,
    sender,
    senderName,
    message: message.trim(),
    createdAt: now.toISOString(),
  };

  const updatedMessages = [...ticket.messages, newMsg];
  const nextStatus: TicketStatus =
    sender === "support"
      ? ticket.status === "Open" ? "In Progress" : ticket.status
      : ticket.status === "Closed" || ticket.status === "Resolved" ? "In Progress" : ticket.status;

  const updatedTicket: SupportTicket = {
    ...ticket,
    status: nextStatus,
    updatedAt: now.toISOString(),
    messages: updatedMessages,
  };

  const hasDb = await ensureSupportTicketTable();
  if (hasDb) {
    try {
      await prisma.$executeRawUnsafe(
        `
        UPDATE "SupportTicket"
        SET "messagesJson" = $1, "status" = $2, "updatedAt" = $3
        WHERE "id" = $4 OR "ticketCode" = $4
      `,
        JSON.stringify(updatedMessages),
        nextStatus,
        now,
        ticket.id
      );
    } catch (e) {
      console.warn("DB update error:", e);
    }
  }

  const list = await readJsonFallback();
  const idx = list.findIndex((t) => t.id === ticket.id);
  if (idx !== -1) {
    list[idx] = updatedTicket;
  } else {
    list.unshift(updatedTicket);
  }
  await writeJsonFallback(list);

  return updatedTicket;
}

export async function updateSupportTicketStatusServer(
  ticketId: string,
  status: TicketStatus,
  priority?: TicketPriority
): Promise<SupportTicket | null> {
  const ticket = await getSupportTicketByIdServer(ticketId);
  if (!ticket) return null;

  const now = new Date();
  const nextPriority = priority || ticket.priority;

  const updatedTicket: SupportTicket = {
    ...ticket,
    status,
    priority: nextPriority,
    updatedAt: now.toISOString(),
  };

  const hasDb = await ensureSupportTicketTable();
  if (hasDb) {
    try {
      await prisma.$executeRawUnsafe(
        `
        UPDATE "SupportTicket"
        SET "status" = $1, "priority" = $2, "updatedAt" = $3
        WHERE "id" = $4 OR "ticketCode" = $4
      `,
        status,
        nextPriority,
        now,
        ticket.id
      );
    } catch (e) {
      console.warn("DB update error:", e);
    }
  }

  const list = await readJsonFallback();
  const idx = list.findIndex((t) => t.id === ticket.id);
  if (idx !== -1) {
    list[idx] = updatedTicket;
    await writeJsonFallback(list);
  }

  return updatedTicket;
}

