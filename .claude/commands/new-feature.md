Before implementing any new feature:

1. Verify that the feature aligns with the ministry purpose (no monetization, no vanity metrics, privacy first)
2. Create a branch: `git checkout -b feature/feature-name`
3. Implement the feature with i18n support (both ES and EN)
4. Run type check: `npx tsc --noEmit`
5. Run lint: `npm run lint`
6. Create a PR with a description of the feature and its ministry purpose
