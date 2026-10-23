# Remaining work — plan (written 08:45 UTC, deadline 09:00 UTC)

Spec: `docs/superpowers/specs/2026-10-23-cashmine-payback-design.md`.

**Done:** T0 setup and deploy, T1 money, T2 API client, T3 token, T4 Home, T5 claim flow, T6 tracking
and overlay, most of T8 (NOTES, README, AI logs 01 and 02).
**Checks:** 143 unit tests passing, typecheck and lint clean. Live at
https://tvittiqw-cashmine-task.expo.app.

## Before 09:00 (in order, nothing else)

| # | Step | Owner | Done when |
|---|------|-------|-----------|
| 1 | Commit the work as layered commits (setup → money → API → token → claims core → Home → claim UI → docs) | AI | `git log` shows each layer; the working tree is clean apart from `.idea/` |
| 2 | Push to `origin` (GitHub `Tvittiqw/cashmine-task`) and confirm the repo is public | User | The commits are visible on GitHub |
| 3 | Phone pass on the live link at about 390 px: token → Home → claim 10 USDT (Max, an invalid amount, review) → status shows completed → Home shows "includes your claim", then settles | User | No broken screen; write down anything odd |
| 4 | If step 3 finds a blocker, apply only the smallest safe fix, then test, typecheck, lint, export, deploy, commit and push | AI + User | Redeployed before 08:58 |
| 5 | Read "Working with AI" in NOTES.md and adjust the three moments to your own words | User | NOTES.md is true to your experience |
| 6 | Reply to the email: repo link, live link, roughly 2 h spent, and the AI tool used | User | Sent before 09:00 |
| 7 | Delete the token file in the session scratchpad | AI | File gone |

No push and no redeploy after 09:00.

## Deliberately not done (already in NOTES.md → "Not done / known issues")

- **T7 Activity.** There isn't enough time to build it to the same standard. The approach is
  written down: an infinite list, duplicates dropped by `id` because the API's pages overlap by
  one item.
- **End-to-end or UI tests.** Coverage is unit tests on all money, API, overlay and submission
  logic.

## If there were more time (next steps, in priority order)

1. **Activity (T7):**
   - `useInfiniteQuery` with `limit=20`, dropping duplicates by `id`.
   - Rows for accrual, reversal and claim, with a claim's `relatedId` linking to `/claims/[id]`.
   - States: loading, error with retry for the failed page, end of list, and pull-to-refresh.
2. **UI tests** with React Native Testing Library for `ClaimForm`, covering:
   - Max fills exactly the available amount
   - the comma-to-dot conversion is visible in the field
   - a double tap on Confirm sends one request
3. **Throttled-network browser tests:** a 504 followed by Check status, a token change while a
   claim is unresolved, and a reload during submission.
4. **Make forgetting the token reliable:** surface a failed storage removal instead of ignoring it.
