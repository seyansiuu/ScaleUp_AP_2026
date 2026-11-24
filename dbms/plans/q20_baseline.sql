EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT s.id,
       s.name,
       COUNT(e.id) AS employee_records
FROM "Startup" AS s
LEFT JOIN "Employee" AS e ON e."startupId" = s.id
WHERE s.status = 'ACTIVE'
GROUP BY s.id, s.name
ORDER BY employee_records DESC, s.name;
