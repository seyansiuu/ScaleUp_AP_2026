/**
 * Auth integration tests — real Express app, real HTTP, real PostgreSQL.
 * Run:  npm test      (needs DATABASE_URL + JWT_SECRET, and `npm run db:push` done)
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from './helpers/prisma.js';
import { loadEnv } from '../src/config/env.js';
import { createApp } from '../src/app.js';

const env = loadEnv();
const run = crypto.randomBytes(4).toString('hex');
const emailA = `alice.${run}@example.com`;
const emailB = `bob.${run}@example.com`;
const PASSWORD = 'correct-horse-9';

let server, base;
const createdEmails = [emailA, emailB, `legacy.${run}@example.com`];

const call = async (method, path, { body, token, headers = {}, raw } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined || raw ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, text };
};

before(async () => {
  server = createApp({ prisma, env }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: createdEmails } } });
  const ids = users.map((u) => u.id);
  await prisma.startup.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await new Promise((r) => server.close(r));
  await prisma.$disconnect();
});

let tokenA, userA, tokenB, startupId;

// ── Registration ────────────────────────────────────────────────
test('register: 201, returns token + public user, never the password hash', async () => {
  const r = await call('POST', '/api/v1/auth/register', { body: { name: 'Alice', email: emailA, password: PASSWORD } });
  assert.equal(r.status, 201);
  assert.ok(r.body.token);
  assert.deepEqual(Object.keys(r.body.user).sort(), ['email', 'id', 'name']);
  assert.ok(!r.text.includes('password'), 'response must not mention password');
  assert.ok(!r.text.includes('$2'), 'response must not contain a bcrypt hash');
  tokenA = r.body.token; userA = r.body.user;
});

test('register: stored password is a single bcrypt hash of the plaintext (not plain, not double-hashed)', async () => {
  const row = await prisma.user.findUnique({ where: { email: emailA } });
  assert.notEqual(row.password, PASSWORD);
  assert.match(row.password, /^\$2[aby]\$12\$/);
  assert.equal(await bcrypt.compare(PASSWORD, row.password), true);
});

test('register: duplicate email in a different case/with spaces → 409', async () => {
  const r = await call('POST', '/api/v1/auth/register', { body: { name: 'Alice2', email: `  ${emailA.toUpperCase()} `, password: PASSWORD } });
  assert.equal(r.status, 409);
});

test('register: Zod validation → 400 with per-field errors', async () => {
  const missing = await call('POST', '/api/v1/auth/register', { body: {} });
  assert.equal(missing.status, 400);
  assert.ok(missing.body.errors.length >= 3);
  const bad = await call('POST', '/api/v1/auth/register', { body: { name: 'x', email: 'nope', password: 'short' } });
  assert.equal(bad.status, 400);
  const paths = bad.body.errors.map((e) => e.path);
  assert.ok(paths.includes('email') && paths.includes('password'));
  const long = await call('POST', '/api/v1/auth/register', { body: { name: 'x', email: `l.${run}@example.com`, password: 'a'.repeat(73) } });
  assert.equal(long.status, 400);
});

// ── Login ───────────────────────────────────────────────────────
test('login: correct credentials → 200 + token + user', async () => {
  const r = await call('POST', '/api/v1/auth/login', { body: { email: emailA, password: PASSWORD } });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.id, userA.id);
  assert.ok(!r.text.includes('$2'));
  tokenA = r.body.token;
});

test('login: email is case-insensitive and whitespace-tolerant', async () => {
  const r = await call('POST', '/api/v1/auth/login', { body: { email: `  ${emailA.toUpperCase()}  `, password: PASSWORD } });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.id, userA.id);
});

test('login: legacy mixed-case email row (created before normalisation) can still sign in', async () => {
  const legacy = `Legacy.${run}@Example.com`;
  await prisma.user.create({ data: { email: legacy, name: 'Legacy', password: await bcrypt.hash(PASSWORD, 12) } });
  createdEmails.push(legacy);
  const r = await call('POST', '/api/v1/auth/login', { body: { email: legacy.toLowerCase(), password: PASSWORD } });
  assert.equal(r.status, 200);
});

test('login: wrong password and unknown email give the same 401 + message', async () => {
  const wrong = await call('POST', '/api/v1/auth/login', { body: { email: emailA, password: 'wrong-password' } });
  const unknown = await call('POST', '/api/v1/auth/login', { body: { email: `ghost.${run}@example.com`, password: PASSWORD } });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.message, unknown.body.message);
});

test('login: wrong field names / missing fields → 400, not 500', async () => {
  const r = await call('POST', '/api/v1/auth/login', { body: { username: emailA, pass: PASSWORD } });
  assert.equal(r.status, 400);
  const empty = await call('POST', '/api/v1/auth/login', { body: {} });
  assert.equal(empty.status, 400);
  const noBody = await call('POST', '/api/v1/auth/login');
  assert.equal(noBody.status, 400);
});

test('login: malformed JSON body → 400, not 500', async () => {
  const r = await call('POST', '/api/v1/auth/login', { raw: '{"email": ' });
  assert.equal(r.status, 400);
});

// ── JWT verification / protected routes ─────────────────────────
test('GET /auth/me: valid token → current user (no hash)', async () => {
  const r = await call('GET', '/api/v1/auth/me', { token: tokenA });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.user, userA);
  assert.ok(!r.text.includes('$2'));
});

test('protected routes: missing / malformed / forged / expired / wrong-alg tokens → 401', async () => {
  const path = '/api/v1/auth/me';
  assert.equal((await call('GET', path)).status, 401);
  assert.equal((await call('GET', path, { headers: { Authorization: tokenA } })).status, 401);          // no "Bearer"
  assert.equal((await call('GET', path, { headers: { Authorization: 'Basic abc' } })).status, 401);
  assert.equal((await call('GET', path, { headers: { Authorization: 'Bearer ' } })).status, 401);
  assert.equal((await call('GET', path, { token: 'not.a.jwt' })).status, 401);
  assert.equal((await call('GET', path, { token: 'garbage' })).status, 401);

  const wrongSecret = jwt.sign({ userId: userA.id }, 'x'.repeat(40), { expiresIn: '1h' });
  assert.equal((await call('GET', path, { token: wrongSecret })).status, 401);

  const expired = jwt.sign({ userId: userA.id }, env.JWT_SECRET, { expiresIn: -10 });
  const exp = await call('GET', path, { token: expired });
  assert.equal(exp.status, 401);
  assert.equal(exp.body.code, 'TOKEN_EXPIRED');

  const alg = jwt.sign({ userId: userA.id }, env.JWT_SECRET, { algorithm: 'HS512' });
  assert.equal((await call('GET', path, { token: alg })).status, 401);

  const none = [{ alg: 'none', typ: 'JWT' }, { userId: userA.id }]
    .map((o) => Buffer.from(JSON.stringify(o)).toString('base64url')).join('.') + '.';
  assert.equal((await call('GET', path, { token: none })).status, 401);

  const noUserClaim = jwt.sign({ foo: 'bar' }, env.JWT_SECRET);
  assert.equal((await call('GET', path, { token: noUserClaim })).status, 401);
});

test('token for a deleted user → /me 401', async () => {
  const ghost = crypto.randomUUID();
  const t = jwt.sign({ userId: ghost }, env.JWT_SECRET, { expiresIn: '1h' });
  assert.equal((await call('GET', '/api/v1/auth/me', { token: t })).status, 401);
});

test('protected data routes: 401 without token', async () => {
  assert.equal((await call('GET', '/api/v1/startups')).status, 401);
  assert.equal((await call('POST', '/api/v1/startups', { body: { name: 'x' } })).status, 401);
});

// ── Data isolation ──────────────────────────────────────────────
test('one user can never read or advance another user\'s startup', async () => {
  const regB = await call('POST', '/api/v1/auth/register', { body: { name: 'Bob', email: emailB, password: PASSWORD } });
  assert.equal(regB.status, 201);
  tokenB = regB.body.token;

  const created = await call('POST', '/api/v1/startups', { token: tokenA, body: { name: 'Alice Co', seed: 7 } });
  assert.equal(created.status, 201);
  startupId = created.body.id;

  assert.equal((await call('GET', `/api/v1/startups/${startupId}`, { token: tokenA })).status, 200);
  assert.equal((await call('GET', `/api/v1/startups/${startupId}`, { token: tokenB })).status, 403);

  const turn = await call('POST', `/api/v1/startups/${startupId}/turns`, {
    token: tokenB, body: {}, headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
  assert.equal(turn.status, 403);

  const listB = await call('GET', '/api/v1/startups', { token: tokenB });
  assert.equal(listB.status, 200);
  assert.equal(listB.body.length, 0);
  const listA = await call('GET', '/api/v1/startups', { token: tokenA });
  assert.equal(listA.body.length, 1);
});

test('non-UUID startup id → 404 (not a Prisma 500)', async () => {
  assert.equal((await call('GET', '/api/v1/startups/not-a-uuid', { token: tokenA })).status, 404);
});

// ── Logout ──────────────────────────────────────────────────────
test('logout: requires a valid token, returns 200', async () => {
  assert.equal((await call('POST', '/api/v1/auth/logout')).status, 401);
  assert.equal((await call('POST', '/api/v1/auth/logout', { token: tokenA })).status, 200);
});

// ── Environment safety ──────────────────────────────────────────
test('env: server refuses to boot without a strong JWT_SECRET (no hardcoded fallback)', () => {
  const base = { DATABASE_URL: 'postgresql://x' };
  assert.throws(() => loadEnv(base), /JWT_SECRET/);
  assert.throws(() => loadEnv({ ...base, JWT_SECRET: 'short' }), /at least 32/);
  assert.doesNotThrow(() => loadEnv({ ...base, JWT_SECRET: 'z'.repeat(32) }));
});
