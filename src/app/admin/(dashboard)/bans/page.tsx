import { Metadata } from "next";
import { headers } from "next/headers";
import { getAllBans, getRegisteredUsersList } from "@/lib/bans-store";
import { AccessBansClient } from "@/components/admin/AccessBansClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Access Control & Bans | Admin Dashboard",
  description: "Manage banned IP addresses and suspended user accounts.",
};

export default async function AdminBansPage() {
  const reqHeaders = await headers();
  const rawFwd = reqHeaders.get("x-forwarded-for");
  const rawReal = reqHeaders.get("x-real-ip");
  const rawCf = reqHeaders.get("cf-connecting-ip");

  let visitorIp = "127.0.0.1";
  if (rawCf) visitorIp = rawCf.trim();
  else if (rawReal) visitorIp = rawReal.trim();
  else if (rawFwd) visitorIp = rawFwd.split(",")[0]?.trim() || "127.0.0.1";

  const [bans, users] = await Promise.all([
    getAllBans(),
    getRegisteredUsersList(),
  ]);

  return (
    <AccessBansClient
      initialBans={bans}
      registeredUsers={users}
      visitorIp={visitorIp}
    />
  );
}

