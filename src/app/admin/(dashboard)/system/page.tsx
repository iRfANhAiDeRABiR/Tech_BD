import { Metadata } from "next";
import { getSystemTelemetry } from "@/lib/diagnostics";
import { SystemHealthView } from "@/components/admin/SystemHealthView";

export const metadata: Metadata = {
  title: "System Health & Diagnostics | Tech BD Admin",
  description: "Comprehensive system status, telemetry, database connection, and services diagnostic console.",
};

// Revalidate or dynamic
export const dynamic = "force-dynamic";

export default async function AdminSystemHealthPage() {
  const telemetry = await getSystemTelemetry();

  return <SystemHealthView initialTelemetry={telemetry} />;
}

