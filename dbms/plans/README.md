# Execution plan evidence

This directory contains the repeatable query definitions and a collector script for CP4.

## Capture real plans

From the repository root, export `DATABASE_URL` (the project `.env` file is under `backend/`) and run:

```bash
bash dbms/plans/capture_plans.sh
```

The script runs each query three times with `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` and creates:

- `q2_baseline.txt`
- `q20_baseline.txt`
- `q9_baseline.txt`

The `.sql` files contain the exact statements being measured. The `.txt` files are generated evidence and must be produced on the team's actual PostgreSQL database. No timings or plans have been fabricated here.

For the optional Q2 after-index comparison, create the candidate index described in `../05_query_timings.md`, run the Q2 explain statement three more times, and save the output as `q2_after_index.txt`.
