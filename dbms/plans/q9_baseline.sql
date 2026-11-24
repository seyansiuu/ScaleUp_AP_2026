EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT s.id,
       s.name,
       (
           SELECT MAX(t.month)
           FROM "Turn" AS t
           WHERE t."startupId" = s.id
       ) AS latest_recorded_month
FROM "Startup" AS s
ORDER BY s.name;
