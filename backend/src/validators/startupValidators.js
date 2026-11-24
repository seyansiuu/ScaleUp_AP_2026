import { z } from 'zod';

export const createStartupSchema = z.object({
  name: z.string().min(1).max(100),
  seed: z.number().int().min(-2147483648).max(2147483647).optional(),
});

export const decisionsSchema = z.object({
  priceCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  marketing: z.object({
    organic: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
    paid: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
    content: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  }).default({ organic: 0, paid: 0, content: 0 }),
  hires: z.array(z.object({
    role: z.enum(['ENGINEERING', 'SALES', 'MARKETING', 'SUPPORT']),
    count: z.number().int().min(1).max(5),
  })).default([]),
  fires: z.array(z.string().uuid()).default([]),
  acceptTermSheet: z.boolean().default(false),
});
