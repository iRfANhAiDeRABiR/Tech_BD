import { getAllSupportTicketsServer } from "@/lib/support-tickets-store";
import { AdminTicketsManager } from "@/components/admin/AdminTicketsManager";

export const metadata = {
  title: "Support Tickets Management | Tech Solutions BD Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await getAllSupportTicketsServer();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: 750, color: "var(--account-title, #0f172a)" }}>
          Support Tickets Desk
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--account-muted, #64748b)" }}>
          Manage customer assistance requests, answer in-thread, view system diagnostics, and track resolution statuses.
        </p>
      </div>

      <AdminTicketsManager initialTickets={tickets} />
    </div>
  );
}

