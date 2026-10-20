Deploy Praywall to Railway.

1. Verify the service settings in Railway (these live in the dashboard, not in a config file):
   - Build command: `npm run build`
   - Pre-deploy command: `npm run db:migrate:prod` (migrations run here, not at start)
   - Start command: `node --max-old-space-size=256 .next/standalone/server.js` (node directly, not `npm start`, to avoid a resident npm process)
   - Healthcheck path: `/api/health`
2. Verify the environment variables:
   - DATABASE_URL (from the Railway PostgreSQL add-on)
   - BETTER_AUTH_SECRET (32+ random characters)
   - BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL (production URL)
   - BETTER_AUTH_TRUSTED_ORIGINS (every production domain, comma-separated)
   - HOSTNAME=0.0.0.0
3. Run `railway up` or push to the connected GitHub branch
4. Check the pre-deploy logs show "Migrations applied."
5. Verify `/api/health` responds and the wall loads at the Railway URL
6. Report the deploy URL
