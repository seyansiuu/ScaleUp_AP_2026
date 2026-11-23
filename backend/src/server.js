/**
 * ScaleUp — Express REST API
 *
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * GET  /api/v1/startups
 * POST /api/v1/startups
 * GET  /api/v1/startups/:id
 * POST /api/v1/startups/:id/turns   (idempotent, row-locked)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { EventEmitter } from 'events';

import { executeTurn } from './engine/turnEngine.js';
import { serializeBigInts } from './utils/money.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// ─── Bootstrap ───────────────────────────────────────────────────
const app    = express();
const prisma = new PrismaClient();
const emitter = new EventEmitter();

const JWT_SECRET = process.env.JWT_SECRET || 'scaleup-secret';
const PORT       = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  name:     z.string().min(1),
});

app.post('/api/v1/auth/register', async (req, res, next) => {
  try {
    const data    = registerSchema.parse(req.body);
    const exists  = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(data.password, 12);
    const user   = await prisma.user.create({
      data: { email: data.email, password: hashed, name: data.name },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) { next(err); }
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

app.post('/api/v1/auth/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// STARTUPS
// ═══════════════════════════════════════════════════════════════════

app.get('/api/v1/startups', authMiddleware, async (req, res, next) => {
  try {
    const startups = await prisma.startup.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(serializeBigInts(startups));
  } catch (err) { next(err); }
});

const createStartupSchema = z.object({
  name: z.string().min(1).max(100),
  seed: z.number().int().optional(),
});

app.post('/api/v1/startups', authMiddleware, async (req, res, next) => {
  try {
    const data = createStartupSchema.parse(req.body);
    const seed = data.seed ?? Math.floor(Math.random() * 2147483647);

    const startup = await prisma.startup.create({
      data: { userId: req.userId, name: data.name, seed },
    });

    res.status(201).json(serializeBigInts(startup));
  } catch (err) { next(err); }
});

app.get('/api/v1/startups/:id', authMiddleware, async (req, res, next) => {
  try {
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.id },
      include: {
        employees: true,
        cohorts:   true,
        turns:     { orderBy: { month: 'asc' } },
      },
    });

    if (!startup) return res.status(404).json({ message: 'Startup not found' });
    if (startup.userId !== req.userId) return res.status(403).json({ message: 'Forbidden' });

    // Compute available term sheet from current state
    const mrrCents = Number(startup.mrrCents);
    let availableTermSheet = null;

    if (mrrCents >= 500000 && startup.founderEquityBps > 7500 && !startup.raisedSeed) {
      availableTermSheet = {
        type: 'SEED', amountCents: 200000000, equityCostBps: 2000,
        label: 'Seed Round: $2M for 20%',
      };
    } else if (
      mrrCents >= 2000000 && startup.founderEquityBps > 5000 &&
      startup.raisedSeed && !startup.raisedSeriesA
    ) {
      availableTermSheet = {
        type: 'SERIES_A', amountCents: 1000000000, equityCostBps: 2500,
        label: 'Series A: $10M for 25%',
      };
    }

    res.json({ ...serializeBigInts(startup), availableTermSheet });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// TURN ADVANCE — Idempotent, Row-Locked
// ═══════════════════════════════════════════════════════════════════

const decisionsSchema = z.object({
  priceCents: z.number().int().positive().optional(),
  marketing: z.object({
    organic: z.number().int().min(0).default(0),
    paid:    z.number().int().min(0).default(0),
    content: z.number().int().min(0).default(0),
  }).default({ organic: 0, paid: 0, content: 0 }),
  hires: z.array(z.object({
    role:  z.enum(['ENGINEERING', 'SALES', 'MARKETING', 'SUPPORT']),
    count: z.number().int().min(1).max(5),
  })).default([]),
  fires:            z.array(z.string().uuid()).default([]),
  acceptTermSheet:  z.boolean().default(false),
});

app.post('/api/v1/startups/:id/turns', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey) {
      return res.status(400).json({ message: 'Idempotency-Key header is required' });
    }

    // ── Check cached idempotency response ────────────────────────
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });
    if (existingKey) {
      return res.status(200).json(existingKey.response);
    }

    const decisions = decisionsSchema.parse(req.body);

    // ── Interactive transaction with advisory row lock ───────────
    const result = await prisma.$transaction(async (tx) => {
      // SELECT … FOR UPDATE — prevents concurrent double-advances
      await tx.$queryRawUnsafe(
        'SELECT id FROM "Startup" WHERE id = $1::uuid FOR UPDATE',
        id,
      );

      // Read full state through Prisma (after lock acquired)
      const startup = await tx.startup.findUnique({
        where: { id },
        include: { employees: true, cohorts: true },
      });

      if (!startup)                      throw new Error('Startup not found');
      if (startup.userId !== req.userId) throw new Error('Unauthorized');
      if (startup.status !== 'ACTIVE')   throw new Error('Startup is not active');

      // ── Build engine state (BigInt → Number) ──────────────────
      const state = {
        month:             startup.currentMonth,
        cashCents:         Number(startup.cashCents),
        mrrCents:          Number(startup.mrrCents),
        qualityScore:      startup.qualityScore,
        productPriceCents: Number(startup.productPriceCents),
        founderEquityBps:  startup.founderEquityBps,
        seed:              startup.seed,
        status:            startup.status,
        raisedSeed:        startup.raisedSeed,
        raisedSeriesA:     startup.raisedSeriesA,
        employees: startup.employees.map(e => ({
          id: e.id, role: e.role, salaryCents: Number(e.salaryCents),
          hiredMonth: e.hiredMonth, firedMonth: e.firedMonth, isActive: e.isActive,
        })),
        cohorts: startup.cohorts.map(c => ({
          id: c.id, acquiredMonth: c.acquiredMonth,
          initialCount: c.initialCount, currentCount: c.currentCount,
          monthlyPriceCents: Number(c.monthlyPriceCents),
        })),
      };

      // ── Execute pure simulation engine ────────────────────────
      const { newState, events, ledger, availableTermSheet } =
        executeTurn(state, decisions);

      // ── Persist startup-level updates ─────────────────────────
      await tx.startup.update({
        where: { id },
        data: {
          currentMonth:      newState.month,
          cashCents:         BigInt(newState.cashCents),
          mrrCents:          BigInt(newState.mrrCents),
          qualityScore:      newState.qualityScore,
          productPriceCents: BigInt(newState.productPriceCents),
          founderEquityBps:  newState.founderEquityBps,
          status:            newState.status,
          raisedSeed:        newState.raisedSeed,
          raisedSeriesA:     newState.raisedSeriesA,
        },
      });

      // ── Persist employee changes ──────────────────────────────
      for (const emp of newState.employees) {
        if (emp.id) {
          await tx.employee.update({
            where: { id: emp.id },
            data: { isActive: emp.isActive, firedMonth: emp.firedMonth ?? null },
          });
        } else {
          await tx.employee.create({
            data: {
              startupId: id, role: emp.role,
              salaryCents: BigInt(emp.salaryCents),
              hiredMonth: emp.hiredMonth, isActive: true,
            },
          });
        }
      }

      // ── Persist cohort changes ────────────────────────────────
      for (const cohort of newState.cohorts) {
        if (cohort.id) {
          await tx.customerCohort.update({
            where: { id: cohort.id },
            data: {
              currentCount: cohort.currentCount,
              monthlyPriceCents: BigInt(cohort.monthlyPriceCents),
            },
          });
        } else {
          await tx.customerCohort.create({
            data: {
              startupId: id,
              acquiredMonth: cohort.acquiredMonth,
              initialCount: cohort.initialCount,
              currentCount: cohort.currentCount,
              monthlyPriceCents: BigInt(cohort.monthlyPriceCents),
            },
          });
        }
      }

      // ── Create immutable turn record ──────────────────────────
      const turn = await tx.turn.create({
        data: {
          startupId: id,
          month:     newState.month,
          snapshot:  newState,
          decisions,
          events,
          ledger,
        },
      });

      const response = {
        turn: { id: turn.id, month: turn.month },
        state: newState,
        events,
        ledger,
        availableTermSheet,
      };

      // Cache response for idempotency
      await tx.idempotencyKey.create({
        data: {
          key: idempotencyKey, startupId: id,
          turnId: turn.id, response,
        },
      });

      return response;
    });

    // ── Emit domain event AFTER transaction commits ─────────────
    emitter.emit('turn.completed', {
      startupId: id,
      month: result.state.month,
    });

    res.status(200).json(result);
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// Domain Event Listeners
// ═══════════════════════════════════════════════════════════════════

emitter.on('turn.completed', ({ startupId, month }) => {
  console.log(`[Event] turn.completed  startup=${startupId}  month=${month}`);
});

// ═══════════════════════════════════════════════════════════════════
// Health + Error Handler + Listen
// ═══════════════════════════════════════════════════════════════════

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 ScaleUp API running on http://localhost:${PORT}\n`);
});
