-- ScaleUp benchmark fixture data for the isolated scaleup_benchmark database.
-- Safe to run repeatedly: fixed primary keys are upserted.
-- Do NOT run this against a production/application database.

BEGIN;

INSERT INTO "User" (id, email, password, name)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'alex.benchmark@example.test', 'benchmark-only-placeholder', 'Alex Founder'),
  ('22222222-2222-4222-8222-222222222222', 'sam.benchmark@example.test', 'benchmark-only-placeholder', 'Sam Founder')
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    password = EXCLUDED.password,
    name = EXCLUDED.name;

INSERT INTO "Startup" (
  id, "userId", name, seed, "currentMonth", status,
  "cashCents", "mrrCents", "productPriceCents", "qualityScore",
  "founderEquityBps", "raisedSeed", "raisedSeriesA"
)
VALUES
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Northstar Analytics', 42, 2, 'ACTIVE', 42500000, 706500, 5900, 72, 8000, TRUE, FALSE),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'GreenCart', 84, 1, 'ACTIVE', 31000000, 1782000, 9900, 88, 7500, TRUE, FALSE),
  ('55555555-5555-4555-8555-555555555555', '22222222-2222-4222-8222-222222222222', 'PixelForge', 126, 3, 'BANKRUPT', 0, 0, 4900, 35, 10000, FALSE, FALSE)
ON CONFLICT (id) DO UPDATE
SET "userId" = EXCLUDED."userId",
    name = EXCLUDED.name,
    seed = EXCLUDED.seed,
    "currentMonth" = EXCLUDED."currentMonth",
    status = EXCLUDED.status,
    "cashCents" = EXCLUDED."cashCents",
    "mrrCents" = EXCLUDED."mrrCents",
    "productPriceCents" = EXCLUDED."productPriceCents",
    "qualityScore" = EXCLUDED."qualityScore",
    "founderEquityBps" = EXCLUDED."founderEquityBps",
    "raisedSeed" = EXCLUDED."raisedSeed",
    "raisedSeriesA" = EXCLUDED."raisedSeriesA";

INSERT INTO "Employee" (
  id, "startupId", role, "salaryCents", "hiredMonth", "firedMonth", "isActive"
)
VALUES
  ('77777777-7777-4777-8777-777777777771', '33333333-3333-4333-8333-333333333333', 'ENGINEERING', 1200000, 0, NULL, TRUE),
  ('77777777-7777-4777-8777-777777777772', '33333333-3333-4333-8333-333333333333', 'SALES', 900000, 1, NULL, TRUE),
  ('77777777-7777-4777-8777-777777777773', '33333333-3333-4333-8333-333333333333', 'MARKETING', 800000, 0, 2, FALSE),
  ('77777777-7777-4777-8777-777777777774', '44444444-4444-4444-8444-444444444444', 'SUPPORT', 600000, 1, NULL, TRUE),
  ('77777777-7777-4777-8777-777777777775', '55555555-5555-4555-8555-555555555555', 'ENGINEERING', 1200000, 0, 3, FALSE)
ON CONFLICT (id) DO UPDATE
SET "startupId" = EXCLUDED."startupId",
    role = EXCLUDED.role,
    "salaryCents" = EXCLUDED."salaryCents",
    "hiredMonth" = EXCLUDED."hiredMonth",
    "firedMonth" = EXCLUDED."firedMonth",
    "isActive" = EXCLUDED."isActive";

INSERT INTO "CustomerCohort" (
  id, "startupId", "acquiredMonth", "initialCount", "currentCount", "monthlyPriceCents"
)
VALUES
  ('88888888-8888-4888-8888-888888888881', '33333333-3333-4333-8333-333333333333', 1, 100, 90, 4900),
  ('88888888-8888-4888-8888-888888888882', '33333333-3333-4333-8333-333333333333', 2, 50, 45, 5900),
  ('88888888-8888-4888-8888-888888888883', '44444444-4444-4444-8444-444444444444', 1, 200, 180, 9900),
  ('88888888-8888-4888-8888-888888888884', '55555555-5555-4555-8555-555555555555', 1, 20, 0, 4900)
