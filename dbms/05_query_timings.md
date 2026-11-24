# Checkpoint 4 — Query Timings and Execution Plans

## 1. Benchmark Environment

| Item | Value |
|---|---|
| PostgreSQL version | PostgreSQL 18.7 (Postgres.app) |
| Operating system | macOS 15.6.1 |
| Processor | Apple M4 |
| RAM | 16 GB |
| Architecture | ARM64 (aarch64) |
| Benchmark database | scaleup_benchmark |
| Benchmark date | 24 November 2026 |
| Dataset | Synthetic ScaleUp benchmark dataset |
| Cache condition | Warm-up execution followed by 3 measured runs |

## 2. Dataset Row Counts

| Table | Row Count |
|---|---:|
| User | 2 |
| Startup | 3 |
| Turn | 3 |
| Employee | 5 |
| CustomerCohort | 4 |
| IdempotencyKey | 1 |

The dataset was created using the benchmark seed SQL file.
The same dataset was used for all baseline measurements.

## 3. Benchmark Methodology

1. Created an isolated PostgreSQL benchmark database.
2. Applied the relational schema from `03_schema.sql`.
3. Inserted synthetic benchmark records.
4. Executed the CP3 SQL queries and checked for errors.
5. Ran ANALYZE to update PostgreSQL table statistics.
6. Executed one warm-up run for each selected benchmark query.
7. Captured three measured runs using:

   `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)`

8. Recorded planning time, execution time, scan methods,
   join strategies, sorting and buffer information.
9. Calculated arithmetic mean execution times.

## 4. Execution Timing Results

All timings are in milliseconds.

| Query | Run 1 | Run 2 | Run 3 | Average |
|---|---:|---:|---:|---:|
| Q2 | 0.122 | 0.110 | 0.097 | 0.110 |
| Q20 | 0.129 | 0.124 | 0.120 | 0.124 |
| Q9 | 0.080 | 0.077 | 0.088 | 0.082 |

Average values are rounded to three decimal places.

## 5. Planning Time Results

All planning times are in milliseconds.

| Query | Run 1 | Run 2 | Run 3 | Average |
|---|---:|---:|---:|---:|
| Q2 | 0.595 | 0.394 | 0.384 | 0.458 |
| Q20 | 0.526 | 0.516 | 0.386 | 0.476 |
| Q9 | 0.301 | 0.278 | 0.292 | 0.290 |

## 6. Query Plan Analysis

### Q2 — Active Startups Ranked by MRR

Execution strategy:
- Sequential Scan on Startup.
- Sort using quicksort.
- Sort keys: mrrCents DESC, cashCents DESC.
- Sort memory: 25 kB.

PostgreSQL selected a sequential scan because the Startup table
contains only three records. The filtered results contained
two active startups.

No index scan was selected for this small dataset.

Evidence: `plans/q2_baseline.txt`

### Q20 — Active Startups and Employee Records

Execution strategy:
- Sequential Scan on Employee.
- Sequential Scan on Startup.
- Hash Right Join.
- HashAggregate.
- Sort using quicksort.

The database joined startup and employee records,
aggregated employee counts and sorted the results.

The hash join and aggregation were selected by PostgreSQL
for the small benchmark dataset.

Evidence: `plans/q20_baseline.txt`

### Q9 — Latest Recorded Turn per Startup

Execution strategy:
- Sequential Scan on Startup.
- Aggregate operation for the correlated subquery.
- Sequential Scan on Turn.
- Sort by startup name.

The correlated subquery executed three times,
once for each startup (loops=3).

Although the schema has a unique index on
(Turn.startupId, Turn.month), PostgreSQL selected
a sequential scan because the table contains only three records.

Evidence: `plans/q9_baseline.txt`

## 7. Performance Comparison

Q9 recorded the lowest average execution time at 0.082 ms.

Q2 recorded an average of 0.110 ms.

Q20 recorded the highest average execution time at 0.124 ms.

Q20 involves a join, aggregation and sorting operations,
which explains its additional processing compared with
the other two queries in this test.

These measurements are specific to the local benchmark
environment and the small synthetic dataset.

## 8. Limitations

- The benchmark dataset is small.
- Measurements were collected on a local Apple M4 machine.
- Warm-cache measurements were used.
- Execution times below one millisecond are sensitive to
  local system activity and measurement overhead.
- The results should not be treated as production-scale
  performance measurements.
- No cold-cache comparison was performed.
- No post-index comparison has been performed yet.

## 9. Conclusion

The selected queries executed successfully on PostgreSQL 18.7.

PostgreSQL used sequential scans for the small tables,
a hash join and hash aggregation for Q20,
and a correlated aggregate for Q9.

The baseline timings and execution plans have been
collected and documented for the ScaleUp database project.

## 10. Evidence Files

- `plans/q2_baseline.sql`
- `plans/q2_baseline.txt`
- `plans/q20_baseline.sql`
- `plans/q20_baseline.txt`
- `plans/q9_baseline.sql`
- `plans/q9_baseline.txt`
- `plans/capture_plans.sh`

Baseline benchmark status: Completed.
