-- ScaleUp DBMS Project — Checkpoint 3: SQL Queries
-- Target: PostgreSQL 15+
-- Source of truth reviewed: backend/prisma/schema.prisma and dbms/03_schema.sql
-- IDs are UUIDs. Money fields are integer cents. JSON payloads are JSONB.
-- Run from a database where dbms/03_schema.sql has been applied.

-- ============================================================
-- Q1. SELECT + JOIN: list startups with their founder
-- ============================================================
SELECT s.id AS startup_id,
       s.name AS startup_name,
       u.name AS founder_name,
       u.email,
       s."currentMonth",
       s.status,
       s."cashCents",
       s."mrrCents"
FROM "Startup" AS s
JOIN "User" AS u ON u.id = s."userId"
ORDER BY s."createdAt" DESC;

-- ============================================================
-- Q2. WHERE + ORDER BY: active startups ranked by MRR
-- ============================================================
SELECT id, name, "currentMonth", "cashCents", "mrrCents"
FROM "Startup"
WHERE status = 'ACTIVE'
ORDER BY "mrrCents" DESC, "cashCents" DESC;

-- ============================================================
-- Q3. JOIN: monthly turn history for every startup
-- ============================================================
SELECT s.name AS startup_name,
       t.month,
       t."createdAt",
       t.decisions,
       t.events,
       t.ledger
FROM "Turn" AS t
JOIN "Startup" AS s ON s.id = t."startupId"
ORDER BY s.name, t.month;

-- ============================================================
-- Q4. LEFT JOIN: include startups with zero employees
-- ============================================================
SELECT s.id,
       s.name,
       COUNT(e.id) FILTER (WHERE e."isActive" = TRUE) AS active_employee_count
FROM "Startup" AS s
LEFT JOIN "Employee" AS e ON e."startupId" = s.id
GROUP BY s.id, s.name
ORDER BY active_employee_count DESC, s.name;

-- ============================================================
-- Q5. GROUP BY: active headcount and monthly payroll by role
-- ============================================================
SELECT s.name AS startup_name,
       e.role,
       COUNT(*) FILTER (WHERE e."isActive" = TRUE) AS active_employees,
       COALESCE(
           SUM(e."salaryCents") FILTER (WHERE e."isActive" = TRUE), 0
       ) AS monthly_payroll_cents
FROM "Startup" AS s
JOIN "Employee" AS e ON e."startupId" = s.id
GROUP BY s.id, s.name, e.role
ORDER BY s.name, e.role;

-- ============================================================
-- Q6. HAVING: startups with at least two active employees
-- ============================================================
SELECT s.id,
       s.name,
       COUNT(e.id) FILTER (WHERE e."isActive" = TRUE) AS active_employee_count
FROM "Startup" AS s
LEFT JOIN "Employee" AS e ON e."startupId" = s.id
GROUP BY s.id, s.name
HAVING COUNT(e.id) FILTER (WHERE e."isActive" = TRUE) >= 2
ORDER BY active_employee_count DESC, s.name;

-- ============================================================
-- Q7. Aggregate: customer totals and cohort-derived MRR
-- ============================================================
SELECT s.id,
       s.name,
       COALESCE(SUM(c."currentCount"), 0) AS current_customers,
       COALESCE(
           SUM(c."currentCount"::BIGINT * c."monthlyPriceCents"), 0
       ) AS cohort_mrr_cents
FROM "Startup" AS s
LEFT JOIN "CustomerCohort" AS c ON c."startupId" = s.id
GROUP BY s.id, s.name
ORDER BY cohort_mrr_cents DESC;

-- ============================================================
-- Q8. Scalar subquery: startups above the overall average MRR
-- ============================================================
SELECT id, name, "mrrCents"
FROM "Startup"
WHERE "mrrCents" > (SELECT AVG("mrrCents") FROM "Startup")
ORDER BY "mrrCents" DESC;

-- ============================================================
-- Q9. Correlated subquery: latest recorded turn per startup
-- ============================================================
SELECT s.id,
       s.name,
       (
           SELECT MAX(t.month)
           FROM "Turn" AS t
           WHERE t."startupId" = s.id
       ) AS latest_recorded_month
FROM "Startup" AS s
ORDER BY s.name;

-- ============================================================
-- Q10. CASE: classify current startup state
-- ============================================================
SELECT id,
       name,
       status,
       "cashCents",
       "mrrCents",
       CASE
           WHEN status <> 'ACTIVE' THEN 'NOT_ACTIVE'
           WHEN "cashCents" <= 0 THEN 'CRITICAL_CASH'
           WHEN "mrrCents" >= 500000 THEN 'SEED_MRR_THRESHOLD_MET'
           ELSE 'GROWING'
       END AS health_category
