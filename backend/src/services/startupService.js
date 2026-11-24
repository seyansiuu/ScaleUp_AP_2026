import { EventEmitter } from 'node:events';
import { prisma } from '../models/index.js';
import { executeTurn } from '../engine/turnEngine.js';

export const domainEvents = new EventEmitter();

export async function listStartups(userId) {
  return prisma.startup.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createStartup(userId, data) {
  const seed = data.seed ?? Math.floor(Math.random() * 2147483647);
  return prisma.startup.create({ data: { userId, name: data.name, seed } });
}

function termSheetFor(startup) {
  const mrrCents = Number(startup.mrrCents);
  if (mrrCents >= 500000 && startup.founderEquityBps > 7500 && !startup.raisedSeed) {
    return { type: 'SEED', amountCents: 200000000, equityCostBps: 2000, label: 'Seed Round: $2M for 20%' };
  }
  if (mrrCents >= 2000000 && startup.founderEquityBps > 5000 && startup.raisedSeed && !startup.raisedSeriesA) {
    return { type: 'SERIES_A', amountCents: 1000000000, equityCostBps: 2500, label: 'Series A: $10M for 25%' };
  }
  return null;
}

export async function getStartup(userId, id) {
  const startup = await prisma.startup.findUnique({
    where: { id },
    include: { employees: true, cohorts: true, turns: { orderBy: { month: 'asc' } } },
  });
  if (!startup) throw serviceError('Startup not found', 404);
  if (startup.userId !== userId) throw serviceError('Forbidden', 403);
  return { ...startup, availableTermSheet: termSheetFor(startup) };
}

function serviceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function engineState(startup) {
  return {
    month: startup.currentMonth,
    cashCents: Number(startup.cashCents),
    mrrCents: Number(startup.mrrCents),
    qualityScore: startup.qualityScore,
    productPriceCents: Number(startup.productPriceCents),
    founderEquityBps: startup.founderEquityBps,
    seed: startup.seed,
    status: startup.status,
    raisedSeed: startup.raisedSeed,
    raisedSeriesA: startup.raisedSeriesA,
    employees: startup.employees.map(({ id, role, salaryCents, hiredMonth, firedMonth, isActive }) => ({
      id, role, salaryCents: Number(salaryCents), hiredMonth, firedMonth, isActive,
    })),
    cohorts: startup.cohorts.map(({ id, acquiredMonth, initialCount, currentCount, monthlyPriceCents }) => ({
      id, acquiredMonth, initialCount, currentCount, monthlyPriceCents: Number(monthlyPriceCents),
    })),
  };
}

export async function advanceTurn(userId, id, idempotencyKey, decisions) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${id}::uuid FOR UPDATE`;
    const startup = await tx.startup.findUnique({ where: { id }, include: { employees: true, cohorts: true } });
    if (!startup) throw serviceError('Startup not found', 404);
    if (startup.userId !== userId) throw serviceError('Forbidden', 403);
    if (startup.status !== 'ACTIVE') throw serviceError('Startup is not active', 409);

    // Idempotency keys are globally unique. Check after authorization and
    // under the startup lock to avoid leaking another startup's cached result.
    const cached = await tx.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
    if (cached) {
      if (cached.startupId !== id) throw serviceError('Idempotency-Key has already been used', 409);
      return cached.response;
    }

    const { newState, events, ledger, availableTermSheet } = executeTurn(engineState(startup), decisions);
    await tx.startup.update({ where: { id }, data: {
      currentMonth: newState.month,
      cashCents: BigInt(newState.cashCents),
      mrrCents: BigInt(newState.mrrCents),
      qualityScore: newState.qualityScore,
      productPriceCents: BigInt(newState.productPriceCents),
      founderEquityBps: newState.founderEquityBps,
      status: newState.status,
      raisedSeed: newState.raisedSeed,
      raisedSeriesA: newState.raisedSeriesA,
    } });

    for (const employee of newState.employees) {
      if (employee.id) {
        await tx.employee.update({ where: { id: employee.id }, data: { isActive: employee.isActive, firedMonth: employee.firedMonth ?? null } });
      } else {
        await tx.employee.create({ data: {
          startupId: id, role: employee.role, salaryCents: BigInt(employee.salaryCents),
          hiredMonth: employee.hiredMonth, isActive: true,
        } });
      }
    }
    for (const cohort of newState.cohorts) {
      if (cohort.id) {
        await tx.customerCohort.update({ where: { id: cohort.id }, data: {
          currentCount: cohort.currentCount, monthlyPriceCents: BigInt(cohort.monthlyPriceCents),
        } });
      } else {
        await tx.customerCohort.create({ data: {
          startupId: id, acquiredMonth: cohort.acquiredMonth,
          initialCount: cohort.initialCount, currentCount: cohort.currentCount,
          monthlyPriceCents: BigInt(cohort.monthlyPriceCents),
        } });
      }
    }

    const turn = await tx.turn.create({ data: {
      startupId: id, month: newState.month, snapshot: newState, decisions, events, ledger,
    } });
    const response = { turn: { id: turn.id, month: turn.month }, state: newState, events, ledger, availableTermSheet };
    await tx.idempotencyKey.create({ data: { key: idempotencyKey, startupId: id, turnId: turn.id, response } });
    return response;
  });

  domainEvents.emit('turn.completed', { startupId: id, month: result.state.month });
  return result;
}
