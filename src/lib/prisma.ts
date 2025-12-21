import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnected: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [], // No logging for max performance
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Eagerly connect on module load
if (!globalForPrisma.prismaConnected) {
  prisma.$connect()
    .then(() => { globalForPrisma.prismaConnected = true; })
    .catch(() => { /* will retry on first query */ });
}

// Connection retry helper for cold starts
async function connectWithRetry(maxRetries = 3, delayMs = 1000): Promise<void> {
  if (globalForPrisma.prismaConnected) return;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      globalForPrisma.prismaConnected = true;
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

// Wrapper for queries with automatic connection retry
export async function withDbConnection<T>(
  queryFn: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Ensure connection on first attempt
      if (attempt === 1 && !globalForPrisma.prismaConnected) {
        await connectWithRetry();
      }
      return await queryFn();
    } catch (error: unknown) {
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes("Can't reach database server") ||
          error.message.includes("Connection refused") ||
          error.message.includes("PrismaClientInitializationError"));

      if (isConnectionError && attempt < retries) {
        // Reset connection state and retry
        globalForPrisma.prismaConnected = false;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        await connectWithRetry();
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to execute database query after retries");
}

export default prisma;
