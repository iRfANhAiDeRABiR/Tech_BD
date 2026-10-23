import { Metadata } from "next";
import { getAdminEventLogs } from "@/lib/audit-logs-store";
import { EventLogsClient } from "@/components/admin/EventLogsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event & Audit Logs | Admin Dashboard",
  description: "Detailed event and activity logs of all changes in admin panel.",
};

export default async function AdminLogsPage() {
  const logs = await getAdminEventLogs({ limit: 300 });

  return <EventLogsClient initialLogs={logs} />;
}

