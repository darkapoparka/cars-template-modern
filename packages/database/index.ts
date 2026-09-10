import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "./generated/client";
import { keys } from "./keys";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

neonConfig.webSocketConstructor = ws;

export const getDatabase = (): PrismaClient => {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({ connectionString: keys().DATABASE_URL });

    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
};

export const database = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getDatabase(), property, receiver);
  },
});

export * from "./generated/client";
