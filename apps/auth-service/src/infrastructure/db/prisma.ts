import { PrismaClient } from '@prisma/client';

// Singleton Prisma client
let prisma: PrismaClient | undefined;

export const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

