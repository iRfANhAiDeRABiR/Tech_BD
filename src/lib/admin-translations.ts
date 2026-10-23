export type AdminLanguage = "en" | "bn";

export function toBanglaDigits(num: number | string): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (digit) => banglaDigits[Number(digit)] ?? digit);
}

export function formatAdminNumber(num: number | string, lang: AdminLanguage): string {
  const numValue = typeof num === "string" ? Number(num) : num;
  if (isNaN(numValue)) return String(num);

  if (lang === "bn") {
    return toBanglaDigits(numValue.toLocaleString("en-US"));
  }
  return numValue.toLocaleString("en-US");
}

export function formatAdminCurrency(amount: number, lang: AdminLanguage): string {
  const formatted = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);

  return formatted;
}

export function formatAdminDateShort(date: Date | string, lang: AdminLanguage): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (lang === "bn") {
    return new Intl.DateTimeFormat("bn-BD", {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(d);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(d);
}

export const adminStatusTranslations: Record<
  string,
  { en: string; bn: string }
> = {
  PENDING_PAYMENT: { en: "Pending Payment", bn: "পেমেন্ট বাকি" },
  PAYMENT_SUBMITTED: { en: "Payment Submitted", bn: "পেমেন্ট জমা" },
  PAID: { en: "Paid", bn: "পরিশোধিত" },
  PROCESSING: { en: "Processing", bn: "প্রক্রিয়াকরণ" },
  COMPLETED: { en: "Completed", bn: "সম্পন্ন" },
  CANCELLED: { en: "Cancelled", bn: "বাতিল" },
  REFUNDED: { en: "Refunded", bn: "রিফান্ডেড" },
  VERIFIED: { en: "Verified", bn: "যাচাইকৃত" },
  REJECTED: { en: "Rejected", bn: "প্রত্যাখ্যাত" },
  ACTIVE: { en: "Active", bn: "সক্রিয়" },
  DRAFT: { en: "Draft", bn: "ড্রাফট" },
  ARCHIVED: { en: "Archived", bn: "আর্কাইভড" },
  HEALTHY: { en: "Healthy", bn: "সুস্থ" },
  ONLINE: { en: "Online", bn: "অনলাইন" },
  OFFLINE: { en: "Offline", bn: "অফলাইন" },
  ERROR: { en: "Error", bn: "ত্রুটি" },
};

export function getAdminStatusLabel(status: string, lang: AdminLanguage): string {
  const normalized = status.toUpperCase();
  const entry = adminStatusTranslations[normalized];
  if (entry) {
    return entry[lang];
  }
  return status.replace(/_/g, " ").toLowerCase();
}

export interface AdminTranslations {
  // Common Navigation & Top Bar
  top_add_product: string;
  top_sign_out: string;
  top_sign_out_title: string;
  top_switch_theme: string;
  lang_dropdown_title: string;
  lang_english: string;
  lang_english_sub: string;
  lang_bangla: string;
  lang_bangla_sub: string;
  select_language: string;

  // Sidebar Group Labels
  nav_group_management: string;
  nav_group_system: string;
  nav_group_storefront: string;

  // Sidebar Items
  nav_dashboard: string;
  nav_orders: string;
  nav_products: string;
  nav_categories: string;
  nav_downloads: string;
  nav_bans: string;
  nav_logs: string;
  nav_system_health: string;
  nav_live_store: string;
  system_online: string;
  administrator: string;

  // Breadcrumbs
  bc_overview: string;
  bc_dashboard: string;
  bc_orders_management: string;
  bc_order_details: string;
  bc_products_catalog: string;
  bc_create_product: string;
  bc_edit_product: string;
  bc_categories: string;
  bc_downloads: string;
  bc_bans: string;
  bc_logs: string;
  bc_system_health: string;
  bc_admin_console: string;

  // Dashboard Page - Header
  dash_badge: string;
  dash_title: string;
  dash_subtitle: string;
  dash_manage_orders: string;
  dash_add_product: string;

  // Dashboard Page - KPI Cards
  kpi_total_orders_title: string;
  kpi_total_orders_sub: string;
  kpi_pending_verification_title: string;
  kpi_requires_check: string;
  kpi_all_handled: string;
  kpi_action_required: string;
  kpi_active_products_title: string;
  kpi_active_products_sub: (active: string, total: string) => string;
  kpi_categories_title: string;
  kpi_categories_sub: (count: string) => string;

  // Dashboard Page - Chart Section
  chart_title: string;
  chart_orders_count: (count: string) => string;
  chart_last_7_days: string;
  chart_tooltip_orders: string;
  chart_empty_title: string;
  chart_empty_sub: string;

  // Dashboard Page - Quick Operations
  quick_operations_title: string;
  quick_add_product_title: string;
  quick_add_product_sub: string;
  quick_review_orders_title: string;
  quick_review_orders_sub: string;
  quick_catalog_title: string;
  quick_catalog_sub: string;
  quick_categories_title: string;
  quick_categories_sub: string;
  quick_downloads_title: string;
  quick_downloads_sub: string;

  // Dashboard Page - Recent Orders Section
  recent_orders_title: string;
  recent_orders_subtitle: string;
  view_all_orders: string;
  no_orders_yet: string;
  no_orders_sub: string;

  // Dashboard Page - Table Headers
  col_order: string;
  col_customer: string;
  col_total: string;
  col_status: string;
  col_date: string;
  col_action: string;
  btn_details: string;

  // ── Access Bans & IP Tracker Page ──
  bans_page_title: string;
  bans_page_subtitle: string;
  bans_add_btn: string;
  bans_stat_active: string;
  bans_stat_ip: string;
  bans_stat_user: string;
  bans_stat_recent_ips: string;
  bans_tab_list: (count: string) => string;
  bans_tab_tracker: (count: string) => string;
  bans_search_placeholder: string;
  bans_filter_all: string;
  bans_filter_ip: string;
  bans_filter_user: string;
  bans_status_all: string;
  bans_status_active: string;
  bans_status_revoked: string;
  bans_th_target: string;
  bans_th_type: string;
  bans_th_reason: string;
  bans_th_duration: string;
  bans_th_hits: string;
  bans_th_date_by: string;
  bans_th_status: string;
  bans_th_action: string;
  bans_permanent: string;
  bans_expired: string;
  bans_timed: string;
  bans_by: (admin: string) => string;
  bans_active_badge: string;
  bans_revoked_badge: string;
  bans_action_revoke: string;
  bans_action_reactivate: string;
  bans_action_delete: string;
  bans_copy_ip: string;
  bans_copied: string;
  bans_empty_title: string;
  bans_empty_sub: string;
  tracker_header_title: string;
  tracker_header_sub: string;
  tracker_th_ip: string;
  tracker_th_source: string;
  tracker_th_events: string;
  tracker_th_first_seen: string;
  tracker_th_last_seen: string;
  tracker_th_ban_status: string;
  tracker_th_action: string;
  tracker_ban_btn: string;
  tracker_banned_label: string;
  tracker_empty_title: string;
  tracker_empty_sub: string;
  bans_modal_title: string;
  bans_modal_desc: string;
  bans_modal_type: string;
  bans_modal_opt_ip: string;
  bans_modal_opt_ip_sub: string;
  bans_modal_opt_user: string;
  bans_modal_opt_user_sub: string;
  bans_modal_label_ip: string;
  bans_modal_label_user: string;
  bans_modal_user_search: string;
  bans_modal_reason_label: string;
  bans_modal_custom_reason: string;
  bans_modal_custom_reason_placeholder: string;
  bans_modal_duration_label: string;
  bans_modal_duration_permanent: string;
  bans_modal_duration_24h: string;
  bans_modal_duration_7d: string;
  bans_modal_duration_30d: string;
  bans_modal_duration_custom: string;
  bans_modal_notes_label: string;
  bans_modal_notes_placeholder: string;
  bans_modal_btn_cancel: string;
  bans_modal_btn_submit: string;
  bans_modal_btn_submitting: string;

  // ── Event Logs Page ──
  logs_page_title: string;
  logs_page_subtitle: string;
  logs_btn_export: string;
  logs_btn_clear: string;
  logs_btn_clearing: string;
  logs_stat_total: string;
  logs_stat_orders: string;
  logs_stat_catalog: string;
  logs_stat_security: string;
  logs_search_placeholder: string;
  logs_cat_all: string;
  logs_cat_orders: string;
  logs_cat_catalog: string;
  logs_cat_downloads: string;
  logs_cat_security: string;
  logs_cat_auth: string;
  logs_sev_all: string;
  logs_sev_info: string;
  logs_sev_success: string;
  logs_sev_warning: string;
  logs_sev_critical: string;
  logs_th_time: string;
  logs_th_category: string;
  logs_th_action: string;
  logs_th_target: string;
  logs_th_details: string;
  logs_th_admin: string;
  logs_toggle_hide: string;
  logs_toggle_show: string;
  logs_empty_title: string;
  logs_empty_sub: string;
  logs_confirm_clear: string;
}

export const adminTranslations: Record<AdminLanguage, AdminTranslations> = {
  en: {
    top_add_product: "Add Product",
    top_sign_out: "Sign out",
    top_sign_out_title: "Sign out of Admin",
    top_switch_theme: "Switch theme mode",
    lang_dropdown_title: "Language",
    lang_english: "English",
    lang_english_sub: "Default",
    lang_bangla: "বাংলা",
    lang_bangla_sub: "Bengali",
    select_language: "Select Language",

    nav_group_management: "Management",
    nav_group_system: "System",
    nav_group_storefront: "Storefront",

    nav_dashboard: "Dashboard",
    nav_orders: "Orders",
    nav_products: "Products",
    nav_categories: "Categories",
    nav_downloads: "Downloads",
    nav_bans: "Access Bans",
    nav_logs: "Event Logs",
    nav_system_health: "System Health",
    nav_live_store: "Live Store",
    system_online: "System Online",
    administrator: "Administrator",

    bc_overview: "Overview",
    bc_dashboard: "Dashboard",
    bc_orders_management: "Orders Management",
    bc_order_details: "Order Details",
    bc_products_catalog: "Product Catalog",
    bc_create_product: "Create New Product",
    bc_edit_product: "Edit Product",
    bc_categories: "Categories",
    bc_downloads: "Software Downloads",
    bc_bans: "Access Control & Bans",
    bc_logs: "Event & Audit Logs",
    bc_system_health: "System Health & Diagnostics",
    bc_admin_console: "Admin Console",

    dash_badge: "Store Management",
    dash_title: "Store Overview",
    dash_subtitle: "Real-time performance, order stream, and catalog status.",
    dash_manage_orders: "Manage Orders",
    dash_add_product: "Add Product",

    kpi_total_orders_title: "Total Orders",
    kpi_total_orders_sub: "Lifetime customer purchases",
    kpi_pending_verification_title: "Pending Verification",
    kpi_requires_check: "Requires payment check",
    kpi_all_handled: "All submitted payments handled",
    kpi_action_required: "Action required",
    kpi_active_products_title: "Active Products",
    kpi_active_products_sub: (active, total) => `Out of ${total} total products`,
    kpi_categories_title: "Categories & Options",
    kpi_categories_sub: (count) => `${count} license pricing options`,

    chart_title: "Orders Volume",
    chart_orders_count: (count) => `${count} orders placed in the past 7 days`,
    chart_last_7_days: "Last 7 Days",
    chart_tooltip_orders: "Orders",
    chart_empty_title: "No order data available",
    chart_empty_sub: "Chart will appear once orders are placed.",

    quick_operations_title: "Quick Operations",
    quick_add_product_title: "Add Product",
    quick_add_product_sub: "Create new license entry",
    quick_review_orders_title: "Review Orders",
    quick_review_orders_sub: "Process & deliver keys",
    quick_catalog_title: "Product Catalog",
    quick_catalog_sub: "Manage pricing & stock",
    quick_categories_title: "Categories",
    quick_categories_sub: "Organize store groups",
    quick_downloads_title: "Downloads",
    quick_downloads_sub: "Installer mirror links",

    recent_orders_title: "Recent Orders",
    recent_orders_subtitle: "Latest customer purchases and order fulfillment requests",
    view_all_orders: "View All Orders",
    no_orders_yet: "No orders received yet",
    no_orders_sub: "When customers complete checkout, their orders will appear here automatically.",

    col_order: "Order",
    col_customer: "Customer",
    col_total: "Total Amount",
    col_status: "Status",
    col_date: "Placed Date",
    col_action: "Action",
    btn_details: "Details",

    // Access Bans (EN)
    bans_page_title: "Access Control, Bans & IP Tracker",
    bans_page_subtitle: "Identify visitor & order IP addresses to prevent fraud, and ban any suspicious IP address or registered user account with 1-click.",
    bans_add_btn: "Add New Ban",
    bans_stat_active: "Active Bans",
    bans_stat_ip: "IP Bans",
    bans_stat_user: "User Bans",
    bans_stat_recent_ips: "Tracked Recent IPs",
    bans_tab_list: (count) => `Current Bans List (${count})`,
    bans_tab_tracker: (count) => `🔍 Recent Visitors & Orders IP Tracker (${count})`,
    bans_search_placeholder: "Search by IP, email, username or reason...",
    bans_filter_all: "All",
    bans_filter_ip: "🌐 IP Bans",
    bans_filter_user: "👤 User Bans",
    bans_status_all: "All Status",
    bans_status_active: "Active",
    bans_status_revoked: "Revoked",
    bans_th_target: "Target",
    bans_th_type: "Ban Type",
    bans_th_reason: "Reason & Notes",
    bans_th_duration: "Duration",
    bans_th_hits: "Hit Count",
    bans_th_date_by: "Date & By",
    bans_th_status: "Status",
    bans_th_action: "Action",
    bans_permanent: "Permanent",
    bans_expired: "Expired",
    bans_timed: "Time-limited",
    bans_by: (admin) => `By: ${admin}`,
    bans_active_badge: "● Active (Banned)",
    bans_revoked_badge: "Revoked",
    bans_action_revoke: "Revoke Ban",
    bans_action_reactivate: "Reactivate",
    bans_action_delete: "Delete Permanently",
    bans_copy_ip: "Copy IP",
    bans_copied: "Copied!",
    bans_empty_title: "No ban records found",
    bans_empty_sub: "Click above to ban a new IP/account or identify suspicious IPs in the IP Tracker tab.",
    tracker_header_title: "Recent Visitors & Customer IP Tracker",
    tracker_header_sub: "Recent IP addresses detected from orders, logins, and cart checkout attempts. Click 'Ban IP' to block immediately.",
    tracker_th_ip: "IP Address",
    tracker_th_source: "First Detected From",
    tracker_th_events: "Total Events",
    tracker_th_first_seen: "First Seen",
    tracker_th_last_seen: "Last Activity",
    tracker_th_ban_status: "Ban Status",
    tracker_th_action: "Action",
    tracker_ban_btn: "Ban This IP",
    tracker_banned_label: "Already Banned",
    tracker_empty_title: "No tracked IPs found yet",
    tracker_empty_sub: "When users place orders or log in, their IP addresses will appear here automatically.",
    bans_modal_title: "Ban IP Address or User Account",
    bans_modal_desc: "Block a specific device IP or harmful user account from accessing the store.",
    bans_modal_type: "Ban Type",
    bans_modal_opt_ip: "🌐 IP Address Ban",
    bans_modal_opt_ip_sub: "Block a specific device or visitor IP",
    bans_modal_opt_user: "👤 User Account Ban",
    bans_modal_opt_user_sub: "Ban an existing registered user account",
    bans_modal_label_ip: "IP Address (IPv4 / IPv6)",
    bans_modal_label_user: "Search & Select Registered User",
    bans_modal_user_search: "Search user by name, email, or phone...",
    bans_modal_reason_label: "Reason for Ban",
    bans_modal_custom_reason: "Custom Reason Details",
    bans_modal_custom_reason_placeholder: "Describe why this ban is being enforced...",
    bans_modal_duration_label: "Ban Duration",
    bans_modal_duration_permanent: "Permanent (Indefinite)",
    bans_modal_duration_24h: "24 Hours (1 Day)",
    bans_modal_duration_7d: "7 Days (1 Week)",
    bans_modal_duration_30d: "30 Days (1 Month)",
    bans_modal_duration_custom: "Custom Expiration Date",
    bans_modal_notes_label: "Internal Admin Notes (Optional)",
    bans_modal_notes_placeholder: "Add any internal reference for other admins...",
    bans_modal_btn_cancel: "Cancel",
    bans_modal_btn_submit: "Confirm & Enforce Ban",
    bans_modal_btn_submitting: "Enforcing Ban...",

    // Event Logs (EN)
    logs_page_title: "Admin Event & Activity Logs",
    logs_page_subtitle: "Complete audit trail of all product changes, order status updates, and security actions.",
    logs_btn_export: "Export CSV",
    logs_btn_clear: "Clear All Logs",
    logs_btn_clearing: "Clearing...",
    logs_stat_total: "Total Logged Events",
    logs_stat_orders: "Orders & Payments",
    logs_stat_catalog: "Products & Catalog",
    logs_stat_security: "Security & Bans",
    logs_search_placeholder: "Search action, product, order #, or admin email...",
    logs_cat_all: "All Categories",
    logs_cat_orders: "📦 Orders",
    logs_cat_catalog: "🏷️ Products",
    logs_cat_downloads: "⬇️ Downloads",
    logs_cat_security: "🛡️ Security",
    logs_cat_auth: "🔑 Auth & Login",
    logs_sev_all: "All Severity",
    logs_sev_info: "Info",
    logs_sev_success: "Success",
    logs_sev_warning: "Warning",
    logs_sev_critical: "Critical",
    logs_th_time: "Timestamp",
    logs_th_category: "Category",
    logs_th_action: "Action & Event",
    logs_th_target: "Target Entity",
    logs_th_details: "Change Details",
    logs_th_admin: "Admin / IP",
    logs_toggle_hide: "Hide",
    logs_toggle_show: "View Full Details",
    logs_empty_title: "No event logs found",
    logs_empty_sub: "Any changes or actions in the admin panel will be logged here automatically.",
    logs_confirm_clear: "Are you sure you want to permanently clear all audit logs?",
  },

  bn: {
    top_add_product: "প্রোডাক্ট যোগ করুন",
    top_sign_out: "লগআউট",
    top_sign_out_title: "অ্যাডমিন থেকে লগআউট করুন",
    top_switch_theme: "থিম পরিবর্তন করুন",
    lang_dropdown_title: "ভাষা",
    lang_english: "English",
    lang_english_sub: "ইংরেজি",
    lang_bangla: "বাংলা",
    lang_bangla_sub: "বাংলা সংস্করণ",
    select_language: "ভাষা নির্বাচন করুন",

    nav_group_management: "ব্যবস্থাপনা",
    nav_group_system: "সিস্টেম",
    nav_group_storefront: "স্টোরফ্রন্ট",

    nav_dashboard: "ড্যাশবোর্ড",
    nav_orders: "অর্ডারসমূহ",
    nav_products: "প্রোডাক্টস",
    nav_categories: "ক্যাটাগরি",
    nav_downloads: "ডাউনলোড",
    nav_bans: "অ্যাক্সেস ব্যান",
    nav_logs: "ইভেন্ট লগ",
    nav_system_health: "সিস্টেম হেলথ",
    nav_live_store: "লাইভ স্টোর",
    system_online: "সিস্টেম অনলাইন",
    administrator: "অ্যাডমিনিস্ট্রেটর",

    bc_overview: "ওভারভিউ",
    bc_dashboard: "ড্যাশবোর্ড",
    bc_orders_management: "অর্ডার ব্যবস্থাপনা",
    bc_order_details: "অর্ডারের বিবরণ",
    bc_products_catalog: "প্রোডাক্ট ক্যাটালগ",
    bc_create_product: "নতুন প্রোডাক্ট তৈরি",
    bc_edit_product: "প্রোডাক্ট সম্পাদনা",
    bc_categories: "ক্যাটাগরি সমূহ",
    bc_downloads: "সফটওয়্যার ডাউনলোড",
    bc_bans: "অ্যাক্সেস নিয়ন্ত্রণ ও ব্যান",
    bc_logs: "ইভেন্ট ও অডিট লগ",
    bc_system_health: "সিস্টেম হেলথ ও ডায়াগনস্টিক",
    bc_admin_console: "অ্যাডমিন কনসোল",

    dash_badge: "স্টোর ম্যানেজমেন্ট",
    dash_title: "স্টোর ওভারভিউ",
    dash_subtitle: "রিয়েল-টাইম পারফরম্যান্স, অর্ডার স্ট্রিম এবং ক্যাটালগ স্ট্যাটাস।",
    dash_manage_orders: "অর্ডার পরিচালনা",
    dash_add_product: "+ প্রোডাক্ট যোগ করুন",

    kpi_total_orders_title: "মোট অর্ডার",
    kpi_total_orders_sub: "সর্বমোট গ্রাহক কেনাকাটা",
    kpi_pending_verification_title: "যাচাই অপেক্ষমান",
    kpi_requires_check: "পেমেন্ট যাচাই প্রয়োজন",
    kpi_all_handled: "সব পেমেন্ট যাচাই সম্পন্ন",
    kpi_action_required: "পদক্ষেপ প্রয়োজন",
    kpi_active_products_title: "সক্রিয় প্রোডাক্টস",
    kpi_active_products_sub: (active, total) => `মোট ${total}টি প্রোডাক্টের মধ্যে`,
    kpi_categories_title: "ক্যাটাগরি ও অপশন",
    kpi_categories_sub: (count) => `${count}টি লাইসেন্স প্রাইসিং অপশন`,

    chart_title: "অর্ডারের পরিসংখ্যান",
    chart_orders_count: (count) => `বিগত ৭ দিনে ${count}টি অর্ডার গৃহীত হয়েছে`,
    chart_last_7_days: "গত ৭ দিন",
    chart_tooltip_orders: "টি অর্ডার",
    chart_empty_title: "কোনো অর্ডার তথ্য নেই",
    chart_empty_sub: "অর্ডার গৃহীত হলে চার্ট প্রদর্শিত হবে।",

    quick_operations_title: "দ্রুত কার্যক্রম",
    quick_add_product_title: "প্রোডাক্ট যোগ করুন",
    quick_add_product_sub: "নতুন লাইসেন্স এন্ট্রি তৈরি করুন",
    quick_review_orders_title: "অর্ডার পর্যালোচনা",
    quick_review_orders_sub: "প্রসেস ও কি ডেলিভারি দিন",
    quick_catalog_title: "প্রোডাক্ট ক্যাটালগ",
    quick_catalog_sub: "মূল্য ও স্টক পরিচালনা",
    quick_categories_title: "ক্যাটাগরি সমূহ",
    quick_categories_sub: "স্টোর গ্রুপ সাজান",
    quick_downloads_title: "ডাউনলোড",
    quick_downloads_sub: "ইনস্টলার মিরর লিংক",

    recent_orders_title: "সাম্প্রতিক অর্ডারসমূহ",
    recent_orders_subtitle: "সর্বশেষ গ্রাহক কেনাকাটা এবং ডেলিভারি অনুরোধ",
    view_all_orders: "সব অর্ডার দেখুন",
    no_orders_yet: "এখনও কোনো অর্ডার আসেনি",
    no_orders_sub: "গ্রাহকরা চেকআউট সম্পন্ন করলে তাদের অর্ডার স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।",

    col_order: "অর্ডার",
    col_customer: "গ্রাহক",
    col_total: "মোট মূল্য",
    col_status: "স্ট্যাটাস",
    col_date: "অর্ডারের তারিখ",
    col_action: "অ্যাকশন",
    btn_details: "বিস্তারিত",

    // Access Bans (BN)
    bans_page_title: "অ্যাক্সেস কন্ট্রোল, ব্যান ও আইপি ট্র্যাকার",
    bans_page_subtitle: "সাইটের নিরাপত্তা ও ফ্রড রোধে অর্ডার ও ভিজিটরদের আইপি অ্যাড্রেস শনাক্ত করুন এবং যেকোনো আইপি বা রেজিস্টার্ড অ্যাকাউন্টকে ১-ক্লিকে ব্যান করুন।",
    bans_add_btn: "নতুন ব্যান যুক্ত করুন",
    bans_stat_active: "সক্রিয় ব্যান",
    bans_stat_ip: "আইপি ব্যান",
    bans_stat_user: "ইউজার ব্যান",
    bans_stat_recent_ips: "শনাক্তকৃত সাম্প্রতিক আইপি",
    bans_tab_list: (count) => `বর্তমান ব্যান তালিকা (${count})`,
    bans_tab_tracker: (count) => `🔍 সাম্প্রতিক ভিজিটর ও অর্ডার আইপি ট্র্যাকার (${count})`,
    bans_search_placeholder: "আইপি, ইমেইল, ইউজারনেম বা কারণ খুঁজুন...",
    bans_filter_all: "সবগুলো",
    bans_filter_ip: "🌐 আইপি ব্যান",
    bans_filter_user: "👤 ইউজার ব্যান",
    bans_status_all: "সকল অবস্থা",
    bans_status_active: "সক্রিয়",
    bans_status_revoked: "স্থগিত বাতিল (Revoked)",
    bans_th_target: "লক্ষ্যবস্তু (Target)",
    bans_th_type: "ব্যান টাইপ",
    bans_th_reason: "কারণ ও নোট",
    bans_th_duration: "মেয়াদকাল (Duration)",
    bans_th_hits: "হিট সংখ্যা",
    bans_th_date_by: "তারিখ ও বাই",
    bans_th_status: "স্ট্যাটাস",
    bans_th_action: "অ্যাকশন",
    bans_permanent: "স্থায়ী (Permanent)",
    bans_expired: "মেয়াদোত্তীর্ণ (Expired)",
    bans_timed: "নির্দিষ্ট মেয়াদী",
    bans_by: (admin) => `বাই: ${admin}`,
    bans_active_badge: "● সক্রিয় (Banned)",
    bans_revoked_badge: "স্থগিত বাতিল (Revoked)",
    bans_action_revoke: "ব্যান প্রত্যাহার",
    bans_action_reactivate: "পুনরায় সক্রিয়",
    bans_action_delete: "স্থায়ী মুছুন",
    bans_copy_ip: "আইপি কপি করুন",
    bans_copied: "কপি হয়েছে!",
    bans_empty_title: "কোনো ব্যান রেকর্ড পাওয়া যায়নি",
    bans_empty_sub: "নতুন আইপি বা অ্যাকাউন্ট ব্যান করতে উপরের বাটনে ক্লিক করুন অথবা 'আইপি ট্র্যাকার' ট্যাব থেকে শনাক্ত করুন।",
    tracker_header_title: "সাম্প্রতিক ভিজিটর ও কাস্টমার আইপি ট্র্যাকার",
    tracker_header_sub: "অর্ডার, লগইন বা চেকআউট প্রচেষ্টা থেকে শনাক্ত হওয়া আইপি অ্যাড্রেসসমূহ। যেকোনো সন্দেহভাজন আইপি সরাসরি ব্যান করতে 'ব্যান করুন' বাটনে ক্লিক করুন।",
    tracker_th_ip: "আইপি অ্যাড্রেস (IP Address)",
    tracker_th_source: "প্রথম উৎস (First Detected)",
    tracker_th_events: "মোট ইভেন্ট",
    tracker_th_first_seen: "প্রথম আগমন",
    tracker_th_last_seen: "সর্বশেষ অ্যাক্টিভিটি",
    tracker_th_ban_status: "ব্যান স্ট্যাটাস",
    tracker_th_action: "অ্যাকশন",
    tracker_ban_btn: "ব্যান করুন (Ban IP)",
    tracker_banned_label: "ইতিমধ্যে ব্যানড",
    tracker_empty_title: "এখনও কোনো আইপি ট্র্যাকিং লগ পাওয়া যায়নি",
    tracker_empty_sub: "সাইটে অর্ডার অথবা অ্যাক্টিভিটি ঘটলে স্বয়ংক্রিয়ভাবে ভিজিটর আইপি এখানে তালিকাভুক্ত হবে।",
    bans_modal_title: "নতুন আইপি বা অ্যাকাউন্ট ব্যান করুন",
    bans_modal_desc: "নির্দিষ্ট আইপি অ্যাড্রেস বা ক্ষতিকারক ইউজার অ্যাকাউন্ট ব্লক করুন।",
    bans_modal_type: "ব্যান এর ধরন",
    bans_modal_opt_ip: "🌐 আইপি অ্যাড্রেস ব্যান",
    bans_modal_opt_ip_sub: "নির্দিষ্ট ডিভাইস বা ভিজিটর আইপি ব্লক করুন",
    bans_modal_opt_user: "👤 ইউজার অ্যাকাউন্ট ব্যান",
    bans_modal_opt_user_sub: "রেজিস্টার্ড কাস্টমার অ্যাকাউন্ট ব্লক করুন",
    bans_modal_label_ip: "আইপি অ্যাড্রেস (IPv4 / IPv6)",
    bans_modal_label_user: "রেজিস্টার্ড ইউজার নির্বাচন করুন",
    bans_modal_user_search: "নাম, ইমেইল বা ফোন নম্বর দিয়ে ইউজার খুঁজুন...",
    bans_modal_reason_label: "ব্যান এর কারণ",
    bans_modal_custom_reason: "সুনির্দিষ্ট কারণ লিখুন",
    bans_modal_custom_reason_placeholder: "ব্যানের সঠিক কারণ বিস্তারিত লিখুন...",
    bans_modal_duration_label: "ব্যান এর মেয়াদকাল",
    bans_modal_duration_permanent: "স্থায়ী (Permanent)",
    bans_modal_duration_24h: "২৪ ঘণ্টা (১ দিন)",
    bans_modal_duration_7d: "৭ দিন (১ সপ্তাহ)",
    bans_modal_duration_30d: "৩০ দিন (১ মাস)",
    bans_modal_duration_custom: "নির্দিষ্ট তারিখ পর্যন্ত",
    bans_modal_notes_label: "অভ্যন্তরীণ অ্যাডমিন নোট (ঐচ্ছিক)",
    bans_modal_notes_placeholder: "অন্যান্য অ্যাডমিনদের তথ্যের জন্য অভ্যন্তরীণ কোনো নোট...",
    bans_modal_btn_cancel: "বাতিল",
    bans_modal_btn_submit: "ব্যান নিশ্চিত ও কার্যকর করুন",
    bans_modal_btn_submitting: "ব্যান কার্যকর হচ্ছে...",

    // Event Logs (BN)
    logs_page_title: "অ্যাডমিন ইভেন্ট ও অ্যাক্টিভিটি লগ",
    logs_page_subtitle: "সাইটের সকল গুরুত্বপূর্ণ পরিবর্তন, অর্ডার স্ট্যাটাস আপডেট, প্রোডাক্ট এডিট এবং সিকিউরিটি অ্যাকশনের পূর্ণাঙ্গ অডিট ট্রেইল।",
    logs_btn_export: "CSV এক্সপোর্ট",
    logs_btn_clear: "লগ মুছে ফেলুন",
    logs_btn_clearing: "মুছে ফেলা হচ্ছে...",
    logs_stat_total: "মোট রেকর্ডকৃত ইভেন্ট",
    logs_stat_orders: "অর্ডার ও পেমেন্ট সংক্রান্ত",
    logs_stat_catalog: "প্রোডাক্ট ও ক্যাটালগ এডিট",
    logs_stat_security: "সিকিউরিটি ও ব্যান ইভেন্ট",
    logs_search_placeholder: "অ্যাকশন, প্রোডাক্ট, অর্ডার বা অ্যাডমিন ইমেইল খুঁজুন...",
    logs_cat_all: "সব ক্যাটাগরি",
    logs_cat_orders: "📦 অর্ডার",
    logs_cat_catalog: "🏷️ প্রোডাক্ট",
    logs_cat_downloads: "⬇️ ডাউনলোড",
    logs_cat_security: "🛡️ সিকিউরিটি",
    logs_cat_auth: "🔑 অথেন্টিকেশন",
    logs_sev_all: "সকল তীব্রতা",
    logs_sev_info: "তথ্য (Info)",
    logs_sev_success: "সফল (Success)",
    logs_sev_warning: "সতর্কতা (Warning)",
    logs_sev_critical: "জরুরি (Critical)",
    logs_th_time: "সময় (Time)",
    logs_th_category: "ক্যাটাগরি",
    logs_th_action: "অ্যাকশন ও টাইপ",
    logs_th_target: "টার্গেট এলিমেন্ট",
    logs_th_details: "পরিবর্তন ডিটেইলস",
    logs_th_admin: "অ্যাডমিন / আইপি",
    logs_toggle_hide: "লুকান",
    logs_toggle_show: "সম্পূর্ণ ডিটেইলস দেখুন",
    logs_empty_title: "কোনো ইভেন্ট লগ পাওয়া যায়নি",
    logs_empty_sub: "অ্যাডমিন প্যানেলে কোনো তথ্য পরিবর্তন বা আপডেট হলে তা স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত হবে।",
    logs_confirm_clear: "আপনি কি নিশ্চিত যে সমস্ত অডিট লগ স্থায়ীভাবে মুছে ফেলতে চান?",
  },
};
