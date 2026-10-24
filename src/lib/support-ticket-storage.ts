import {
  SupportTicket,
  SupportTicketMessage,
  CreateTicketInput,
} from "@/types/support-ticket";

const STORAGE_KEY = "techbd_support_tickets_v1";

/**
 * Capture browser and client environment for faster diagnostic troubleshooting
 */
export function getClientDiagnosticDetails(): string {
  if (typeof window === "undefined") return "Server-rendered context";

  try {
    const nav = window.navigator;
    const ua = nav.userAgent || "";
    let os = "Unknown OS";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    let browser = "Browser";
    if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
    else if (/Chrome\//i.test(ua)) browser = "Google Chrome";
    else if (/Safari\//i.test(ua)) browser = "Apple Safari";
    else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const locale = nav.language || "en";

    return `${browser} on ${os} (${screenRes}, ${locale})`;
  } catch {
    return "Browser environment";
  }
}

/**
 * Format relative time (e.g., "about 4 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "just now";
    if (diffMin === 1) return "1 minute ago";
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHours === 1) return "about 1 hour ago";
    if (diffHours < 24) return `about ${diffHours} hours ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}

/**
 * Get all support tickets for this customer from local storage
 * Defaults to clean empty array (no third-party sample data).
 */
export function getStoredTickets(): SupportTicket[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any legacy sample tickets from another platform
      return parsed.filter((t) => t.id !== "tkt-59c66c" && t.ticketCode !== "59C66C");
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Save tickets to storage
 */
export function saveStoredTickets(tickets: SupportTicket[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    // ignore quota errors
  }
}

/**
 * Generate a clean 6-character alphanumeric ticket code like #59C66C
 */
export function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Add a new ticket
 */
export function createStoredTicket(input: CreateTicketInput): SupportTicket {
  const existing = getStoredTickets();
  const ticketCode = generateTicketCode();
  const now = new Date().toISOString();

  const newTicket: SupportTicket = {
    id: `tkt-${ticketCode.toLowerCase()}`,
    ticketCode,
    subject: input.subject.trim(),
    category: input.category,
    priority: input.priority,
    status: "Open",
    orderNumber: input.orderNumber?.trim() || undefined,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail.trim(),
    deviceInfo: input.deviceInfo || getClientDiagnosticDetails(),
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "customer",
        senderName: input.customerName.trim(),
        message: input.description.trim(),
        createdAt: now,
      },
    ],
  };

  const updated = [newTicket, ...existing];
  saveStoredTickets(updated);
  return newTicket;
}

/**
 * Add a message to an existing ticket thread
 */
export function addMessageToTicket(
  ticketId: string,
  message: string,
  sender: "customer" | "support",
  senderName: string
): SupportTicket | null {
  const existing = getStoredTickets();
  const index = existing.findIndex((t) => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const target = existing[index];

  const newMsg: SupportTicketMessage = {
    id: `msg-${Date.now()}`,
    sender,
    senderName,
    message: message.trim(),
    createdAt: now,
  };

  const updatedTicket: SupportTicket = {
    ...target,
    updatedAt: now,
    status: sender === "customer" && target.status === "Closed" ? "In Progress" : target.status,
    messages: [...target.messages, newMsg],
  };

  existing[index] = updatedTicket;
  saveStoredTickets(existing);
  return updatedTicket;
}

/**
 * Change ticket status (e.g., mark as Closed or In Progress)
 */
export function updateTicketStatus(
  ticketId: string,
  status: SupportTicket["status"]
): SupportTicket | null {
  const existing = getStoredTickets();
  const index = existing.findIndex((t) => t.id === ticketId);
  if (index === -1) return null;

  existing[index] = {
    ...existing[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  saveStoredTickets(existing);
  return existing[index];
}
