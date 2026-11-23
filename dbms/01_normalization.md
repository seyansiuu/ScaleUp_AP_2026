# ScaleUp Database Normalization (1NF, 2NF, 3NF)

## 1. Scope and source

This analysis is based on the current ScaleUp Prisma models: `User`, `Startup`,
`Turn`, `Employee`, `CustomerCohort`, and `IdempotencyKey`.

The schema stores money as integer cents (`BigInt`) and uses UUID identifiers
for the main business entities. JSON columns in `Turn` preserve monthly
simulation snapshots, founder decisions, market events, and ledger data.

## 2. Unnormalized view (UNF)

A naïve, unnormalized startup record might combine a founder's details, startup
state, monthly turns, employees, customer cohorts, and idempotency responses
into one large record. Repeating groups would appear for:

- multiple startups owned by one user;
- multiple monthly turns per startup;
- multiple employees per startup;
- multiple customer cohorts per startup;
- multiple idempotency records per startup.

Embedding these repeating groups in one row would create duplication and
insert, update, and delete anomalies.

## 3. First Normal Form (1NF)

**Rule:** Each column contains one atomic value, and each row is uniquely
identifiable. Repeating groups are moved into separate relations.

ScaleUp's relational entities are separated as follows:

- `User`: one row per user.
- `Startup`: one row per startup; `user_id` identifies its owner.
- `Turn`: one row per startup per simulation month.
- `Employee`: one row per employee record.
- `CustomerCohort`: one row per acquired customer cohort.
- `IdempotencyKey`: one row per idempotency key.

Primary keys uniquely identify rows. The unique constraint on
`Turn(startup_id, month)` prevents two turn records for the same startup and
month.

**JSON note:** `Turn.snapshot`, `Turn.decisions`, `Turn.events`, and
`Turn.ledger` are JSON documents in the current application design. They are
treated as atomic payloads by the relational schema and are not decomposed
into relational attributes here. If the coursework requires every nested JSON
attribute to be relationally atomic, these payloads would need a separate
normalization design.

## 4. Second Normal Form (2NF)

**Rule:** The relation is in 1NF and every non-key attribute is fully
functionally dependent on the whole candidate key; no partial dependency on
part of a composite key is allowed.

The current tables use single-column primary keys, so no non-key attribute
can depend on only part of the declared primary key. `Turn` additionally has
the candidate key `(startup_id, month)`. Its monthly payload fields
(`snapshot`, `decisions`, `events`, `ledger`, `created_at`) describe that
specific startup-month pair, not only `startup_id` or only `month`.

Similarly, employee attributes describe one employee record, cohort attributes
describe one cohort, and idempotency response attributes describe one key.
Therefore, the listed relations satisfy 2NF under their declared keys.

## 5. Third Normal Form (3NF)

**Rule:** The relation is in 2NF and non-key attributes do not depend
transitively on a candidate key through another non-key attribute.

- `User`: `email`, `password`, `name`, and `created_at` describe the user
  identified by `user_id`. Email is independently unique.
- `Startup`: startup state attributes depend on `startup_id`. `user_id` is a
  foreign key; user name/email are not copied into this table.
- `Turn`: monthly simulation payload depends on the startup-month record.
  Startup owner/name details are not duplicated in each turn.
- `Employee`: role, salary, hiring/firing months, and active status depend on
  `employee_id`; startup details are referenced through `startup_id`.
- `CustomerCohort`: acquisition and customer-count attributes depend on
  `cohort_id`; startup details are referenced through `startup_id`.
- `IdempotencyKey`: response and turn association depend on `key`; startup
  details are referenced through `startup_id`.

No transitive dependencies are intentionally stored across these relations.
Thus the relational structure is in 3NF, assuming the stated functional
dependencies and the current JSON payload boundary.

## 6. Functional dependencies

| Relation | Main functional dependencies |
|---|---|
| User | `user_id -> email, password, name, created_at`; `email -> user_id, password, name, created_at` |
| Startup | `startup_id -> user_id, name, seed, current_month, status, cash_cents, mrr_cents, product_price_cents, quality_score, founder_equity_bps, raised_seed, raised_series_a, created_at, updated_at` |
| Turn | `turn_id -> startup_id, month, snapshot, decisions, events, ledger, created_at`; `(startup_id, month) -> turn_id, snapshot, decisions, events, ledger, created_at` |
| Employee | `employee_id -> startup_id, role, salary_cents, hired_month, fired_month, is_active` |
| CustomerCohort | `cohort_id -> startup_id, acquired_month, initial_count, current_count, monthly_price_cents` |
| IdempotencyKey | `key -> startup_id, turn_id, response, created_at` |

## 7. Final 3NF relation set

- `User(user_id PK, email UNIQUE, password, name, created_at)`
- `Startup(startup_id PK, user_id FK, name, seed, current_month, status,
  cash_cents, mrr_cents, product_price_cents, quality_score,
  founder_equity_bps, raised_seed, raised_series_a, created_at, updated_at)`
- `Turn(turn_id PK, startup_id FK, month, snapshot, decisions, events, ledger,
  created_at, UNIQUE(startup_id, month))`
- `Employee(employee_id PK, startup_id FK, role, salary_cents, hired_month,
  fired_month, is_active)`
- `CustomerCohort(cohort_id PK, startup_id FK, acquired_month, initial_count,
  current_count, monthly_price_cents)`
- `IdempotencyKey(key PK, startup_id FK, turn_id FK, response, created_at)`

## 8. Design assumptions / notes

1. `Turn` references a startup and is unique per startup-month.
2. `IdempotencyKey.key` is globally unique in the current Prisma schema.
   Scoping it by `(startup_id, key)` may be a future security improvement,
   but this document preserves the current model.
3. `role` and `status` are represented as strings in Prisma; SQL CHECK
   constraints document the values currently used by the application.
4. JSON payloads are retained because the simulation engine records flexible
   monthly snapshots and event/ledger structures.
5. This is a normalization analysis of the current application schema, not a
   claim that every nested JSON property has been independently normalized.
