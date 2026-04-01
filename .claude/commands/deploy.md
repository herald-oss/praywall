Deploy Praywall to Railway.

1. Verify that all environment variables are set in Railway:
   - DATABASE_URL (from Railway PostgreSQL add-on)
   - BETTER_AUTH_SECRET (generate a secure 32+ char secret)
   - BETTER_AUTH_URL (production URL)
   - NEXT_PUBLIC_APP_URL (production URL)
2. Run `railway up` or push to the connected GitHub branch
3. Verify that migrations ran during build (check build logs)
4. Verify the app responds at the Railway URL
5. Report the deploy URL
