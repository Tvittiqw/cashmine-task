# Notes

## Decisions

**Amounts: `bigint` base units, never JS `number`.**
- Every amount is parsed from the API's decimal string into an integer count of the asset's smallest
  unit, using the server's regex and its decimal limit. It is serialised back to a canonical string
  for requests.
- ETH has 18 decimals (`12.365678901234591676`), which a float can't hold.
- USD values are exact: price and amount are multiplied as bigints, summed, and rounded half-up to
  cents only once, for display.
- Lists show crypto amounts truncated, never rounded up. Max, review and status screens show exact
  values.
- Alternatives: `number` (loses precision); `big.js` or `decimal.js` (fine, but an extra dependency
  for something bigint does natively).
- Code: `src/lib/money/`, with tests.

**Balance right after a claim: option C, a confirmed-claim overlay reconciled by `asOf`.**
- The AI laid out three options in `ai-logs/01-…md` (end of the log):
  - A: subtract on tap.
  - B: show only the server snapshot, plus a "claim in progress" card.
  - C: once the server returns the claim, subtract it from any snapshot whose `asOf` is older than
    the claim's `createdAt`.
- A causes the second user's complaint: the next stale snapshot (up to 15 s old) puts the money
  back. B causes the first user's: the balance doesn't move, so they claim again.
- C only applies server-confirmed facts. It hands over to the server automatically once a newer
  snapshot arrives, so nothing jumps back. A failed claim is the only legitimate rise, and the app
  announces it with a banner.
- Verified live: the first snapshot with `asOf > createdAt` already showed available −10 and
  claiming +10.
- The claim form uses the overlaid balance too, so the same money can't be claimed twice. If the
  timestamp assumption ever broke, the fallback is B.
- Code: `src/features/claims/reconcile.ts`, with tests.

**Unknown claim outcome (timeout, 5xx, network): same-key replay.**
- Each confirmed claim gets one `Idempotency-Key` (a UUID) and a frozen body, stored before sending.
- 201 or 200 means created.
- 400, 401 or 409 means definitely not created.
- Anything else is unknown. The app re-sends the identical request with the same key up to 3 times
  (1, 2 and 4 s, or `retryAfterMs`). The API returns the original claim for a repeated key, so this
  can never create a duplicate.
- If it's still unknown, the user sees "We couldn't confirm your claim yet. Don't submit it again",
  with **Check status** (the same safe replay) and **Dismiss**. New claims are blocked meanwhile.
- After a reload, the app doesn't replay silently; the user has to tap Check status.
- This happened during testing: a POST returned **504**, and the same-key replay returned 200 with
  the claim the 504 had in fact created.
- Code: `src/features/claims/submitClaim.ts`, with tests.

**Other decisions.**
- USD totals:
  - The total is available + pending + claiming, so a claim in flight doesn't change it.
  - "Available to claim" is shown separately.
  - An asset with a missing price is excluded and named. It's never counted as $0.
- Retries: reads retry up to 3 times with backoff on network errors, 429 and 5xx. 429 honours
  `retryAfterMs`.
- Rate budget: the rate limit is about 25–30 requests per minute (observed, not documented).
  Balances refresh every 30 s; claim status is checked every 3 s, then every 6 s.
- Destinations: if there is more than one, nothing is preselected, because money goes there.
- Token:
  - It's verified against `/v1/balances` before being saved, and rejected if it contains
    non-printable characters.
  - It's kept in AsyncStorage (localStorage on web) through `src/lib/storage/storage.ts`.
  - Any 401 sends the user back to the token screen.
  - Changing the token clears all cached data and tracked claims.
- Comma in the amount: it's converted to a dot while typing, so the user sees it. `10,000` visibly
  becomes `10.000`; the conversion never happens silently.

## Working with AI

All sessions used Claude Code. Logs are in `ai-logs/`, exported from the raw transcript with the token
redacted.

1. **A prompt that didn't get me what I wanted:**
   - I asked for the API investigation, the task split and the spec in one prompt (log 01, first
     message).
   - The AI produced a big up-front spec with its own folder layout (`src/api/`, `src/config/`).
   - I changed course by giving it the exact structure I wanted (`src/lib/api/apiClient.ts` and
     `endpoints.ts`), and later asked for a separate storage service (log 02).
   - Lesson: give it the target structure in the prompt instead of reviewing its layout afterwards.
2. **AI output that was wrong or risky:**
   - I ran `/code-review` on the AI's own code (log 02). It found that the AI-written
     `normalizeInput` turned every `,` into `.`, so a US user typing `10,000` USDT would get a valid
     **10 USDT** claim.
   - It also found that the token screen saved tokens it couldn't verify, and that a pasted
     zero-width space was misreported as a network error.
   - Earlier (log 01), the AI's own API probe silently sent no `Idempotency-Key`, because zsh
     doesn't word-split variables. I caught it because all 12 "validation" responses were the same
     header error.
3. **A suggestion I disagreed with or rejected:**
   - I reset the AI's commit and committed the spec and logs myself (log 02, the "reset" episode),
     because I wanted control over commit history.
   - From the review, I rejected making `useRequiredToken` throw. It returns `''` on purpose for
     the single render between "forget token" and the route guard; throwing would crash.
   - I also rejected rewiring the module-level 401 callback, which wasn't worth the time.

## Not done / known issues

- **Activity (T7) is not built.** The plan was an infinite list that drops duplicates by `id`,
  because the API's pages overlap by one item (observed, not documented).
- **Untested in a real browser:**
  - The full flows were tested only through unit tests, typecheck and the API.
  - Next would be a pass at 390 px covering slow networks, a claim timeout followed by Check
    status, and switching tokens.
- **Fee could change after review:**
  - The fee in the review comes from claim-options, refetched on entering review. The API takes no
    fee in the request, so a fee change between review and submit can't be prevented.
  - The status screen shows the server's `fee` and `receiveAmount`.
- **Dismissing an unknown claim** forgets its key locally. If the claim did exist, it shows up under
  Claiming but isn't tracked on the status screen.
- **Idempotency key lifetime:** keys are assumed to live at least as long as the token. The docs
  don't say.
- **Token removal:** if storage removal fails, `forgetToken` ignores it, so the token could come back
  after a reload.
- **No end-to-end UI tests.**