FROM "Startup"
ORDER BY name;

-- ============================================================
-- Q11. Window function: month-over-month MRR change from snapshots
-- The engine serializes the newState object, including mrrCents, to JSONB.
-- ============================================================
WITH monthly_mrr AS (
    SELECT t."startupId",
           t.month,
           (t.snapshot ->> 'mrrCents')::NUMERIC AS mrr_cents
    FROM "Turn" AS t
)
SELECT s.name AS startup_name,
       m.month,
       m.mrr_cents,
       LAG(m.mrr_cents) OVER (
           PARTITION BY m."startupId" ORDER BY m.month
       ) AS previous_month_mrr_cents,
       m.mrr_cents - LAG(m.mrr_cents) OVER (
           PARTITION BY m."startupId" ORDER BY m.month
       ) AS mrr_change_cents
FROM monthly_mrr AS m
JOIN "Startup" AS s ON s.id = m."startupId"
ORDER BY s.name, m.month;

-- ============================================================
-- Q12. Window function: rank startups by current MRR
-- ============================================================
SELECT id,
       name,
       "mrrCents",
       RANK() OVER (ORDER BY "mrrCents" DESC) AS mrr_rank
FROM "Startup";

-- ============================================================
-- Q13. CTE: latest turn row for each startup
-- ============================================================
WITH latest_turn AS (
    SELECT DISTINCT ON ("startupId")
           "startupId", id AS turn_id, month, "createdAt"
    FROM "Turn"
    ORDER BY "startupId", month DESC
)
SELECT s.name AS startup_name,
       lt.turn_id,
       lt.month,
       lt."createdAt"
FROM "Startup" AS s
LEFT JOIN latest_turn AS lt ON lt."startupId" = s.id
ORDER BY s.name;

-- ============================================================
-- Q14. EXISTS: users who own at least one active startup
-- ============================================================
SELECT u.id, u.name, u.email
FROM "User" AS u
WHERE EXISTS (
    SELECT 1
    FROM "Startup" AS s
    WHERE s."userId" = u.id
      AND s.status = 'ACTIVE'
)
ORDER BY u.name;

-- ============================================================
-- Q15. UNION: startup IDs represented in either turns or cohorts
-- ============================================================
SELECT "startupId" FROM "Turn"
UNION
SELECT "startupId" FROM "CustomerCohort";

-- ============================================================
-- Q16. JSONB: expand market-event arrays and filter by event type
-- ============================================================
SELECT t."startupId",
       t.month,
       event_item ->> 'type' AS event_type,
       event_item ->> 'description' AS event_description,
       event_item ->> 'impact' AS event_impact
FROM "Turn" AS t
CROSS JOIN LATERAL jsonb_array_elements(t.events) AS events(event_item)
WHERE event_item ? 'type'
ORDER BY t."startupId", t.month;

-- ============================================================
-- Q17. INSERT: add an employee to an existing startup
-- Replace the UUID with a real Startup.id before uncommenting.
-- ============================================================
-- INSERT INTO "Employee"
--     ("startupId", role, "salaryCents", "hiredMonth", "isActive")
-- VALUES
--     ('00000000-0000-0000-0000-000000000001', 'ENGINEERING', 1200000, 1, TRUE)
-- RETURNING *;

-- ============================================================
-- Q18. UPDATE: mark an employee as inactive
-- Replace the UUID and month before uncommenting.
-- ============================================================
-- UPDATE "Employee"
-- SET "isActive" = FALSE,
--     "firedMonth" = 4
-- WHERE id = '00000000-0000-0000-0000-000000000002'
-- RETURNING id, "startupId", role, "isActive", "firedMonth";

-- ============================================================
-- Q19. DELETE: remove an expired idempotency response
-- Only run when permitted by the application's retention policy.
-- ============================================================
-- DELETE FROM "IdempotencyKey"
-- WHERE key = 'replace-with-an-expired-idempotency-key'
-- RETURNING key, "createdAt";

-- ============================================================
-- Q20. Performance-test query used for CP4 plan/timing capture
-- ============================================================
SELECT s.id,
       s.name,
       COUNT(e.id) AS employee_records
FROM "Startup" AS s
LEFT JOIN "Employee" AS e ON e."startupId" = s.id
WHERE s.status = 'ACTIVE'
GROUP BY s.id, s.name
ORDER BY employee_records DESC, s.name;
