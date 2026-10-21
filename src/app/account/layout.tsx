import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountSidebar from "./AccountSidebar";
import AccountMobileMenu from "./AccountMobileMenu";
import styles from "./layout.module.css";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch minimal profile data for sidebar user card
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name || profile?.username || user.email?.split("@")[0] || "User";
  const displayEmail = user.email || "";

  return (
    <div className={styles.accountLayout}>
      {/* Desktop Sidebar */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userEmail}>{displayEmail}</span>
          </div>
        </div>
        <AccountSidebar />
      </aside>

      {/* Mobile Menu Toggle */}
      <div className={styles.mobileMenuWrapper}>
        <AccountMobileMenu displayName={displayName} />
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}