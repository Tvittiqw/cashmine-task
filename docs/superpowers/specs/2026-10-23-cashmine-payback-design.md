# CashMine Payback App — Design Spec & Task Breakdown

Date: 2026-10-23 · Deadline: **09:00 UTC hard stop** (no pushes/deploys after) · Spec written ~07:35 UTC
Status: **approved for build** (07:45 UTC). All decisions closed; D2 = option C (user's choice).

The assessment brief (task email) is authoritative. This document turns it into buildable
subtasks with shared contracts, so they can be built in parallel without stepping on each other.
Everything marked **[observed]** was verified against the live API on 2026-10-23 07:25–07:30 UTC;
**[documented]** comes from https://task-api.cashmine.io/docs; **[decision]** is our call and must be
explained in NOTES.md.

---

## 1. Intent

A slice of the CashMine mobile app (Expo/React Native, shipped as a web build, used on a ~390 px phone
screen): see payback balances, claim them, follow the claim to completion. Money is "real" to users,
so **correctness of amounts and of the claim flow beats polish and feature count.**

Priority order (from the brief): **Balances → Claim → Unit tests → Activity (optional).**

### Goals
- Exact money math (no floating point), validation identical to the server's rules.
- A claim flow that can never create an accidental duplicate and never lies about outcome.
- Every async state handled: loading, error + retry, refresh, stale data, rate limit, unknown outcome.
- Live web deploy early, redeployed after each milestone.

### Non-goals
- Native iOS/Android builds, push notifications, auth beyond the pasted token, i18n, dark mode.
- Pixel polish, animations, design system.

### Anti-goals (failure even if it "works")
- Any amount passing through JS `number` (ETH has 18 decimals).
- A retry path that can create a second claim.
- Balance that drops and then jumps back without explanation, or doesn't move so users claim twice.
- Token in source, repo, logs, build output, or `ai-logs/`.
- Silent fallback to fake/mock data, or treating a missing price as $0.

---

## 2. Constraints

- **Stack:** Expo SDK **58** (`expo ~58.0.17`), RN 0.88, React 19.3, TypeScript 6. These are newer
  than any model's training data — **before touching Expo APIs fetch
  https://docs.expo.dev/versions/v58.0.0/ and https://docs.expo.dev/llms.txt** (AGENTS.md rule).
- **Package manager: npm** (`package-lock.json`). Install with `npx expo install <pkg>`.
- **Navigation:** Expo Router, routes in `src/app/` (AGENTS.md). Current scaffold is the blank
  `App.tsx` template — T0 migrates it.
- **Token:** entered at runtime, kept in browser storage, changeable. Never in code/repo/build/logs.
- **API base URL** in exactly one place: `src/config/api.ts`.
- Do not start the dev server from an agent; the user runs `npx expo start --web`.
- Lint + typecheck + tests before declaring any subtask done.
- Commit at least every 30 min, never squash. Agents commit only when the user asks.

---

## 3. API reference (documented + observed)

Base URL `https://task-api.cashmine.io`. All `/v1` calls need `Authorization: Bearer <token>`.
CORS open; exposed headers: `Retry-After`, `Idempotent-Replayed`.

### 3.1 Endpoints

| Endpoint | Notes |
|---|---|
| `GET /v1/balances` | `{ asOf, items: [{ asset, decimals, available, pending, claiming, usdPrice }] }` |
| `GET /v1/activity?limit=1..20&cursor=` | `{ items: [...], nextCursor: string \| null }`, newest first |
| `GET /v1/claim-options?asset=X` | `{ asset, minAmount, fee, destinations: [{ id, label }] }` |
| `POST /v1/claims` | header `Idempotency-Key` (1–100 chars, **required**); body `{ asset, amount, destinationId }` → 201 claim (200 + `Idempotent-Replayed: true` on replay) |
| `GET /v1/claims/{id}` | the claim; 404 `NOT_FOUND` for unknown id |

Claim object: `{ id, asset, amount, fee, receiveAmount, destinationId, status: pending|completed|failed, failureReason, createdAt, updatedAt }`.

### 3.2 Live data for this token [observed]

| Asset | decimals | available | pending | minAmount | fee | usdPrice |
|---|---|---|---|---|---|---|
| USDT | 6 | 870.533207 | 4.75 | 10 | 1.5 | 1.0002 |
| BTC | 8 | 0.01246567 | 0 | 0.0005 | 0.00002 | 67312.45 |
| ETH | **18** | 12.365678901234591676 | 0 | 0.01 | 0.0012 | 2461.08 |

- Destinations (same for all 3 assets): `dest_exchange` "Binance account (UID ••4821)",
  `dest_wallet` "Wallet 0x8f3e…a91c". **The brief doesn't mention destinations, but the API requires one.**
- Asset list must come from `/v1/balances`, never hard-coded (graders' tokens may differ).
- Fee is a **flat per-asset amount** taken from the claimed amount: `receive = amount − fee` [documented].

### 3.3 Amount format & validation [documented + observed]

- Amounts are decimal strings in the asset's unit. Format regex (server-equivalent):
  `^(0|[1-9]\d*)(\.\d+)?$`. Rejected: `.5`, `1.`, `05`, `1e-3`, `-1`, JSON numbers.
- Trailing zeros are **accepted** (`"0.0010"` passed format, failed on min) [observed].
- At most `decimals` fractional digits ("BTC amounts have at most 8 decimal places").
- Rules: `minAmount ≤ amount ≤ available`; `available` checked **live** server-side, not against snapshot.
- `"0"` → "The minimum claim is 0.01 ETH" (zero is reported as below-min) [observed].
- Server validation order [observed]: Idempotency-Key → amount format → decimals → min → available.
  Bad `destinationId` wasn't reached when amount was invalid (destination check untested — don't
  submit a valid claim to probe it).

### 3.4 Errors

`{ "error": { "code", "message", "field"?, "retryAfterMs"? } }`

| HTTP | code | Read (GET) handling | Claim (POST) meaning |
|---|---|---|---|
| 400 | VALIDATION | show message, no retry | **not created** → show field error |
| 401 | UNAUTHORIZED | go to token screen | **not created** |
| 404 | NOT_FOUND | show not-found | n/a |
| 409 | IDEMPOTENCY_MISMATCH | n/a | **not created** (client bug: same key, different body) |
| 429 | RATE_LIMITED | wait `retryAfterMs`, retry | outcome unknown → replay same key after wait |
| 500/503 | SERVER | retry w/ backoff | outcome unknown → replay same key |
| 504 | TIMEOUT | retry | **"outcome is unknown"** [documented] → replay same key |
| — | network error / client timeout / unparsable body | retry | outcome unknown → replay same key |

Observed messages: 401 `"Missing or invalid token"`; 404 `"Claim not found"` / `"No such endpoint"`;
503 `"Service temporarily unavailable"`; 429 `retryAfterMs: 5841` + `retry-after: 6`.

### 3.5 Behaviours that will bite [observed]

1. **Activity pages overlap by one item.** Cursor is opaque but decodes to `{"o":offset}`; next
   offset = previous offset + limit − 1, so page N+1 starts with the last item of page N
   (`act_28w6s` appeared on both page 1 and 2). New accruals arriving at the head shift offsets too.
   → **Dedupe by `id` across pages.** Don't parse or construct cursors.
2. **Rate limit is low.** About 25–30 requests within roughly a minute triggered 429, with
   `retryAfterMs` of up to about 6 s. The limit looked like a rolling window (the wait shrank
   steadily). The exact limit isn't documented. → Budget polling, no aggressive auto-refresh, honour
   `retryAfterMs`.
3. **Chaos.** 2 × 503 in ~40 requests under `"chaos":"normal"` (token payload field). Graders may use
   harsher chaos tokens → every request path must survive transient failures.
4. **Snapshots:** `asOf` moves on a 15 s grid (`07:25:31.261`, `07:27:01.261`). A new claim may not
   appear in balances for up to ~15 s [documented].
5. Accruals go `pending → confirmed` over time and new accruals appear live (one appeared at
   07:23 today), so balances and activity change between refreshes.
6. History is ~30 days (2026-09-24 → today): 27 items — 21 accruals (1 pending), 2 reversals, 3
   completed claims, 1 failed claim. Older claims have `relatedId: null`.

---

## 4. Decisions

### D1 — Amount representation **[decision: bigint base units]**
- Every amount is a `bigint` count of the asset's smallest unit (`10^-decimals`), parsed from the
  API's string with the strict regex and serialized back to a **canonical** string (no trailing
  zeros, no trailing dot) for requests. JS `number` is never used for asset amounts.
