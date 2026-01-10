import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PrismaClient with optimized settings for serverless
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Datasource configuration happens via DATABASE_URL
  });
}

// Always use singleton pattern (both dev and production)
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

// Lazy connection - don't connect eagerly, let Prisma handle it
// This prevents connection exhaustion on cold starts

// Wrapper for queries with automatic connection retry
export async function withDbConnection<T>(
  queryFn: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes("Can't reach database server") ||
          error.message.includes("Connection refused") ||
          error.message.includes("Connection timed out") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("prepared statement") ||
          error.message.includes("PrismaClientInitializationError") ||
          error.message.includes("Server has closed the connection"));

      if (isConnectionError && attempt < retries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to execute database query after retries");
}

export default prisma;
