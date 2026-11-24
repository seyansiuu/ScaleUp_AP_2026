/**
 * ScaleUp — API entry point.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

const env    = loadEnv();          // throws with a clear message if misconfigured
const prisma = new PrismaClient();
const app    = createApp({ prisma, env });

async function start() {
  await prisma.$connect();
  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀 ScaleUp API running on http://localhost:${env.PORT}\n`);
  });

  server.once('error', async (error) => {
    console.error('ScaleUp API failed to listen:', error.message);
    await prisma.$disconnect();
    process.exitCode = 1;
  });

  const shutdown = (signal) => {
    console.log(`${signal} received; shutting down ScaleUp API`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch(async (error) => {
  console.error('ScaleUp API could not connect to PostgreSQL. Check DATABASE_URL and run npm run db:push.', error.message);
  await prisma.$disconnect();
  process.exitCode = 1;
});
