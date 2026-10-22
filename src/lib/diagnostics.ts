import prisma from "@/lib/prisma";
import { getMailConfig, shouldAllowSelfSignedSmtpCertificate } from "./orderConfirmationEmail";

export interface SystemTelemetry {
  timestamp: string;
  database: {
    ok: boolean;
    condition: string;
    responseTimeMs: number | null;
    databaseName: string;
    schemaName: string;
    serverTime: string;
    version: string;
    host: string;
    sslMode: string;
    error?: string;
  };
  email: {
    configured: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    from: string;
    authConfigured: boolean;
    allowSelfSigned: boolean;
  };
  telegram: {
    configured: boolean;
    botTokenMasked: string;
    adminChatId: string;
    webhookEndpoint: string;
    hasToken: boolean;
    hasChatId: boolean;
  };
  cloudinary: {
    configured: boolean;
    cloudName: string;
    hasApiKey: boolean;
    hasApiSecret: boolean;
  };
  server: {
    nodeVersion: string;
    platform: string;
    arch: string;
    environment: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
    timezone: string;
    memory: {
      rssMb: number;
      heapTotalMb: number;
      heapUsedMb: number;
      heapUsedPercent: number;
      externalMb: number;
    };
  };
  stats: {
    orders: number;
    paymentSubmitted: number;
    paidOrders: number;
    products: number;
    activeProducts: number;
    options: number;
    categories: number;
    newsletterSubscribers: number;
    adminUsers: number;
  };
  apiEndpoints: Array<{
    path: string;
    methods: string[];
    description: string;
    status: "HEALTHY" | "CONFIGURED";
  }>;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

function maskToken(token?: string | null): string {
  if (!token) return "Not Configured";
  if (token.length <= 8) return "••••••••";
  const start = token.slice(0, 10);
  const end = token.slice(-4);
  return `${start}••••••••${end}`;
}

function getDatabaseHostAndSsl() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return { host: "Not configured", sslMode: "None" };
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode") || (connectionString.includes("sslmode=require") ? "require" : "default");
    return {
      host: url.host || "Configured",
      sslMode,
    };
  } catch {
    return { host: "Configured", sslMode: "default" };
  }
}