ON CONFLICT (id) DO UPDATE
SET "startupId" = EXCLUDED."startupId",
    "acquiredMonth" = EXCLUDED."acquiredMonth",
    "initialCount" = EXCLUDED."initialCount",
    "currentCount" = EXCLUDED."currentCount",
    "monthlyPriceCents" = EXCLUDED."monthlyPriceCents";

INSERT INTO "Turn" (
  id, "startupId", month, snapshot, decisions, events, ledger
)
VALUES
  (
    '66666666-6666-4666-8666-666666666661',
    '33333333-3333-4333-8333-333333333333',
    1,
    '{"month":1,"cashCents":44000000,"mrrCents":490000,"qualityScore":65}'::jsonb,
    '{"priceCents":4900,"marketing":{"organic":100000,"paid":200000,"content":50000},"hires":[]}'::jsonb,
    '[{"type":"VIRAL_TWEET","description":"A benchmark viral event","impact":"positive"}]'::jsonb,
    '[{"type":"INFLOW","label":"Revenue","amountCents":490000}]'::jsonb
  ),
  (
    '66666666-6666-4666-8666-666666666662',
    '33333333-3333-4333-8333-333333333333',
    2,
    '{"month":2,"cashCents":42500000,"mrrCents":706500,"qualityScore":72}'::jsonb,
    '{"priceCents":5900,"marketing":{"organic":120000,"paid":250000,"content":80000},"hires":[{"role":"SALES","count":1}]}'::jsonb,
    '[{"type":"ENTERPRISE_CONTRACT","description":"A benchmark enterprise contract","impact":"positive"}]'::jsonb,
    '[{"type":"INFLOW","label":"Revenue","amountCents":706500}]'::jsonb
  ),
  (
    '66666666-6666-4666-8666-666666666663',
    '44444444-4444-4444-8444-444444444444',
    1,
    '{"month":1,"cashCents":31000000,"mrrCents":1782000,"qualityScore":88}'::jsonb,
    '{"priceCents":9900,"marketing":{"organic":200000,"paid":300000,"content":100000},"hires":[]}'::jsonb,
    '[{"type":"PRESS_COVERAGE","description":"A benchmark press event","impact":"positive"}]'::jsonb,
    '[{"type":"INFLOW","label":"Revenue","amountCents":1782000}]'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET "startupId" = EXCLUDED."startupId",
    month = EXCLUDED.month,
    snapshot = EXCLUDED.snapshot,
    decisions = EXCLUDED.decisions,
    events = EXCLUDED.events,
    ledger = EXCLUDED.ledger;

INSERT INTO "IdempotencyKey" (key, "startupId", "turnId", response)
VALUES (
  'benchmark-idempotency-key-0001',
  '33333333-3333-4333-8333-333333333333',
  '66666666-6666-4666-8666-666666666662',
  '{"turn":{"month":2},"benchmarkFixture":true}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET "startupId" = EXCLUDED."startupId",
    "turnId" = EXCLUDED."turnId",
    response = EXCLUDED.response;

COMMIT;

-- Quick fixture verification
SELECT 'User' AS table_name, COUNT(*) AS row_count FROM "User"
UNION ALL SELECT 'Startup', COUNT(*) FROM "Startup"
UNION ALL SELECT 'Turn', COUNT(*) FROM "Turn"
UNION ALL SELECT 'Employee', COUNT(*) FROM "Employee"
UNION ALL SELECT 'CustomerCohort', COUNT(*) FROM "CustomerCohort"
UNION ALL SELECT 'IdempotencyKey', COUNT(*) FROM "IdempotencyKey"
ORDER BY table_name;
