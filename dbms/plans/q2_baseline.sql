EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, "currentMonth", "cashCents", "mrrCents"
FROM "Startup"
WHERE status = 'ACTIVE'
ORDER BY "mrrCents" DESC, "cashCents" DESC;
