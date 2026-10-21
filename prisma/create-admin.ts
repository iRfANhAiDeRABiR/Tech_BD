import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Store Owner";

  if (!connectionString) throw new Error("DATABASE_URL is required.");
  if (!email) throw new Error("ADMIN_EMAIL is required.");
  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const passwordHash = await hash(password, 12);

    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: { name, passwordHash, role: "OWNER", isActive: true },
      create: { email, name, passwordHash, role: "OWNER" },
    });

    console.log(`Admin ready: ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});