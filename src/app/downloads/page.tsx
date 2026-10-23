import type { Metadata } from "next";
import { DownloadsPageClient } from "@/components/downloads/DownloadsPageClient";
import { getSoftwareDownloads } from "@/lib/software-downloads-store";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Software Download Center | Tech Solutions BD",
  description:
    "অফিসিয়াল এবং নিরাপদ মাইক্রোসফট সফটওয়্যার ডাউনলোড লিঙ্কসমূহ। Office 2024, Office 365, Windows 11 Pro, Windows 10 Pro, Visio, Project সরাসরি অফিশিয়াল মাইক্রোসফট সিডিএন (CDN) থেকে ডাউনলোড করুন।",
  keywords: [
    "Software download",
    "Office 2024 download",
    "Office 365 download",
    "Windows 11 Pro ISO download",
    "Windows 10 Pro ISO",
    "Visio download",
    "Project download",
    "Tech Solutions BD software download",
  ],
};

export default async function DownloadsPage() {
  const items = await getSoftwareDownloads({ activeOnly: true });

  let initialUserVerified = false;
  let verifiedOrderNumber: string | null = null;
  let userLoggedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      userLoggedIn = true;
      const confirmedOrder = await prisma.order.findFirst({
        where: {
          customerEmail: { equals: user.email, mode: "insensitive" },
          OR: [
            { status: { in: ["COMPLETED", "PAID"] } },
            { payment: { status: "VERIFIED" } },
          ],
        },
        select: { orderNumber: true },
        orderBy: { createdAt: "desc" },
      });

      if (confirmedOrder) {
        initialUserVerified = true;
        verifiedOrderNumber = confirmedOrder.orderNumber;
      }
    }
  } catch (err) {
    console.error("DownloadsPage user check error:", err);
  }

  return (
    <DownloadsPageClient
      initialItems={items}
      initialUserVerified={initialUserVerified}
      initialVerifiedOrderNumber={verifiedOrderNumber}
      initialUserLoggedIn={userLoggedIn}
    />
  );
}
