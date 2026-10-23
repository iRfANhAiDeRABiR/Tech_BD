import { Metadata } from "next";
import { getAllCoupons } from "@/lib/coupons-store";
import { CouponsClient } from "@/components/admin/CouponsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discount Coupons | Admin Dashboard",
  description: "Manage discount coupons, active/inactive states, usage limits, and expiration.",
};

export default async function AdminCouponsPage() {
  const coupons = await getAllCoupons();

  return <CouponsClient initialCoupons={coupons} />;
}