- USD values: exact bigint math. `usdPrice` is parsed at its own scale and multiplied, then
  everything is summed at a common scale and **rounded once** (half-up to cents) for display, shown
  as approximate (`≈ $…`).
- Display of crypto amounts **never rounds up**: list views may truncate (floor) long fractions
  (ETH) to 8 digits with grouping. Max, review and claim screens show the exact value.
- Alternatives rejected: `number` (loses ETH precision past ~15–17 significant digits); a decimal
  library such as big.js or decimal.js (would work, but it's an extra dependency and bigint is
  native in Hermes/web and exact for fixed decimals).

### D2 — Balance shown right after a claim is submitted **[decision: C — confirmed-claim overlay]**
The brief requires discussing at least two approaches with the AI before choosing. That discussion
is in `ai-logs/01-api-investigation-spec-and-balance-decision.md` (final assistant message and the
user's reply). The user chose **C** at 07:45 UTC.

Alternatives considered and rejected:
- **A. Optimistic subtract on tap** (before the server answers). Feedback is fast, but the next
  stale snapshot (`asOf` before the claim) overwrites it, which is the *"dropped, then jumped back"*
  complaint. It also has to roll back on 400 or an unknown outcome, and it guesses before the
  server has confirmed anything. Rejected because it causes the very distrust the second user
  described.
- **B. Server snapshot only + "claim in progress" card.** It never shows anything the server didn't
  say, but `available` stays unchanged for up to 15 s, which is the *"didn't change, so I claimed
  again"* complaint. Rejected as the primary behaviour; it's kept as the **fallback** if the C
  verification fails.

**Chosen: C. Apply only server-confirmed claims to snapshots that predate them.** The overlay
starts only once the server has returned the claim (201, or 200 on replay). That is a server fact,
not a guess: the docs say the amount "leaves `available` at once".
```
for each tracked claim c of this asset with Date.parse(c.createdAt) > Date.parse(snapshot.asOf):
    if c.status == failed: skip          // amount is back in available (or never left, as far as this snapshot knows)
    available -= c.amount
    if c.status == pending: claiming += c.amount
    // completed: amount left the account; the snapshot never saw it, so subtract from available only
```
Rules and edge cases:
1. **Hand-over is automatic.** Once a snapshot with `asOf > createdAt` arrives, the snapshot already
   includes the claim and the overlay no longer applies. Nothing jumps back.
2. **The only legitimate rise is a failed claim.** When a tracked claim turns `failed`, show a
   banner on Home and on the claim screen: "Claim failed — 0.5 ETH returned to your available
   balance (reason)". This happens whether or not the snapshot has caught up.
3. **Transparency.** A row with an overlay applied shows "includes your claim of 0.5 ETH · updating".
   The freshness line keeps showing the snapshot's `asOf`.
4. **Totals (D4) stay consistent.** For a pending claim, `available − x` plus `claiming + x` leaves
   the total unchanged. A completed claim the snapshot hasn't seen yet reduces the total, which is
   correct because the money left.
5. **The claim form uses the overlaid available** for validation and Max. That's closer to the
   server's live check than the raw snapshot, and it prevents an immediate second claim of the same
   funds.
6. **Scope.** The overlay covers only claims this browser created (in the tracked store). Claims
   made elsewhere reach us only through snapshots, which is fine.
7. **Safety clamp.** If the computed `available` goes below 0, show 0 and log a dev warning. This
   should never happen.
8. **Ties.** `createdAt == asOf` counts as *already in the snapshot* (strict `>`). The worst case is
   at most one 15 s window that shows B behaviour.
9. **Risk.** C depends on `asOf` and `createdAt` coming from the same server clock. This is
   **verified once** in T6 with a real claim; if it doesn't hold, `applyTrackedClaims` becomes an
   identity function (option B) and NOTES.md says so.

### D3 — Unknown claim outcome (timeout etc.) **[decision: same-key replay, never a new key]**
- One **claim intent** = one Idempotency-Key (`expo-crypto` `randomUUID()`) + one frozen body.
  The key is created when the user taps **Confirm** and persisted (with the body) **before** the
  request is sent.
- Definitive results: 201/200 → created (track it); 400/401/409 → not created (discard intent, show
  why). Everything else (429, 5xx, 504, network error, client timeout, malformed 2xx body) is
  **unknown** → automatically replay the **identical** request with the **same key** up to 3 times
  (backoff 1 s, 2 s, 4 s; 429 waits `retryAfterMs`). This is safe because the API guarantees a
  replay returns the original claim and never creates a second one.
- Still unknown after that → "We couldn't confirm your claim yet" screen and Home banner:
  "Don't submit it again. **Check status**" (re-sends the same key), plus a secondary **Dismiss**
  that warns: "if it went through, it'll show in Activity and Claiming".
- While any intent is unresolved, **new claims are blocked** (the form shows the banner instead).
- After a reload, a stored unresolved intent is **not** replayed silently: the banner asks the user
  to tap Check status. Otherwise a forgotten request could create a claim hours later.
- Assumption to note in NOTES.md: the server keeps idempotency keys at least for the token's
  lifetime (not documented).

### D4 — What "total in USD" means **[decision]**
Headline **Total ≈ $X** = Σ over assets of `(available + pending + claiming) × usdPrice` (all
payback the user owns, so a claim in flight doesn't change the total until it completes). Under it:
**Available to claim ≈ $Y** = Σ `available × usdPrice`. If an asset's price is missing or invalid,
the total shows "excludes BTC (no price)". It's never treated as $0.

### D5 — Data layer **[decision: TanStack Query v5]**
`@tanstack/react-query` for GETs (caching, loading/error/refetch states, retry with custom delay,
polling via `refetchInterval`, `useInfiniteQuery` for activity). The claim POST is **not** a
generic mutation retry — it runs the custom intent logic (D3). Alternative: hand-rolled
`useEffect` hooks — more code and easier to get race conditions wrong.

### D6 — Read retry & polling budget **[decision]**
- GET retry: network/timeout/429/500/503/504 → up to 3 retries; delay = `retryAfterMs` for 429,
  else `min(1000·2^n, 8000)` + jitter. No retry on 400/401/404.
- Balances: refetch on screen focus, on pull-to-refresh, every **30 s** while Home is visible, on
  claim created and on claim reaching a terminal status. No faster.
- Claim status polling: every **3 s** while pending, every 6 s after 30 s, stop at terminal.
  On a poll error keep the last known status and show "couldn't refresh, retrying".
- TanStack Query automatic retries are configured for read queries only. Claim submission must not use generic mutation retries. All claim retries are controlled by the idempotent intent flow and must reuse the exact same idempotency key and frozen request body.

### D7 — Destination selection **[decision]**
Destinations come from claim-options. With exactly one destination, it's preselected. With more
than one, **nothing is preselected** and the user has to pick, because money goes to that place.
The review step shows the destination label.

### D8 — Input leniency **[decision]**
The amount field trims whitespace and turns `,` into `.` (many phone keyboards type a comma). Apart
from that, input is validated strictly with the server rules, and a friendly message shows the
accepted format.

### D9 — Token storage **[decision]**
`@react-native-async-storage/async-storage` (localStorage on web, works natively too). On token
change or forget: `queryClient.clear()` and wipe the per-token claim store. If an unresolved intent
exists, warn first.

---

## 5. Architecture

```
src/
  app/                         # Expo Router routes only
    _layout.tsx                # providers (QueryClient, Token, Claims), Stack, token gate
    token.tsx                  # enter / change / forget token
    index.tsx                  # Home: balances
    claim.tsx                  # claim form + review step (?asset=ETH optional)
    claims/[id].tsx            # claim status tracking
    activity.tsx               # paginated history (optional)
  config/api.ts                # API_BASE_URL (single source), timeouts
  api/
    types.ts                   # transport DTOs (amounts as strings)
    errors.ts                  # ApiError + classifiers
    client.ts                  # fetch wrapper: auth, timeout, JSON, error normalisation, shape checks
    endpoints.ts               # getBalances, getActivity, getClaimOptions, createClaim, getClaim
  lib/money/                   # PURE, no React, no I/O — fully unit tested
    decimal.ts                 # parse/format units
    claim.ts                   # claim amount validation, fee/receive, Max
    usd.ts                     # USD valuation, totals, formatting
    display.ts                 # grouping/truncation for UI
  features/
    token/                     # TokenProvider, storage
    balances/                  # useBalances, BalanceRow, TotalCard, Freshness
    claims/                    # claim store (intents + tracked claims), reconcile.ts, useClaimPolling,
                               # submitClaim (intent machine), form components
    activity/                  # useActivity (infinite, dedupe), ActivityRow
  components/                  # Screen container (max-width 480, centered), Button, ErrorState,
                               # Banner, Skeleton, AmountText
```

---

## 6. Shared contracts (freeze these first so lanes can work in parallel)

```ts
// src/config/api.ts
export const API_BASE_URL = 'https://task-api.cashmine.io';
export const REQUEST_TIMEOUT_MS = 15_000;

// src/api/types.ts — transport shapes, amounts are decimal strings
export interface BalanceItemDto { asset: string; decimals: number; available: string; pending: string; claiming: string; usdPrice: string }
export interface BalancesDto { asOf: string; items: BalanceItemDto[] }
export type ActivityType = 'accrual' | 'reversal' | 'claim';
export interface ActivityItemDto { id: string; type: ActivityType; asset: string; amount: string; status: string; exchange: string | null; createdAt: string; relatedId: string | null }
export interface ActivityPageDto { items: ActivityItemDto[]; nextCursor: string | null }
export interface DestinationDto { id: string; label: string }
export interface ClaimOptionsDto { asset: string; minAmount: string; fee: string; destinations: DestinationDto[] }
export type ClaimStatus = 'pending' | 'completed' | 'failed';
export interface ClaimDto { id: string; asset: string; amount: string; fee: string; receiveAmount: string; destinationId: string; status: ClaimStatus; failureReason: string | null; createdAt: string; updatedAt: string }
export interface CreateClaimBody { asset: string; amount: string; destinationId: string }

// src/api/errors.ts
export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'invalid_response';
export class ApiError extends Error {
  kind: ApiErrorKind; status?: number; code?: string; field?: string; retryAfterMs?: number;
}
export function isRetryableRead(e: unknown): boolean;          // network/timeout/429/5xx
export function isDefinitiveClaimRejection(e: unknown): boolean; // 400/401/409 → claim NOT created
export function isUnauthorized(e: unknown): boolean;

// src/api/endpoints.ts — token passed explicitly; never logged
getBalances(token: string, signal?: AbortSignal): Promise<BalancesDto>;
getActivity(token: string, p: { limit?: number; cursor?: string | null }): Promise<ActivityPageDto>;
getClaimOptions(token: string, asset: string): Promise<ClaimOptionsDto>;
createClaim(token: string, body: CreateClaimBody, idempotencyKey: string): Promise<{ claim: ClaimDto; replayed: boolean }>;
getClaim(token: string, id: string): Promise<ClaimDto>;

// src/lib/money/decimal.ts
export const DECIMAL_RE = /^(0|[1-9]\d*)(\.\d+)?$/;
export type ParseError = 'empty' | 'format' | 'too_many_decimals';
export function normalizeInput(raw: string): string;                     // trim, ',' → '.'
export function parseUnits(s: string, decimals: number):
  { ok: true; units: bigint } | { ok: false; error: ParseError };
export function formatUnits(units: bigint, decimals: number): string;     // canonical; supports negatives

// src/lib/money/claim.ts
export type ClaimAmountError = ParseError | 'below_min' | 'above_available' | 'fee_exceeds_amount';
export function validateClaimAmount(p: { input: string; decimals: number; available: bigint; min: bigint; fee: bigint }):
  { ok: true; amount: bigint; fee: bigint; receive: bigint } | { ok: false; error: ClaimAmountError };
export function maxInput(available: bigint, decimals: number): string;    // = formatUnits(available)

// src/lib/money/usd.ts
export interface UsdValue { units: bigint; scale: number }                // value = units / 10^scale
export function toUsd(amount: bigint, decimals: number, usdPrice: string): UsdValue | null;  // null if price invalid
export function sumUsd(values: UsdValue[]): UsdValue;
export function formatUsd(v: UsdValue): string;                           // "$1,234.57", half-up to cents

// src/features/claims/reconcile.ts
export interface Balance { asset: string; decimals: number; available: bigint; pending: bigint; claiming: bigint; usdPrice: string }
export interface DisplayBalance extends Balance { adjustedBy: ClaimDto[] }  // non-empty → overlay applied
export function applyTrackedClaims(asOf: string, balances: Balance[], claims: ClaimDto[]): DisplayBalance[];
```

Client rules (`client.ts`): set `Authorization` per call; `AbortController` timeout → `kind:'timeout'`;
non-2xx → parse error envelope (fall back to status-only); 429 → `retryAfterMs` from body, else
`Retry-After` header × 1000; validate response shape (required keys, amounts match `DECIMAL_RE`,
signed `-?` allowed only for activity amounts) → `kind:'invalid_response'`. Never include headers or
the token in thrown messages or `console.*`.

---

## 7. Subtasks

Legend: **Lane** = can run in parallel with other lanes once its dependencies are done.
**Owns** = files only this subtask creates or edits, to avoid merge conflicts.

### T0 — Project setup & first deploy (blocking, ~15 min)
- **Owns:** `package.json`, `package-lock.json`, `app.json`, `index.ts`/entry, delete `App.tsx`,
  `src/app/_layout.tsx` (skeleton), `src/app/index.tsx` (placeholder), jest config, `.gitignore`.
- Fetch the SDK 58 docs for Expo Router install/entry and web output, then:
  `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants`
  (follow v58 docs, which may differ), `@tanstack/react-query`,
  `@react-native-async-storage/async-storage`, `expo-crypto`, `jest-expo jest @types/jest`.
- Scripts: `typecheck` (`tsc --noEmit`), `lint` (`expo lint`), `test` (`jest`).
- Web output: SPA-style so `/claims/<id>` deep links survive a reload on the host. Verify the
  required host rewrite and choose the host (EAS Hosting via `npx eas-cli@latest deploy` needs the
  user to log in: `! npx eas-cli@latest login`).
- **Done when:** `npx expo export --platform web` succeeds, placeholder deployed, live URL opens
  on a phone, lint/typecheck/test (empty) pass. **Commit #1.**

### T1 — Money core (Lane B, pure, ~20 min) — after T0 installs jest
- **Owns:** `src/lib/money/**` + `src/lib/money/__tests__/**`.
- Implement the §6 contracts.
  - `parseUnits`: `normalizeInput` is **not** applied inside (UI calls it), so the function mirrors
    the server exactly. Empty → `empty`; regex fail → `format`; fraction length > decimals →
    `too_many_decimals` (counts trailing zeros too, like the server); else
    `int·10^d + frac·10^(d−len)`.
  - `formatUnits`: canonical (strip trailing zeros and dot, `0n → "0"`, negatives prefixed `-`).
  - `validateClaimAmount` order: parse → `amount < min` → `below_min` (includes 0) →
    `amount > available` → `above_available` → `amount ≤ fee` → `fee_exceeds_amount`.
    Returns `receive = amount − fee`.
  - `toUsd`: price parsed via `DECIMAL_RE` at its own scale, `units = amount·priceUnits`,
    `scale = decimals + priceScale`. `sumUsd` rescales to the max scale. `formatUsd` rounds half-up
    to 2 dp and groups with commas.
  - `display.ts`: `formatAmountDisplay(units, decimals, maxFraction = 8)`, which floors and groups.
- **Tests (required by the brief):**
  - parse: `"0.5"`, `"12"`, `"0"`, `"0.0010"` (OK), `""`, `".5"`, `"1."`, `"05"`, `"1e-3"`, `"-1"`,
    `" 1"` (format fails without normalize), `"1,5"` (fails; `normalizeInput` → `"1.5"`), excess
    decimals per asset (BTC 9 dp, USDT 7 dp), ETH 18 dp exact round trip
    `"12.365678901234591676"`, huge integer (`"123456789012345678901234567890"`).
  - format: `1500000n,6 → "1.5"`, `0n → "0"`, `1n,18 → "0.000000000000000001"`, negative.
  - validate: below min, exactly min, exactly available (Max), available + 1 unit, amount = fee,
    zero, available < min (Max invalid).
  - fee/receive: `10 USDT − 1.5 = 8.5`; `0.0005 − 0.00002 = 0.00048 BTC`; ETH with 18 dp.
  - USD: single asset, multi-asset total matching a hand calculation using the §3.2 data,
    rounding at the half-cent, invalid price → `null`, total excludes the null.
- **Done when:** `npm test` green, `tsc` clean. **No React imports in this folder.**

### T2 — API layer (Lane C, ~20 min) — after T0
- **Owns:** `src/config/api.ts`, `src/api/**`.
- Implement §6 contracts and the client rules. `createClaim` returns `replayed` from the
  `Idempotent-Replayed` header (web CORS exposes it).
- Shape checks: hand-written guards (no zod needed). A malformed 2xx on `createClaim` must throw
  `invalid_response`, which the claim flow treats as **unknown** (the claim may exist).
- Optional tiny tests for error classification (`isDefinitiveClaimRejection` on 400/401/409 → true;
  429/500/503/504/network/timeout/invalid → false).
- **Done when:** a throwaway script or test exercises each endpoint shape against fixtures from
  §3.2, `tsc` clean.

### T3 — Token & app shell (Lane A, ~15 min) — after T0
- **Owns:** `src/features/token/**`, `src/app/token.tsx`, `src/app/_layout.tsx`, `src/components/**`.
- `TokenProvider`: `{ status: 'loading' | 'missing' | 'ready', token, setToken, forgetToken }`,
  persisted under key `cashmine.token`.
- Gate in `_layout`: render nothing (or a splash) while loading, redirect to `/token` when missing.
- Token screen: masked text input with a show toggle, trimmed. On Save, verify with
  `GET /v1/balances`: 401 → "Token rejected or expired"; network/5xx → save anyway with a notice
  (Home will retry); success → Home. Has a "Forget token" action.
- **Change token** entry in the Home header. Changing the token clears the query cache and the
  claim store, and warns if an intent is unresolved (D9).
- Global 401 handling: any query or mutation 401 → forget the token's session state and route to
  `/token` with the message "Your token was rejected or expired".
- Shared components: `Screen` (SafeArea, `maxWidth: 480`, centered, 16 px padding), `Button`
  (≥44 px tall, disabled + loading states), `ErrorState` (message + Retry), `Banner`
  (info/warn/error), `Skeleton`.
- **Done when:** first open → token prompt; reload keeps the token; change/forget works; a bad
  token shows an error. Redeploy. **Commit #2.**

### T4 — Balances / Home (after T1, T2, T3; can stub T6's overlay as identity)
- **Owns:** `src/features/balances/**`, `src/app/index.tsx`.
- `useBalances`: query key `['balances']`; maps DTO → `Balance` (bigint) via `parseUnits`. A parse
  failure counts as an `invalid_response` error, not a crash. Then `applyTrackedClaims` (T6).
- Layout (390 px):
  - Header: "Payback", Activity link, Change token.
  - **Total card:** `Total ≈ $X`, `Available to claim ≈ $Y`. If a price is missing: "excludes BTC".
  - **Freshness:** "Updated 12 s ago" from `asOf` (server snapshot time), ticking every second. If
    device time is before `asOf` it shows "just now". Shows "Refreshing…" during a refetch.
    **Stale warning** when the last successful fetch is more than 60 s old or the latest refetch
    failed while old data is still shown: "Couldn't refresh — showing balances from 2 min ago.
    Retry".
  - **In-progress claims** section (from the claim store): one compact card per pending tracked
    claim, linking to `/claims/[id]`, plus the unresolved-intent banner (D3).
  - **Asset rows:** asset, available (prominent, `formatAmountDisplay`), ≈ USD; secondary line
    with Pending X and Claiming Y (only when > 0); an "includes your claim of …" note when
    `adjustedBy` is non-empty; a **Claim** button (disabled if `available < minAmount` is known, or
    if an intent is unresolved).
- States: initial loading → skeleton rows; initial error → `ErrorState` + Retry; empty items →
  "No balances yet"; pull-to-refresh (`RefreshControl`) plus a refresh button for web;
  refetch error with existing data → banner (data stays visible).
- **Done when:** real balances shown; total matches the T1-tested function; every state reachable
  (simulate with a bad token or offline devtools). Redeploy.

### T5 — Claim form & submission (after T1, T2, T3; integrates T6 store)
- **Owns:** `src/app/claim.tsx`, `src/features/claims/form/**`, `src/features/claims/submitClaim.ts`.
- **Step 1 — Form:**
  - Asset picker (segmented, from balances; preselected from `?asset=`).
  - `claim-options` query per asset; while it loads the form is disabled; an error shows Retry.
  - Destination picker (D7).
  - Amount input: `inputMode="decimal"` / `keyboardType="decimal-pad"`, `normalizeInput` then
    `validateClaimAmount` against the **displayed (overlay-adjusted) available**.
  - **Max** fills `maxInput(available)` and goes through the same validation.
  - Live preview: Fee, **You receive**, ≈ USD.
  - Inline error copy per `ClaimAmountError`:
    - `format`: "Enter a number like 0.5"
    - `too_many_decimals`: "ETH allows up to 18 decimal places"
    - `below_min`: "Minimum claim is 0.01 ETH"
    - `above_available`: "You have 12.3656… ETH available"
    - `fee_exceeds_amount`: "Amount must be more than the 0.0012 ETH fee"
  - If `available < min`: show "You need at least 0.01 ETH to claim" and hide Max.
- **Step 2 — Review** (same screen, local state): Asset, Amount, Fee, You receive, Destination
  label. **Refetch claim-options on entering review**; if the fee or min changed, update and say
  so. Buttons: Back / **Confirm claim**.
- **Submit (D3 intent machine):** create the intent (key + frozen body), persist it, POST.
  Double-tap guard uses a ref, not just state. Show "Submitting…" with buttons disabled.
  - 201/200 → put the claim into the tracked store, resolve the intent, invalidate `['balances']`,
    `router.replace('/claims/'+id)`.
  - 400 VALIDATION → back to the form with the server message on the field. If the message is
    about available balance, refetch balances. Discard the intent.
  - 401 → token flow. 409 → generic error and discard the intent (log a dev warning without the
    body).
  - Unknown → auto-replay with the same key (up to 3 times), then the "couldn't confirm" state
    (D3) with Check status / Dismiss.
- The body sent is **canonical** `formatUnits(amount)`, not the raw input.
- **Done when:** the happy path creates exactly one claim; forcing a timeout (devtools offline
  after tap, or a throttled network) followed by Check status returns the original claim
  (`replayed: true`) and never a second one.

### T6 — Claim tracking & reconciliation (after T1, T2; Lane B can start the pure part early)
- **Owns:** `src/features/claims/store.ts`, `reconcile.ts` (+tests), `useClaimPolling.ts`,
  `src/app/claims/[id].tsx`.
- **Store:** persisted per token (`cashmine.claims.v1`):
  `{ intents: ClaimIntent[], tracked: ClaimDto[] }`, where
  `ClaimIntent = { key, body, createdAt, state: 'sending' | 'unknown', lastError? }`.
  Prune tracked claims that are terminal and older than the current snapshot's `asOf`; keep the
  last ~10 for "recent claims".
  Use React context + `useSyncExternalStore`, or a reducer with write-through to AsyncStorage.
- **reconcile.ts:** implements D2 option C exactly as specified (rules 1–9), compares
  `Date.parse(c.createdAt) > Date.parse(asOf)`, and clamps displayed available at 0 (flagging an
  invariant breach if it happens).
  - Tests:
    - claim before `asOf` → unchanged
    - `createdAt == asOf` → unchanged
    - after `asOf`, pending → available −, claiming +, total unchanged
    - completed → available − only
    - failed → unchanged
    - different asset → unchanged
    - two claims on the same asset add up
    - overdraw → clamped to 0
- **Polling:** `useQuery(['claim', id], getClaim, { refetchInterval: pending ? (age < 30 s ?
  3000 : 6000) : false })`. Each result updates the tracked store. On a transition to
  completed/failed it invalidates balances.
- **Status screen `/claims/[id]`:**
  - Status pill: Pending ("Processing — usually under 20 s"), Completed, Failed + `failureReason`
    + "0.5 ETH returned to your available balance".
  - Amount, fee, **received / to receive** (server `receiveAmount`), destination label,
    created/updated times, claim id.
  - Pending for more than 60 s → "Taking longer than usual" (keep polling).
  - A poll error shows the last known status + "Couldn't refresh status" + Retry.
  - Unknown id → 404 state.
  - Buttons: Back to balances, View activity.
- **Verification (one real claim, minimum USDT 10):** after the 201, record `createdAt`; poll
  balances until `asOf > createdAt`; confirm `claiming` rose and `available` fell by exactly the
  amount. Write the result in NOTES.md. If it fails, switch reconcile to option B.
- **Done when:** a claim is followed to a terminal state, Home never shows a drop followed by an
  unexplained rise, and the tests pass. **Commit #3**, redeploy.

### T7 — Activity (optional, only if T4–T6 are solid by ~08:35)
- **Owns:** `src/features/activity/**`, `src/app/activity.tsx`.
- `useInfiniteQuery(['activity'], …, { getNextPageParam: p => p.nextCursor ?? undefined })`,
  `limit=20`. Flatten the pages and **dedupe by id while keeping order** (§3.5-1).
- Row: type icon/label (Payback / Reversal / Claim), asset, signed amount as returned
  (green +, red −; a failed claim is struck through and labelled "Failed — not deducted"),
  status chip, exchange, local date/time.
  - Reversal: "Reverses an earlier payback".
  - A claim with `relatedId` links to `/claims/[relatedId]`.
- `FlatList` with `onEndReached` plus a "Load more" button (web). Footer states: loading, error +
  Retry (failed page only), "That's everything". Pull-to-refresh resets to page 1. Empty state.
- **Done when:** scrolling to the end shows 27 unique items for this token (no duplicate keys).

### T8 — Docs, AI logs, delivery (last ~15 min, never skip)
- `NOTES.md` (~1 page):
  - **Decisions:** D1–D3 plus D4–D9 in brief, with alternatives and reasons.
  - **Working with AI:** 3 moments with pointers into `ai-logs/`.
  - **Not done / known issues.**
  - Also list the assumptions from §9.
- `README.md`: live link, `npm install && npx expo start --web`, `npm test`, what works.
- `ai-logs/`: export the conversations (see §11 for the index and the export method).
  - **Redact the token everywhere.** It's in the pasted email and in the investigation commands of
    this session.
  - Grep the whole repo and `dist/` for `ct1.` and `eyJjaWQi` before every commit.
- Final `npx expo export --platform web`, deploy, open the link on a phone, push.
  **Everything done by 08:58.**

---

## 8. Execution plan

```
07:35 ─ T0 setup + placeholder deploy ───────────────┐ (commit #1 ~07:50)
07:50 ─┬─ Lane A: T3 token & shell ─┬─ T4 Home ───────┤ (commit #2 ~08:15, redeploy)
       ├─ Lane B: T1 money + tests ─┴─ T6 reconcile/store/status
       └─ Lane C: T2 API layer ──────── T5 claim form/submit
08:35 ─ integration pass: real claim verification (T6), fix, redeploy (commit #3)
08:35 ─ T7 only if green; otherwise skip and note it in NOTES.md
08:45 ─ T8 docs + ai-logs + final deploy; hard stop 08:58
```
Cut order if late: T7 → stale banner polish → "recent claims" list → review-step options refetch.
**Never cut:** bigint math, D3 same-key replay, double-tap guard, tests, token redaction.

---

## 9. Assumptions (copy to NOTES.md)
1. `asOf` and claim `createdAt` come from the same server clock and are comparable (verified in T6).
2. Idempotency keys stay valid for at least the token lifetime.
3. 500/503 on POST may or may not have created the claim, so they're treated as unknown (safe
   because replay is idempotent).
4. Total USD includes pending and claiming. "Available to claim" is shown separately.
5. The rate limit (~25–30 req/min) is inferred from observation and isn't documented.
6. Activity amounts are displayed exactly as returned; no arithmetic is done on them.
7. The fee shown in the preview comes from claim-options; the claim response is authoritative if it
   differs.

## 10. Verification before "done"
`npm run lint && npm run typecheck && npm test && npx expo export --platform web`. Grep for the
token. Test on the live link at 390 px:
token entry → Home → Claim (Max, invalid inputs, review) → status reaches terminal → Home
reconciled → Activity.

## 11. AI logs: index & method

**Method.**
- Claude Code sessions are exported from the raw transcript
  (`~/.claude/projects/-Users-viktor-Documents-projects-cashmine-task/<session>.jsonl`) to markdown
  by a small script kept outside the repo.
- The export redacts the token, the token's parts, the client id decoded from it, and the account
  email.
- It omits injected system and skill text (replaced by a one-line marker) and empty hidden-thinking
  blocks. Nothing else is edited.
- After each export, grep the repo for the token pieces; the count must be 0.

| File | Covers |
|---|---|
| `01-api-investigation-spec-and-balance-decision.md` | API investigation, task split, this spec, the **balance-after-claim A/B/C discussion** and the user's choice of C |
| `02-…` (next) | implementation sessions: export each one, or each lane's subagent, the same way |

**Candidate "Working with AI" moments for NOTES.md** (all in log 01; confirm or replace with later
ones):
- *AI output wrong, and how it was caught:* the AI's first claim-validation probe sent no
  `Idempotency-Key`. It built the header in a shell variable that zsh doesn't split. All 12
  responses returned the same "Idempotency-Key header is required" error, which exposed it, and the
  probe was re-run with an explicit header.
- *Docs vs reality:* the docs never mention that activity pages overlap. The AI found the duplicate
  item only by walking the pages live, and that's why the spec requires dedupe by id.
- *Disagreement / rejected suggestion:* the AI recommended C, but A ("just subtract on tap") is the
  common default and was explicitly rejected; see D2 for why. (If you push back on any AI
  suggestion during the build, prefer that as the stronger example.)
