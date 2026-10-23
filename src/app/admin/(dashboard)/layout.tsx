import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Suspense } from "react";
import { AdminToastListener } from "@/components/admin/AdminToastListener";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { AdminLanguageProvider } from "@/context/AdminLanguageContext";
import { logoutAction } from "../actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <AdminLanguageProvider>
      <Suspense fallback={null}>
        <AdminToastListener />
      </Suspense>
      <AdminLayoutClient
        userEmail={session.user.email}
        logoutAction={logoutAction}
      >
        {children}
      </AdminLayoutClient>
    </AdminLanguageProvider>
  );
}
