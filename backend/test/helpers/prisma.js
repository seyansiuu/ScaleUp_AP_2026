// Shared Prisma client for integration tests (real PostgreSQL via DATABASE_URL).
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