export async function getSystemTelemetry(): Promise<SystemTelemetry> {
  const startedAt = performance.now();
  const { host, sslMode } = getDatabaseHostAndSsl();

  // 1. Database Health Check
  let dbHealth = {
    ok: false,
    condition: "Connection error",
    responseTimeMs: null as number | null,
    databaseName: "Unavailable",
    schemaName: "Unavailable",
    serverTime: "Unavailable",
    version: "Unavailable",
    host,
    sslMode,
    error: undefined as string | undefined,
  };

  try {
    const [row] = await prisma.$queryRaw<
      {
        database_name: string;
        schema_name: string;
        server_time: Date;
        version: string;
      }[]
    >`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        now() AS server_time,
        version() AS version
    `;
    const latency = Math.round(performance.now() - startedAt);

    const formattedTime = row?.server_time
      ? new Intl.DateTimeFormat("en-BD", {
          dateStyle: "medium",
          timeStyle: "medium",
          timeZone: "Asia/Dhaka",
        }).format(new Date(row.server_time))
      : "Unknown";

    dbHealth = {
      ok: true,
      condition: latency < 350 ? "Optimal" : latency < 800 ? "Normal" : "High Latency",
      responseTimeMs: latency,
      databaseName: row?.database_name ?? "postgres",
      schemaName: row?.schema_name ?? "public",
      serverTime: formattedTime,
      version: row?.version?.split(" on ")[0] ?? "PostgreSQL",
      host,
      sslMode,
      error: undefined,
    };
  } catch (err) {
    dbHealth.error = err instanceof Error ? err.message : "Database query failed";
  }

  // 2. Database Record Counts
  let stats = {
    orders: 0,
    paymentSubmitted: 0,
    paidOrders: 0,
    products: 0,
    activeProducts: 0,
    options: 0,
    categories: 0,
    newsletterSubscribers: 0,
    adminUsers: 0,
  };

  try {
    const [
      ordersCount,
      paymentSubmittedCount,
      paidCount,
      productsCount,
      activeProductsCount,
      optionsCount,
      categoriesCount,
      newsletterCount,
      adminCount,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAYMENT_SUBMITTED" } }),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.productOption.count(),
      prisma.category.count(),
      prisma.newsletterSubscriber.count(),
      prisma.adminUser.count(),
    ]);

    stats = {
      orders: ordersCount,
      paymentSubmitted: paymentSubmittedCount,
      paidOrders: paidCount,
      products: productsCount,
      activeProducts: activeProductsCount,
      options: optionsCount,
      categories: categoriesCount,
      newsletterSubscribers: newsletterCount,
      adminUsers: adminCount,
    };
  } catch (e) {
    console.error("Failed to query stats for telemetry:", e);
  }

  // 3. Email Config
  const mailConfig = getMailConfig();
  const allowSelfSigned = shouldAllowSelfSignedSmtpCertificate();
  const envHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const envPort = Number(process.env.SMTP_PORT ?? 587);
  const envUser = process.env.SMTP_USER || "Not configured";
  const envFrom = process.env.SMTP_FROM || "Tech Solutions BD";
  const hasPass = Boolean(process.env.SMTP_PASS);
  const emailConfigured = Boolean(mailConfig);

  // 4. Telegram Bot Config
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const telegramConfigured = Boolean(telegramToken && telegramChatId);

  // 5. Cloudinary Config
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const hasCloudinaryKey = Boolean(process.env.CLOUDINARY_API_KEY);
  const hasCloudinarySecret = Boolean(process.env.CLOUDINARY_API_SECRET);
  const cloudinaryConfigured = Boolean(cloudName && hasCloudinaryKey && hasCloudinarySecret);

  // 6. Node / Server Runtime
  const memory = process.memoryUsage();
  const rssMb = Math.round((memory.rss / (1024 * 1024)) * 10) / 10;
  const heapTotalMb = Math.round((memory.heapTotal / (1024 * 1024)) * 10) / 10;
  const heapUsedMb = Math.round((memory.heapUsed / (1024 * 1024)) * 10) / 10;
  const externalMb = Math.round((memory.external / (1024 * 1024)) * 10) / 10;
  const heapUsedPercent = heapTotalMb > 0 ? Math.round((heapUsedMb / heapTotalMb) * 100) : 0;

  const uptimeSeconds = Math.round(process.uptime());

  // 7. API Endpoints Table
  const apiEndpoints: Array<{
    path: string;
    methods: string[];
    description: string;
    status: "HEALTHY" | "CONFIGURED";
  }> = [
    {
      path: "/api/orders",
      methods: ["POST", "GET"],
      description: "Checkout order creation & customer order history query",
      status: "HEALTHY",
    },
    {
      path: "/api/order/verify",
      methods: ["POST", "GET"],
      description: "Payment TrxID verification, status sync & customer email dispatcher",
      status: "HEALTHY",
    },
    {
      path: "/api/telegram/webhook",
      methods: ["POST"],
      description: "Telegram Bot inline callbacks (Confirm / Wrong TrxID / Cancel)",
      status: telegramConfigured ? "HEALTHY" : "CONFIGURED",
    },
    {
      path: "/api/newsletter",
      methods: ["POST"],
      description: "Footer newsletter subscription & auto-welcome email delivery",
      status: "HEALTHY",
    },
    {
      path: "/api/auth/login",
      methods: ["POST"],
      description: "Admin credential authentication & JWT session dispatch",
      status: "HEALTHY",
    },
    {
      path: "/api/admin/diagnostics",
      methods: ["GET"],
      description: "Live system health ping, latency benchmark & resource metrics",
      status: "HEALTHY",
    },
  ];

  const nowFormatted = new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Dhaka",
  }).format(new Date());

  return {
    timestamp: nowFormatted,
    database: dbHealth,
    email: {
      configured: emailConfigured,
      host: mailConfig?.host || envHost,
      port: mailConfig?.port || envPort,
      secure: mailConfig ? mailConfig.secure : (process.env.SMTP_SECURE === "true" || envPort === 465),
      user: mailConfig?.user || envUser,
      from: mailConfig?.from || envFrom,
      authConfigured: Boolean(mailConfig?.pass || hasPass),
      allowSelfSigned,
    },
    telegram: {
      configured: telegramConfigured,
      botTokenMasked: maskToken(telegramToken),
      adminChatId: telegramChatId || "Not configured",
      webhookEndpoint: "/api/telegram/webhook",
      hasToken: Boolean(telegramToken),
      hasChatId: Boolean(telegramChatId),
    },
    cloudinary: {
      configured: cloudinaryConfigured,
      cloudName: cloudName || "Not configured",
      hasApiKey: hasCloudinaryKey,
      hasApiSecret: hasCloudinarySecret,
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds,
      uptimeFormatted: formatUptime(uptimeSeconds),
      timezone: "Asia/Dhaka",
      memory: {
        rssMb,
        heapTotalMb,
        heapUsedMb,
        heapUsedPercent,
        externalMb,
      },
    },
    stats,
    apiEndpoints,
  };
}
