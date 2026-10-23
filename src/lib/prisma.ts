import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not configured.",
    );
  }

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 300000, // 5 minutes to keep pool warm across requests
      max: 10,
      keepAlive: true,
    });

  pool.on("error", (err) => {
    // Prevent unhandled errors from dropping the pool
    console.warn("Prisma pool client connection warning:", err.message);
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
}

const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
