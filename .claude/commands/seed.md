Seed test data into Praywall's local PostgreSQL database.

1. Ensure Docker PostgreSQL is running: `docker compose up -d`
2. Run migrations if needed: `npm run db:migrate`
3. Insert 10 test prayer requests in Spanish and English with varied categories
4. Insert random intercessions to test the 33-intercessor counter
5. Verify the data appears in `npm run db:studio`
