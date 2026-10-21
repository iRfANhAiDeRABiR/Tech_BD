import { promises as fs } from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import {
  SOFTWARE_DOWNLOADS,
  type SoftwareDownloadItem,
  type SoftwareVersionLink,
} from "@/data/software-downloads";

const JSON_STORE_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "software-downloads.json",
);

let dbTableInitialized = false;

async function ensureDbTable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  if (dbTableInitialized) return true;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SoftwareDownload" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "badgeLabel" TEXT NOT NULL,
        "variant" TEXT NOT NULL DEFAULT 'custom',
        "category" TEXT NOT NULL DEFAULT 'Office',
        "version" TEXT NOT NULL DEFAULT '',
        "architecture" TEXT NOT NULL DEFAULT '64-Bit & 32-Bit',
        "fileSize" TEXT NOT NULL DEFAULT '',
        "fileType" TEXT NOT NULL DEFAULT 'Official IMG / ISO',
        "downloadUrl" TEXT NOT NULL,
        "productLink" TEXT NOT NULL DEFAULT '/products',
        "image" TEXT,
        "imagePublicId" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "versionsJson" TEXT NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      `SELECT COUNT(*) as count FROM "SoftwareDownload"`,
    );
    const count = Number(countRows?.[0]?.count ?? 0);

    if (count === 0) {
      const seedItems = await readJsonFallback();
      for (const item of seedItems) {
        await upsertDbRow(item);
      }
    }

    dbTableInitialized = true;
    return true;
  } catch {
    return false;
  }
}

type DbSoftwareRow = {
  id: string;
  title: string;
  fullName: string;
  badgeLabel: string;
  variant: string;
  category: string;
  version: string;
  architecture: string;
  fileSize: string;
  fileType: string;
  downloadUrl: string;
  productLink: string;
  image: string | null;
  imagePublicId: string | null;
  sortOrder: number;
  isActive: boolean;
  versionsJson: string;
};

function mapRowToItem(row: DbSoftwareRow): SoftwareDownloadItem {
  let versions: SoftwareVersionLink[] = [];
  try {
    const parsed = JSON.parse(row.versionsJson || "[]");
    if (Array.isArray(parsed)) {
      versions = parsed;
    }
  } catch {
    versions = [];
  }

  if (versions.length === 0 && row.downloadUrl) {
    versions = [
      {
        label: `${row.title} (Direct Download)`,
        url: row.downloadUrl,
        arch: row.architecture || "32/64-Bit",
      },
    ];
  }

  if (
    row.id === "office-multi" &&
    !versions.some((v) => v.url.includes("HomeBusiness2019Retail.img"))
  ) {
    versions.push({
      label: "Office 2019 Home & Business (Full Offline IMG)",
      url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/HomeBusiness2019Retail.img",
      arch: "32/64-Bit",
    });
  }

  return {
    id: row.id,
    title: row.title,
    fullName: row.fullName,
    badgeLabel: row.badgeLabel,
    variant: (row.variant as SoftwareDownloadItem["variant"]) || "custom",
    category: row.category || "Office",
    version: row.version || "",
    architecture: row.architecture || "64-Bit & 32-Bit",
    fileSize: row.fileSize || "",
    fileType: row.fileType || "Official Installer",
    downloadUrl: row.downloadUrl,
    productLink: row.productLink || "/products",
    image: row.image || null,
    imagePublicId: row.imagePublicId || null,
    sortOrder: Number(row.sortOrder ?? 0),
    isActive: Boolean(row.isActive),
    versions,
  };
}

