# Checkpoint 4 — Query Timings and Execution Plans

## Environment

Record the actual environment used for the benchmark. Do not compare results from different database versions or machines as if they were directly equivalent.

| Item | Value |
|---|---|
| PostgreSQL version (`SELECT version();`) | TODO — record actual output |
| OS / machine | TODO |
| CPU / RAM | TODO |
| Dataset source and scale | TODO — record row counts below |
| Benchmark date | TODO |
| Cache condition | TODO — state warm-cache or cold-cache procedure |

### Dataset row counts

Run this after loading the database and record the results:

```sql
SELECT 'User' AS table_name, COUNT(*) AS row_count FROM "User"
UNION ALL SELECT 'Startup', COUNT(*) FROM "Startup"
UNION ALL SELECT 'Turn', COUNT(*) FROM "Turn"
UNION ALL SELECT 'Employee', COUNT(*) FROM "Employee"
UNION ALL SELECT 'CustomerCohort', COUNT(*) FROM "CustomerCohort"
UNION ALL SELECT 'IdempotencyKey', COUNT(*) FROM "IdempotencyKey";
```

## Methodology

1. Apply `dbms/03_schema.sql` to the benchmark database and load the same dataset for every test.
2. Run `ANALYZE;` before measuring so PostgreSQL has current table statistics.
3. For each selected query, run one warm-up execution, then collect at least three measured executions using `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)`.
4. Record the `Execution Time`, planning time, shared buffer hits/reads, and the chosen scan/join nodes from each plan.
5. Use the arithmetic mean of the three measured execution times. Do not invent or fill timing values before running the tests.
6. Save the exact output of each measured plan in `dbms/plans/`.

## Queries selected for benchmarking

- **Q2** — active startups ordered by MRR; useful for evaluating a filter-and-sort access path.
- **Q20** — active startups joined to employees and grouped; useful for evaluating join, aggregation, and index behaviour.
- **Q9** — correlated lookup of the latest turn month per startup; useful for assessing the `Turn(startupId, month)` unique index.

## Running the capture script

From the repository root on macOS/Linux, load the project environment and run the plan collector:

```bash
cd backend
set -a
source .env
set +a
cd ..
bash dbms/plans/capture_plans.sh
```

This script does not change data or create indexes. It only executes `EXPLAIN ANALYZE` read queries and writes their output under `dbms/plans/`. Make sure the backend database is already running and contains the dataset you intend to benchmark.

## Timing results

Fill the table with actual `Execution Time` values in milliseconds from the saved `EXPLAIN ANALYZE` output.

| Query | Run 1 (ms) | Run 2 (ms) | Run 3 (ms) | Mean (ms) | Plan file |
|---|---:|---:|---:|---:|---|
| Q2 baseline | TODO | TODO | TODO | TODO | `plans/q2_baseline.txt` |
| Q20 baseline | TODO | TODO | TODO | TODO | `plans/q20_baseline.txt` |
| Q9 baseline | TODO | TODO | TODO | TODO | `plans/q9_baseline.txt` |
| Q2 after index (optional) | TODO | TODO | TODO | TODO | `plans/q2_after_index.txt` |

## Index evaluation

The schema already defines indexes on startup ownership, turn-to-startup, employee-to-startup, cohort-to-startup, and idempotency relationships. It also defines a unique index on `(Turn.startupId, Turn.month)` through the unique constraint.

For an optional before/after experiment on Q2, test this additional index in a disposable benchmark database:

```sql
CREATE INDEX startup_status_mrr_idx
ON "Startup" (status, "mrrCents" DESC, "cashCents" DESC);
ANALYZE "Startup";
```

Re-run Q2 with the same dataset and capture the plan as `plans/q2_after_index.txt`. Keep the index only if the measured plan and timings show a meaningful benefit for the tested workload. On a small dataset PostgreSQL may correctly prefer a sequential scan; report what the planner actually chooses.

## Analysis and conclusion

Complete this section after collecting actual plans and timings:

- Which scan and join strategies did PostgreSQL choose?
- Did the candidate index change the plan for Q2?
- Did buffer reads/hits change between baseline and indexed runs?
- Which query was fastest/slowest on this dataset, and why might dataset size affect that result?
- What limitations exist (small dataset, warm cache, local machine, or synthetic data)?

**Status:** methodology and capture targets prepared; measured timings and execution-plan evidence still need to be collected from the team's PostgreSQL instance.
