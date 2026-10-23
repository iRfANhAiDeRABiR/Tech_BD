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
  },
};
