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

app.listen(env.PORT, () => {
  console.log(`\n🚀 ScaleUp API running on http://localhost:${env.PORT}\n`);
});
