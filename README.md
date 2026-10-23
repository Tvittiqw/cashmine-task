# CashMine payback (Expo, web)

**Live:** https://tvittiqw-cashmine-task.expo.app. Open it on a phone and paste your API token.

## Run locally

```bash
npm install
npx expo start --web                 # dev server
npm test                             # unit tests (money, API client, claim overlay, claim replay)
npm run typecheck && npm run lint
npx expo export --platform web       # static build in dist/
```

The API base URL is defined in one place, `src/lib/api/apiClient.ts`. The token is never in the code.
The app asks for it on first open and keeps it in browser storage.

## What works

- **Token:** entry with verification, stored in the browser, change or forget. A rejected or expired
  token returns you to the token screen.
- **Home:**
  - Per-asset available, pending and claiming balances.
  - Total ≈ USD and "available to claim" ≈ USD.
  - How fresh the data is, from the server's `asOf`.
  - Pull-to-refresh and a refresh button, a loading state, an error with retry, and a stale-data
    banner.
  - Claims in progress, and failed-claim notices.
- **Claim:**
  - Pick an asset and a destination.
  - Enter an amount or tap Max, with validation against the API's rules.
  - Fee and "you receive" preview, a review step, then confirm.
  - Safe submission: an idempotency key, re-sends with the same key while the outcome is unknown,
    and a "couldn't confirm" state.
  - A status screen polls until the claim completes or fails.
- **Tests:** amount parsing and formatting, validation, fee and receive, USD totals, API errors and
  response checks, the balance overlay after a claim, and claim re-sends.
- **Activity:** paginated history of paybacks, reversals and claims. Duplicate rows at page
  boundaries are dropped, failed claims are shown as not deducted, and your own claims link to
  their status.