async function upsertDbRow(item: SoftwareDownloadItem): Promise<void> {
  const versionsJson = JSON.stringify(item.versions ?? []);
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "SoftwareDownload" (
        "id", "title", "fullName", "badgeLabel", "variant", "category",
        "version", "architecture", "fileSize", "fileType", "downloadUrl",
        "productLink", "image", "imagePublicId", "sortOrder", "isActive",
        "versionsJson", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "fullName" = EXCLUDED."fullName",
        "badgeLabel" = EXCLUDED."badgeLabel",
        "variant" = EXCLUDED."variant",
        "category" = EXCLUDED."category",
        "version" = EXCLUDED."version",
        "architecture" = EXCLUDED."architecture",
        "fileSize" = EXCLUDED."fileSize",
        "fileType" = EXCLUDED."fileType",
        "downloadUrl" = EXCLUDED."downloadUrl",
        "productLink" = EXCLUDED."productLink",
        "image" = EXCLUDED."image",
        "imagePublicId" = EXCLUDED."imagePublicId",
        "sortOrder" = EXCLUDED."sortOrder",
        "isActive" = EXCLUDED."isActive",
        "versionsJson" = EXCLUDED."versionsJson",
        "updatedAt" = CURRENT_TIMESTAMP;
    `,
    item.id,
    item.title,
    item.fullName,
    item.badgeLabel,
    item.variant || "custom",
    item.category || "Office",
    item.version || "",
    item.architecture || "64-Bit & 32-Bit",
    item.fileSize || "",
    item.fileType || "Official IMG / ISO",
    item.downloadUrl,
    item.productLink || "/products",
    item.image ?? null,
    item.imagePublicId ?? null,
    Number(item.sortOrder ?? 0),
    Boolean(item.isActive),
    versionsJson,
  );
}

async function readJsonFallback(): Promise<SoftwareDownloadItem[]> {
  try {
    const raw = await fs.readFile(JSON_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // File doesn't exist yet or invalid; initialize with defaults
  }

  await writeJsonFallback(SOFTWARE_DOWNLOADS);
  return SOFTWARE_DOWNLOADS;
}

async function writeJsonFallback(items: SoftwareDownloadItem[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(JSON_STORE_PATH), { recursive: true });
    await fs.writeFile(JSON_STORE_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch {
    // Ignore read-only filesystem errors in serverless environments
  }
}

export async function getSoftwareDownloads(options?: {
  activeOnly?: boolean;
}): Promise<SoftwareDownloadItem[]> {
  const activeOnly = options?.activeOnly ?? false;
  const canUseDb = await ensureDbTable();

  if (canUseDb) {
    try {
      const rows = await prisma.$queryRawUnsafe<DbSoftwareRow[]>(
        `SELECT * FROM "SoftwareDownload" ORDER BY "sortOrder" ASC, "createdAt" ASC, "title" ASC`,
      );
      const items = rows.map(mapRowToItem);
      return activeOnly ? items.filter((item) => item.isActive) : items;
    } catch {
      // Fallback to JSON
    }
  }

  const fallbackItems = await readJsonFallback();
  const sorted = [...fallbackItems].sort((a, b) => a.sortOrder - b.sortOrder);
  return activeOnly ? sorted.filter((item) => item.isActive) : sorted;
}

export async function getSoftwareDownloadById(
  id: string,
): Promise<SoftwareDownloadItem | null> {
  const all = await getSoftwareDownloads({ activeOnly: false });
  return all.find((item) => item.id === id) ?? null;
}

export async function upsertSoftwareDownload(
  item: SoftwareDownloadItem,
): Promise<SoftwareDownloadItem> {
  const all = await readJsonFallback();
  const existingIndex = all.findIndex((entry) => entry.id === item.id);

  if (existingIndex >= 0) {
    all[existingIndex] = item;
  } else {
    all.push(item);
  }

  all.sort((a, b) => a.sortOrder - b.sortOrder);
  await writeJsonFallback(all);

  const canUseDb = await ensureDbTable();
  if (canUseDb) {
    try {
      await upsertDbRow(item);
    } catch {
      // JSON store already updated
    }
  }

  return item;
}

export async function deleteSoftwareDownloadById(id: string): Promise<void> {
  const all = await readJsonFallback();
  const filtered = all.filter((entry) => entry.id !== id);
  await writeJsonFallback(filtered);

  const canUseDb = await ensureDbTable();
  if (canUseDb) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "SoftwareDownload" WHERE "id" = $1`,
        id,
      );
    } catch {
      // JSON store already updated
    }
  }
}

export async function updateSoftwareDownloadsOrder(
  updates: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  const orderMap = new Map(updates.map((u) => [u.id, u.sortOrder]));
  const all = await readJsonFallback();

  for (const item of all) {
    const nextOrder = orderMap.get(item.id);
    if (nextOrder !== undefined) {
      item.sortOrder = nextOrder;
    }
  }

  all.sort((a, b) => a.sortOrder - b.sortOrder);
  await writeJsonFallback(all);

  const canUseDb = await ensureDbTable();
  if (canUseDb) {
    try {
      for (const { id, sortOrder } of updates) {
        await prisma.$executeRawUnsafe(
          `UPDATE "SoftwareDownload" SET "sortOrder" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
          sortOrder,
          id,
        );
      }
    } catch {
      // JSON store already updated
    }
  }
}
