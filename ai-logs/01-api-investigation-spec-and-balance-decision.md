# AI log 01 — API investigation, task split/spec, balance-after-claim decision

Tool: Claude Code (model: claude-opus-5-5). Exported from the raw session transcript (`~/.claude/projects/.../<session>.jsonl`) with a script. Unedited except: the API token, the client id decoded from it and the account email are replaced with `<REDACTED_…>` markers; injected system/skill text is replaced by a one-line marker; empty (hidden) thinking blocks are omitted.

## 🧑 User — 2026-10-23 07:24:55 UTC

were developing this test task. please investigate the api, split the task for multiple subtasks separeted by logic or domain and write detailed spec. 

<pasted_content id="ffe9">
Hi Viktor Kanchalaba,

As scheduled, here is your practical task. You have 2 hours from the time this email was sent (2026-10-23 07:00 to 09:00 UTC).

1. Context

CashMine pays users back part of the trading fees they pay on crypto exchanges. We call this payback. It is live on web, and the iOS/Android app is next. In this task you build a slice of that app: seeing payback balances and claiming them. The money is real for our users, so correctness matters more than polish.

You build it with React Native (Expo) and ship the web build, so that we can open it on a phone from a link.

2. Setup

Create a new Expo app with TypeScript (for example npx create-expo-app@latest). Use any libraries you like, as long as they work on web.
Run it in the browser (npx expo start --web) and design for a phone screen, about 390 px wide. We will open your link on a phone. It does not need to run on iOS or Android.
We host a test API for this task. Its documentation: https://task-api.cashmine.io/docs
Your personal token: <TOKEN>
It is valid for 24 hours, until 2026-10-24 07:00 UTC. All data is fake and private to your token.
Treat the API as a real remote server that you call but cannot change.
Do not put the token in your code, your repository or your deployed build. On first open, the app asks for the token (a text field is enough), keeps it in the browser and offers a way to change it. We will open your link with our own tokens.
Keep the API base URL in one place in your code.
If the API is unavailable during your slot, say so in your submission email and we will offer you a new slot.

3. What to build

The items are in priority order. Doing fewer things correctly is better than doing everything halfway.

Balances (Home). Show each asset's balances, the total in USD, and how fresh the data is. Include loading, error/retry and refresh states.
Claim. The user picks an asset and enters an amount or taps Max. They see the fee and the amount they will receive, then confirm and submit. Afterwards they can follow the claim until it completes or fails. Validate input against the rules in the API documentation.
Tests. Write a few unit tests for your amount logic: parsing, validation, fee and totals.
Activity (if time allows). Show a paginated history of accruals, reversals and claims.
4. Decisions we leave to you

Each of these has more than one reasonable answer. Pick one and tell us why.

How you represent and calculate amounts.
What the balance shows right after a claim is submitted. Two pieces of user feedback pull in opposite directions. One user said: "I claimed and my balance didn't change, so I claimed again." Another said: "My balance dropped, then jumped back up, and I stopped trusting the app."
What the user sees, and what the app does, when the result of a claim request is unknown, for example after a timeout.
5. AI tools

Use any AI tools you like: chat, IDE assistants or coding agents. AI may write code. We expect you to use these tools, and we care about how you work with them, not whether you do.

Keep your AI conversations and put them in ai-logs/ in your repository. You can export them, add share links or copy-paste them. If your tool cannot export, screenshots are fine. Do not tidy them up, because messy prompts are normal. The repository is public, so remove anything private, including your token.
For the balance-after-claim decision, ask your AI for at least two approaches before you choose. We want to see that conversation.
Commit at least every 30 minutes and do not squash your commits. Your history is part of the submission.
6. Notes

Add a NOTES.md of about one page with three sections:

Decisions. Cover the three decisions above and any others that matter: what you chose, what the alternatives were, and why.
Working with AI. Describe three moments and point to where each one is in ai-logs/:
a prompt that did not get you what you wanted, and how you changed it
a time AI output was wrong or risky, and how you found out
a time you disagreed with the AI or rejected a suggestion, and why
Not done / known issues. Say what is missing or wrong and what you would do next.
README.md only needs the live link, how to run the app locally and what works.

7. Submission

Before 2026-10-23 09:00 UTC, reply to this email with:

the link to a public GitHub repository with your full commit history
the live link to your deployed web build. Any static host works, for example EAS Hosting, Vercel, Netlify or Cloudflare Pages. npx expo export --platform web builds it.
roughly how long you spent
Deploy early, for example once the first screen works, so that hosting problems do not eat your last minutes. Do not push or redeploy after 2026-10-23 09:00 UTC.

8. What we look at

Whether money handling and the claim flow are correct
Your decisions and how you explain them
How you work with AI: the context you give it, how you check its output, and where you push back
Your React Native implementation and UX states on a phone screen
How clear your notes are
In the next interview we will walk through your code together. You will also make a small change live, using your AI tool, while sharing your screen. Please be ready to explain any line you submitted.

We do not answer questions during the task. If something is unclear, make a reasonable assumption, write it in NOTES.md and keep going.

Good luck,
Ivan
CashMine
</pasted_content id="ffe9">


**🔧 Skill**

`````json
{
  "skill": "superpowers:brainstorming"
}
`````

<details><summary>result (Skill)</summary>

`````text
Launching skill: superpowers:brainstorming
`````

</details>

> _[2026-10-23 07:25:05] injected context omitted: Base directory for this skill: /Users/viktor/.claude/plugins/cache/claude-plugins-official/superpowers/7.0.0/skills/brai…_

## 🤖 Claude — 2026-10-23 07:25:16 UTC

I'll investigate the API (read-only — no claims submitted), then write the spec. Starting with the docs and the current repo state in parallel.

**🔧 Bash** — _Fetch API docs page and inspect repo_

`````bash
curl -sS -i https://task-api.cashmine.io/docs | head -c 4000; echo; echo ----; ls -la; cat package.json; git log --oneline | head
`````

<details><summary>result (Bash)</summary>

`````text
HTTP/2 200 
date: Fri, 23 Oct 2026 07:25:19 GMT
content-type: text/plain; charset=utf-8
content-length: 4947
access-control-allow-origin: *
access-control-allow-headers: Authorization, Content-Type, Idempotency-Key
access-control-allow-methods: GET, POST, OPTIONS
access-control-expose-headers: Retry-After, Idempotent-Replayed
access-control-max-age: 86400
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=R%2BAOdUQoujt%2FKcvdVfMgDlOGEUPfGm8SagtqbHHspY3%2BYjhvsd5i7I3kxC8ZRkePOgXM6oBHALgTxhqu0D130nRZuFy%2BaMQwb6%2FTxQMfcYNJpiol17Csy7UIlxDLO3OJLHWkzSXtIc43mduPVvMAcKJKuQ%3D%3D"}]}
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
server: cloudflare
cf-ray: a4ef01d178c2fd58-LCA
alt-svc: h3=":443"; ma=86400

CashMine practical task API
===========================

A test backend for the CashMine React Native practical task. All data is made up and nothing here
moves real money. Treat it like a real remote server: requests can be slow, and any request can fail.

Base URL: https://task-api.cashmine.io

Authentication
--------------

Send your token from the task email on every /v1 request:

    Authorization: Bearer <token>

Your data belongs to your token only. It starts fresh with your first request and includes about
30 days of history. The token stops working at the time given in your task email.

Conventions
-----------

- JSON in and out. Times are ISO 8601 strings in UTC.
- Amounts are decimal strings in the asset's own unit, for example "0.0005" (BTC). They are never
  JSON numbers. Each asset allows at most `decimals` decimal places. Write them as digits with an
  optional dot and more digits, and no leading zeros: "0.5" and "12" are fine; ".5", "1.", "05"
  and "1e-3" are not.
- CORS is open to any origin, so you can call the API from a web app.

Errors
------

    { "error": { "code": "VALIDATION", "message": "...", "field": "amount" } }

    HTTP  code                  meaning
    400   VALIDATION            the request is invalid; `field` names the field when there is one
    401   UNAUTHORIZED          token missing, invalid or expired
    404   NOT_FOUND             unknown endpoint or id
    409   IDEMPOTENCY_MISMATCH  an Idempotency-Key was reused with a different body
    429   RATE_LIMITED          too many requests; wait `retryAfterMs` (also the Retry-After header, in seconds)
    500   SERVER                temporary server error
    503   SERVER                temporary server error
    504   TIMEOUT               the server did not finish in time; the outcome is unknown

A 429 response looks like this:

    { "error": { "code": "RATE_LIMITED", "message": "Too many requests", "retryAfterMs": 2300 } }

Rate limits apply per token.

GET /v1/balances
----------------

    {
      "asOf": "2026-10-20T08:01:15.000Z",
      "items": [
        { "asset": "USDT", "decimals": 6, "available": "820.413207", "pending": "50.12",
          "claiming": "0", "usdPrice": "1.0002" }
      ]
    }

- available: can be claimed now
- pending: payback accrued but not yet confirmed; it becomes available once confirmed
- claiming: the amount in claims that have not completed yet
- usdPrice: the price of one unit in USD

Balances are snapshots, recomputed every 15 seconds. `asOf` is the time of the snapshot, so a claim
you just created may not show up until the next one.

GET /v1/activity?limit=20&cursor=...
------------------------------------

History, newest first. `limit` is 1 to 20 (default 20). Pass `nextCursor` as `cursor` to get the
next page; `nextCursor` is null on the last page.

    {
      "items": [
        { "id": "act_...", "type": "accrual", "asset": "USDT", "amount": "9.81", "status": "confirmed",
          "exchange": "Binance", "createdAt": "...", "relatedId": null }
      ],
      "nextCursor": "..."
    }

- type: accrual (payback earned on an exchange), reversal (an earlier accrual taken back by the
  exchange; relatedId is th
----
total 568
drwxr-xr-x@  18 viktor  staff     576 23 Oct 10:22 .
drwxr-xr-x@  26 viktor  staff     832 23 Oct 10:19 ..
drwxr-xr-x@   3 viktor  staff      96 23 Oct 10:17 .claude
drwxr-xr-x@  12 viktor  staff     384 23 Oct 10:22 .git
-rw-r--r--@   1 viktor  staff     440 23 Oct 10:17 .gitignore
drwxr-xr-x@   4 viktor  staff     128 23 Oct 10:21 .idea
-rw-r--r--@   1 viktor  staff    2598 23 Oct 10:17 AGENTS.md
drwxr-xr-x@   3 viktor  staff      96 23 Oct 10:18 ai-logs
-rw-r--r--@   1 viktor  staff     648 23 Oct 10:17 app.json
-rw-r--r--@   1 viktor  staff     455 23 Oct 10:17 App.tsx
drwxr-xr-x@   8 viktor  staff     256 23 Oct 10:17 assets
-rw-r--r--@   1 viktor  staff   13072 23 Oct 10:17 CLAUDE.md
-rw-r--r--@   1 viktor  staff     307 23 Oct 10:17 index.ts
-rw-r--r--@   1 viktor  staff    1106 23 Oct 10:17 LICENSE
drwxr-xr-x@ 299 viktor  staff    9568 23 Oct 10:18 node_modules
-rw-r--r--@   1 viktor  staff  239701 23 Oct 10:18 package-lock.json
-rw-r--r--@   1 viktor  staff     562 23 Oct 10:18 package.json
-rw-r--r--@   1 viktor  staff      85 23 Oct 10:17 tsconfig.json
{
  "name": "cashmine-task",
  "version": "1.0.0",
  "main": "index.ts",
  "dependencies": {
    "@expo/metro-runtime": "~58.0.15",
    "expo": "~58.0.17",
    "expo-status-bar": "~58.0.4",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-native": "0.88.0",
    "react-native-web": "^0.21.4"
  },
  "devDependencies": {
    "@types/react": "~19.3.0",
    "typescript": "~6.0.3"
  },
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "private": true
}
7366afd chore: scaffold Expo web app
1292e9f Initial commit
`````

</details>

**🔧 Bash** — _Read rest of API docs and project config files_

`````bash
curl -sS https://task-api.cashmine.io/docs | tail -c +3900; echo; echo ----CLAUDE.md; cat CLAUDE.md; echo ----; cat app.json App.tsx index.ts tsconfig.json .gitignore; ls ai-logs .claude
`````

<details><summary>result (Bash)</summary>

`````text
ks>

Body:

    { "asset": "ETH", "amount": "0.5", "destinationId": "dest_wallet" }

Rules: minAmount <= amount <= available, and at most `decimals` decimal places. `available` is
checked live, not against the last snapshot.

201 returns a claim. Its amount leaves `available` at once and is counted in `claiming` until the
claim settles.

Repeating a request with the same Idempotency-Key and the same body returns the original claim
(200, header `Idempotent-Replayed: true`) and never creates a second claim, even if the first
response was lost. The same key with a different body returns 409.

Claim:

    { "id": "clm_...", "asset": "ETH", "amount": "0.5", "fee": "0.0012", "receiveAmount": "0.4988",
      "destinationId": "dest_wallet", "status": "pending", "failureReason": null,
      "createdAt": "...", "updatedAt": "..." }

GET /v1/claims/{id}
-------------------

Returns the claim. A pending claim settles within about 20 seconds, to completed or failed. When a
claim fails, its amount returns to available and failureReason says why.

----CLAUDE.md
# CLAUDE.md

This file provides guidance to Claude Code when working on the CashMine practical assessment.

## Assessment objective

Build a reliable, mobile-first CashMine payback app using Expo + React Native + TypeScript, targeting the web. Correctness of financial calculations and claim handling takes priority over visual polish or feature count.

The task requirements are authoritative. When this file and the assessment brief conflict, follow the assessment brief.

## Hard rules

- **Never write, edit, or delete files outside this project directory.** Do not modify system files, dotfiles, shell configs, LaunchAgents, or global packages. If a fix requires touching something outside the repository, provide the exact command and ask the user to run it.
- Do not run commands that start the Expo/Metro dev server unless the user explicitly asks you to. The user may start it in their own terminal. You may run build, lint, typecheck, and test commands that terminate normally.
- Never hardcode, commit, log, screenshot, or include the assessment API token in source code, repository files, AI logs, source maps, or deployed assets. The app must ask each user to enter their own token.
- Never commit `.env` files, credentials, access tokens, or other secrets. Check `git status` and staged changes before every commit.
- Do not fabricate API endpoints, request fields, response fields, claim states, fee rules, asset precision, or successful responses. Inspect the official API documentation and actual responses.
- Do not automatically retry a claim request if its outcome may be unknown, unless the API explicitly documents safe idempotency support.
- Do not claim that a feature, test, deployment, or URL has been verified unless it actually has been.
- Keep the required AI conversation records in `ai-logs/`. Do not fabricate conversations, mistakes, or review steps.
- Commit meaningful progress at least every 30 minutes. Do not squash commits.

## Assessment constraints and priorities

Target: mobile viewport around 390 px wide; web only. Native iOS/Android execution is not required.

Required order:

1. Token entry/persistence and API configuration.
2. Home balances: per-asset balances, USD total, data freshness, loading/error/retry/refresh.
3. Claim flow: asset selection, amount input/Max, validation, fee/net preview, confirmation, submission, and status tracking.
4. Unit tests for amount parsing, validation, fee calculations, and totals.
5. Activity history with pagination, only if the higher-priority work is reliable and time remains.

Deploy an early working build. Do not let optional features or visual polish jeopardize the submission deadline.

## Commands

Inspect `package.json` and use the package manager already configured in the repository. Do not replace the lockfile or migrate package managers without a compelling reason.

Typical commands (adapt to the actual project scripts):

```bash
# Install dependencies using the repository's package manager
npm install

# Type checking / linting / tests, if configured
npm run typecheck
npm run lint
npm test

# Build the Expo web export
npx expo export --platform web
```

Do not assume scripts exist before checking `package.json`. Fix relevant failures introduced by your changes; document unrelated pre-existing failures.

To run the development server, the user can run:

```bash
npx expo start --web
```

## API and token handling

- API documentation: https://task-api.cashmine.io/docs
- Keep the API base URL in one central configuration location.
- Inspect the documentation before implementing API calls. Confirm the authentication header, endpoint paths, schemas, validation constraints, fee semantics, claim lifecycle, and pagination behavior.
- Use a dedicated API client module for request construction, authentication, response parsing, and error normalization.
- Ask for the token on first open. Provide a clear way to replace it.
- Persist the token in browser storage suitable for this assessment, and never print it to logs or expose it in error messages.
- Do not assume a server-side secret is available in a static web build. The user's token is entered at runtime and attached only to requests that require it.
- Treat the API as an external service that cannot be changed. Do not silently fall back to mock data when requests fail.
- Handle non-2xx responses, malformed responses, network errors, and unexpected payloads explicitly.
- Avoid logging full request headers or request configuration objects that may contain the token.

## Architecture and code organization

Keep the solution small and easy to explain in a live code walkthrough. Prefer a simple structure such as:

```text
src/
  api/           # API client, endpoint functions, API types
  components/    # Reusable UI components
  features/
    balances/    # Balance screen and related UI/state
    claims/      # Claim flow and status handling
    activity/    # Optional paginated activity
  lib/           # Pure money, validation, and formatting utilities
  config/        # API base URL and safe app configuration
  types/         # Shared domain types, when needed
```

Adapt this to the generated Expo project's conventions rather than restructuring unnecessarily.

- Keep money calculations and validation in pure functions where practical.
- Keep API transport types distinct from UI/domain types when mapping is useful.
- Use TypeScript types for API responses and application state. Avoid `any` unless there is a specific, justified reason.
- Use the simplest state model that safely handles asynchronous operations. Do not add Redux or another state library unless the implementation genuinely needs it.
- Keep components focused and reasonably small.
- Avoid unnecessary dependencies and premature abstractions.
- Ensure the app works on Expo Web; verify any added library's web compatibility.
- Design for a narrow phone viewport and prevent horizontal overflow.

## Financial correctness

Money handling is the highest-risk part of this assessment.

- Never use JavaScript floating-point arithmetic for authoritative token amounts or fee calculations.
- Inspect the API contract to determine each asset's precision and the units used in requests and responses.
- Use integer base units or a suitable decimal arithmetic library. Do not convert large or precise monetary values through `Number` unless the API's range and precision make that demonstrably safe.
- Parse user-entered decimal strings explicitly. Reject malformed input, unsupported notation, zero/negative values, excess decimal places, and values outside the documented limits.
- Validate minimums, maximums, available balance, asset eligibility, and fee rules according to the API documentation.
- Do not sum crypto quantities across different assets.
- Calculate USD totals only from documented USD valuation fields or valid conversion data. If required valuation data is missing, do not silently treat it as zero or present a misleading total.
- Make rounding rules explicit and consistent with the API.
- Clearly distinguish estimated fees/net amounts from server-confirmed values.
- Never treat an HTTP success code alone as proof that a claim completed. Use the response body and documented claim lifecycle.
- Prevent repeated taps from triggering duplicate submissions while a request is in flight.

## Claim lifecycle and consistency

Before choosing the displayed balance behavior after submission, evaluate at least two approaches and preserve the real AI discussion in `ai-logs/`.

Consider:
- Optimistically subtracting the claim amount.
- Keeping the last server-confirmed balance and showing the claim as pending, with clear feedback and protection against duplicate claims.

Choose based on documented server semantics, user trust, failed claims, concurrent requests, and the risk of stale data. Explain the trade-off in `NOTES.md`.

For unknown outcomes, such as a timeout after the server may have accepted a request:

- A timeout does not prove failure.
- Do not automatically retry a potentially non-idempotent claim.
- If a claim ID is available, retrieve its status using the documented endpoint.
- If no claim ID is available, use only a recovery mechanism supported by the API.
- Use an idempotency key only if explicitly supported by the API.
- Show a clear pending/unknown state and a safe recovery action when the outcome cannot immediately be resolved.
- Do not tell users to submit the same claim again while its outcome remains uncertain.
- Document any recovery limitations imposed by the API.

Use only documented status values and terminal states. Do not invent lifecycle states that contradict the server contract.

## UI states and mobile UX

The Home screen should show each asset's relevant balance fields, the USD total when it can be calculated reliably, and the freshness of the data where supported.

Handle:
- Initial loading.
- Empty data.
- API/network errors and retry.
- Manual refresh.
- Missing or stale valuation data.
- Claim form validation.
- Claim submission in progress.
- Confirmed claim status, failure, pending status, and unknown outcome.

Use clear labels and concise financial copy. Keep balances, amounts, fees, and net proceeds easy to scan. The Max action must use the correct available amount and still pass the same validation as manually entered amounts.

## Testing and verification

Add focused unit tests for:
- Decimal amount parsing.
- Valid and invalid claim amounts.
- Precision and boundary conditions.
- Fee and net amount calculations.
- USD totals across multiple assets.
- Rounding behavior and missing valuation data where relevant.

Tests must exercise the actual pure functions, not merely verify that components render. Include very small values, large values, excess precision, malformed input, and unavailable valuation data.

Run the relevant tests and web export after meaningful changes. If time permits, also verify the main flow in a browser at a narrow viewport. Do not rely only on static inspection.

## AI logs

The assessment requires the actual AI conversations to be saved in `ai-logs/`.

Preserve genuine records for:
1. The discussion of at least two balance-after-claim approaches.
2. A prompt that did not produce the desired result and how it was improved.
3. A risky or incorrect AI suggestion and how it was detected.
4. A suggestion that was rejected and the reason.

Use export files, share links, copied transcripts, or screenshots as appropriate. Remove secrets and personal data before saving. Do not tidy the logs to make the process look artificially perfect, and do not invent events that did not occur.

## Git and delivery

- Commit at least every 30 minutes and do not squash commits.
- Use meaningful commits that reflect actual milestones.
- Before each commit, inspect the staged diff and verify that no token, credential, generated secret, or unrelated file is included.
- Do not commit build artifacts unless the project or host specifically requires them.
- Deploy early once the first screen works, then redeploy after important improvements while time remains.
- Do not push or redeploy after the assessment deadline.
- Verify the public repository and live URL before reporting them.

## Required documentation

Create `NOTES.md` (approximately one page) with these sections:

### Decisions
Explain the amount representation/calculation strategy, balance behavior after a claim is submitted, unknown claim outcome handling, alternatives considered, and the reasoning behind the choices.

### Working with AI
Describe three genuine examples and point to the exact files in `ai-logs/`: an ineffective prompt and its revision, an incorrect/risky suggestion and how it was checked, and a disagreement/rejected suggestion with the reason.

### Not done / known issues
List missing features, known bugs, API limitations, and the next steps you would take.

Create `README.md` containing:
- The verified live deployment URL.
- Local setup and run instructions.
- Web build instructions.
- What works.
- Known limitations.

Never include the assessment token in documentation or example commands.

## Final checklist

Before finishing, verify and report honestly:

- [ ] Expo web export succeeds.
- [ ] Token entry, persistence, and replacement work.
- [ ] Token is not hardcoded, committed, logged, or included in deployed assets.
- [ ] Balances come from the real API.
- [ ] USD totals and freshness indicators follow the documented contract.
- [ ] Loading, error, retry, and refresh states work.
- [ ] Claim validation, fee/net preview, submission, and status tracking work.
- [ ] Unknown outcomes are handled without unsafe automatic retries.
- [ ] Financial unit tests pass.
- [ ] Public repository and deployed URL are verified.
- [ ] `README.md`, `NOTES.md`, and `ai-logs/` are present.
- [ ] Commit history contains meaningful milestones.

At the end, provide a concise report of implemented features, commands/tests actually run, unresolved issues, deployment status, and verified URLs.
----
{
  "expo": {
    "name": "cashmine-task",
    "slug": "cashmine-task",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
# Learn more https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files

# dependencies
node_modules/

# Expo
.expo/
dist/
web-build/
expo-env.d.ts

# Native
.kotlin/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env*.local

# typescript
*.tsbuildinfo

# generated native folders
/ios
/android
.claude:
settings.json

ai-logs:
`````

</details>

**🔧 Bash** — _Print middle section of API docs_

`````bash
curl -sS https://task-api.cashmine.io/docs | sed -n '/GET \/v1\/activity/,/Body:/p'
`````

<details><summary>result (Bash)</summary>

`````text
GET /v1/activity?limit=20&cursor=...
------------------------------------

History, newest first. `limit` is 1 to 20 (default 20). Pass `nextCursor` as `cursor` to get the
next page; `nextCursor` is null on the last page.

    {
      "items": [
        { "id": "act_...", "type": "accrual", "asset": "USDT", "amount": "9.81", "status": "confirmed",
          "exchange": "Binance", "createdAt": "...", "relatedId": null }
      ],
      "nextCursor": "..."
    }

- type: accrual (payback earned on an exchange), reversal (an earlier accrual taken back by the
  exchange; relatedId is that accrual's id) or claim (relatedId is the claim id for claims you
  create; null for older claims)
- exchange: where the payback came from; null for claims
- amount: signed; negative for reversals and claims
- status: accrual pending | confirmed; reversal confirmed; claim pending | completed | failed

GET /v1/claim-options?asset=ETH
-------------------------------

    { "asset": "ETH", "minAmount": "0.01", "fee": "0.0012",
      "destinations": [ { "id": "dest_wallet", "label": "Wallet 0x8f3e…a91c" } ] }

The fee is taken from the claimed amount: the user receives amount minus fee.

POST /v1/claims
---------------

Headers:

    Idempotency-Key: <1 to 100 characters, required; a UUID works>

Body:
`````

</details>

## 🤖 Claude — 2026-10-23 07:25:33 UTC

Docs read. Now probing the live endpoints read-only (token kept in a scratchpad file outside the repo, never written to the project).

**🔧 Bash** — _Set up scratchpad API helper and fetch balances_

`````bash
S=/private/tmp/claude-501/-Users-viktor-Documents-projects-cashmine-task/030c4e6a-119d-45af-b77d-c8093fb57417/scratchpad; mkdir -p $S; printf '%s' '<TOKEN>' > $S/token; chmod 600 $S/token
cat > $S/api.sh <<'EOF'
#!/bin/bash
# usage: api.sh METHOD PATH [curl args...]
S=$(dirname "$0"); M=$1; P=$2; shift 2
curl -sS -X "$M" -w '\n[HTTP %{http_code} | %{time_total}s]\n' -H "Authorization: Bearer $(cat $S/token)" "https://task-api.cashmine.io$P" "$@"
EOF
chmod +x $S/api.sh
echo "token payload:"; cut -d. -f2 $S/token | base64 -d 2>/dev/null; echo
$S/api.sh GET /v1/balances | python3 -m json.tool 2>/dev/null || $S/api.sh GET /v1/balances
`````

<details><summary>result (Bash)</summary>

`````text
token payload:
{"cid":"<REDACTED_CID>","nbf":1792738200,"exp":1792825200,"chaos":"normal
{"asOf":"2026-10-23T07:25:31.261Z","items":[{"asset":"USDT","decimals":6,"available":"870.533207","pending":"4.75","claiming":"0","usdPrice":"1.0002"},{"asset":"BTC","decimals":8,"available":"0.01246567","pending":"0","claiming":"0","usdPrice":"67312.45"},{"asset":"ETH","decimals":18,"available":"12.365678901234591676","pending":"0","claiming":"0","usdPrice":"2461.08"}]}
[HTTP 200 | 0.435408s]
`````

</details>

## 🤖 Claude — 2026-10-23 07:25:43 UTC

ETH has 18 decimals (`12.365678901234591676`) — that alone rules out JS `number` for amounts. Continuing with claim options, activity, and error shapes.

**🔧 Bash** — _Fetch claim options per asset and edge cases_

`````bash
S=/private/tmp/claude-501/-Users-viktor-Documents-projects-cashmine-task/030c4e6a-119d-45af-b77d-c8093fb57417/scratchpad
for a in USDT BTC ETH; do echo "== claim-options $a"; $S/api.sh GET "/v1/claim-options?asset=$a"; done
echo "== claim-options unknown asset"; $S/api.sh GET "/v1/claim-options?asset=DOGE"
echo "== claim-options lowercase"; $S/api.sh GET "/v1/claim-options?asset=eth"
echo "== claim-options missing"; $S/api.sh GET "/v1/claim-options"
`````

<details><summary>result (Bash)</summary>

`````text
== claim-options USDT
{"asset":"USDT","minAmount":"10","fee":"1.5","destinations":[{"id":"dest_exchange","label":"Binance account (UID ••4821)"},{"id":"dest_wallet","label":"Wallet 0x8f3e…a91c"}]}
[HTTP 200 | 0.608849s]
== claim-options BTC
{"asset":"BTC","minAmount":"0.0005","fee":"0.00002","destinations":[{"id":"dest_exchange","label":"Binance account (UID ••4821)"},{"id":"dest_wallet","label":"Wallet 0x8f3e…a91c"}]}
[HTTP 200 | 0.754026s]
== claim-options ETH
{"asset":"ETH","minAmount":"0.01","fee":"0.0012","destinations":[{"id":"dest_exchange","label":"Binance account (UID ••4821)"},{"id":"dest_wallet","label":"Wallet 0x8f3e…a91c"}]}
[HTTP 200 | 0.474178s]
== claim-options unknown asset
{"error":{"code":"VALIDATION","message":"asset must be one of USDT, BTC, ETH","field":"asset"}}
[HTTP 400 | 0.612538s]
== claim-options lowercase
{"error":{"code":"VALIDATION","message":"asset must be one of USDT, BTC, ETH","field":"asset"}}
[HTTP 400 | 0.609741s]
== claim-options missing
{"error":{"code":"VALIDATION","message":"asset must be one of USDT, BTC, ETH","field":"asset"}}
[HTTP 400 | 0.627489s]
`````

</details>

**🔧 Bash** — _Fetch activity pages and pagination edge cases_

`````bash
S=/private/tmp/claude-501/-Users-viktor-Documents-projects-cashmine-task/030c4e6a-119d-45af-b77d-c8093fb57417/scratchpad
$S/api.sh GET "/v1/activity?limit=5" > $S/act1.txt; cat $S/act1.txt
C=$(head -1 $S/act1.txt | python3 -c 'import sys,json;print(json.load(sys.stdin)["nextCursor"])')
echo "== page2 cursor=$C"; $S/api.sh GET "/v1/activity?limit=5&cursor=$C"
echo "== limit=0"; $S/api.sh GET "/v1/activity?limit=0"
echo "== limit=21"; $S/api.sh GET "/v1/activity?limit=21"
echo "== bad cursor"; $S/api.sh GET "/v1/activity?cursor=garbage"
`````

<details><summary>result (Bash)</summary>

`````text
{"items":[{"id":"act_2ddt2","type":"accrual","asset":"USDT","amount":"4.75","status":"pending","exchange":"Bybit","createdAt":"2026-10-23T07:23:01.261Z","relatedId":null},{"id":"act_322pl","type":"accrual","asset":"ETH","amount":"0.02","status":"confirmed","exchange":"OKX","createdAt":"2026-10-23T06:11:01.261Z","relatedId":null},{"id":"act_2b4zx","type":"accrual","asset":"USDT","amount":"50.12","status":"confirmed","exchange":"Bybit","createdAt":"2026-10-23T05:11:01.261Z","relatedId":null},{"id":"act_2olur","type":"accrual","asset":"BTC","amount":"0.00012","status":"confirmed","exchange":"Binance","createdAt":"2026-10-23T02:11:01.261Z","relatedId":null},{"id":"act_28w6s","type":"accrual","asset":"USDT","amount":"9.81","status":"confirmed","exchange":"Binance","createdAt":"2026-10-22T07:11:01.261Z","relatedId":null}],"nextCursor":"eyJvIjo0fQ"}
[HTTP 200 | 0.638840s]
== page2 cursor=eyJvIjo0fQ
{"items":[{"id":"act_28w6s","type":"accrual","asset":"USDT","amount":"9.81","status":"confirmed","exchange":"Binance","createdAt":"2026-10-22T07:11:01.261Z","relatedId":null},{"id":"act_2ztwg","type":"accrual","asset":"ETH","amount":"0.0275","status":"confirmed","exchange":"OKX","createdAt":"2026-10-21T07:11:01.261Z","relatedId":null},{"id":"act_26ndn","type":"accrual","asset":"USDT","amount":"15.25","status":"confirmed","exchange":"OKX","createdAt":"2026-10-20T07:11:01.261Z","relatedId":null},{"id":"act_2md1m","type":"accrual","asset":"BTC","amount":"0.00022","status":"confirmed","exchange":"Bybit","createdAt":"2026-10-18T07:11:01.261Z","relatedId":null},{"id":"act_24eki","type":"claim","asset":"USDT","amount":"-60","status":"completed","exchange":null,"createdAt":"2026-10-17T07:11:01.261Z","relatedId":null}],"nextCursor":"eyJvIjo4fQ"}
[HTTP 200 | 0.399706s]
== limit=0
{"error":{"code":"VALIDATION","message":"limit must be an integer from 1 to 20","field":"limit"}}
[HTTP 400 | 0.383898s]
== limit=21
{"error":{"code":"VALIDATION","message":"limit must be an integer from 1 to 20","field":"limit"}}
[HTTP 400 | 0.301627s]
== bad cursor
{"error":{"code":"VALIDATION","message":"Invalid cursor","field":"cursor"}}
[HTTP 400 | 0.756241s]
`````

</details>

**🔧 Bash** — _Walk all activity pages and summarize types and overlaps_

`````bash
S=/private/tmp/claude-501/-Users-viktor-Documents-projects-cashmine-task/030c4e6a-119d-45af-b77d-c8093fb57417/scratchpad
cat > $S/walk.py <<'EOF'
import json, subprocess, sys, base64, collections
S=sys.argv[1]
tok=open(S+'/token').read().strip()
def get(path):
    out=subprocess.run(['curl','-sS','-w','\n%{http_code}','-H','Authorization: Bearer '+tok,'https://task-api.cashmine.io'+path],capture_output=True,text=True).stdout
    body,code=out.rsplit('\n',1); return int(code), body
cur=None; pages=0; allitems=[]; dups=0; seen=set()
while True:
    p='/v1/activity?limit=20'+('&cursor='+cur if cur else '')
    for attempt in range(5):
        code,body=get(p)
        if code==200: break
        print('retry',code,body[:200])
    d=json.loads(body); pages+=1
    ids=[i['id'] for i in d['items']]
    ov=[i for i in ids if i in seen]; dups+=len(ov)
    dec = base64.urlsafe_b64decode(d['nextCursor']+'==').decode() if d['nextCursor'] else None
    print(f"page {pages}: {len(ids)} items, overlap={ov}, nextCursor={d['nextCursor']} -> {dec}")
    for i in d['items']:
        if i['id'] not in seen: seen.add(i['id']); allitems.append(i)
    cur=d['nextCursor']
    if not cur: break
print('unique items',len(allitems),'dups',dups)
c=collections.Counter((i['type'],i['status']) for i in allitems); print(c)
for i in allitems:
    if i['type']!='accrual' or i['status']!='confirmed': print(json.dumps(i))
print('keys', sorted({k for i in allitems for k in i}))
print('dates', allitems[-1]['createdAt'], '->', allitems[0]['createdAt'])
EOF
python3 -I $S/walk.py $S
`````

<details><summary>result (Bash)</summary>

`````text
page 1: 20 items, overlap=[], nextCursor=eyJvIjoxOX0 -> {"o":19}
retry 503 {"error":{"code":"SERVER","message":"Service temporarily unavailable"}}
page 2: 8 items, overlap=['act_1qxpo'], nextCursor=None -> None
unique items 27 dups 1
Counter({('accrual', 'confirmed'): 20, ('claim', 'completed'): 3, ('reversal', 'confirmed'): 2, ('accrual', 'pending'): 1, ('claim', 'failed'): 1})
{"id": "act_2ddt2", "type": "accrual", "asset": "USDT", "amount": "4.75", "status": "pending", "exchange": "Bybit", "createdAt": "2026-10-23T07:23:01.261Z", "relatedId": null}
{"id": "act_24eki", "type": "claim", "asset": "USDT", "amount": "-60", "status": "completed", "exchange": null, "createdAt": "2026-10-17T07:11:01.261Z", "relatedId": null}
{"id": "act_2vca6", "type": "claim", "asset": "ETH", "amount": "-0.5", "status": "failed", "exchange": null, "createdAt": "2026-10-14T07:11:01.261Z", "relatedId": null}
{"id": "act_2k48h", "type": "reversal", "asset": "BTC", "amount": "-0.00004", "status": "confirmed", "exchange": "OKX", "createdAt": "2026-10-09T07:11:01.261Z", "relatedId": "act_2hvfc"}
{"id": "act_2t3h1", "type": "claim", "asset": "ETH", "amount": "-1.2", "status": "completed", "exchange": null, "createdAt": "2026-10-06T07:11:01.261Z", "relatedId": null}
{"id": "act_1vfby", "type": "claim", "asset": "USDT", "amount": "-100", "status": "completed", "exchange": null, "createdAt": "2026-10-04T07:11:01.261Z", "relatedId": null}
{"id": "act_1t6it", "type": "reversal", "asset": "USDT", "amount": "-3.1", "status": "confirmed", "exchange": "OKX", "createdAt": "2026-10-02T07:11:01.261Z", "relatedId": "act_1qxpo"}
keys ['amount', 'asset', 'createdAt', 'exchange', 'id', 'relatedId', 'status', 'type']
dates 2026-09-24T05:11:01.261Z -> 2026-10-23T07:23:01.261Z
`````

</details>

**🔧 Bash** — _Probe auth errors, 404s, and claim validation rejections_

`````bash
S=/private/tmp/claude-501/-Users-viktor-Documents-projects-cashmine-task/030c4e6a-119d-45af-b77d-c8093fb57417/scratchpad
echo "== no token"; curl -sS -w '\n[HTTP %{http_code}]\n' https://task-api.cashmine.io/v1/balances
echo "== bad token"; curl -sS -w '\n[HTTP %{http_code}]\n' -H 'Authorization: Bearer ct1.nope' https://task-api.cashmine.io/v1/balances
echo "== unknown claim"; $S/api.sh GET /v1/claims/clm_doesnotexist
echo "== unknown endpoint"; $S/api.sh GET /v1/nope
post(){ echo "== POST $1 :: $2"; $S/api.sh POST /v1/claims -H 'Content-Type: application/json' $3 -d "$2"; }
post "no idem key" '{"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}' ""
K="-H Idempotency-Key:probe-$(date +%s)"
post "leading dot" '{"asset":"ETH","amount":".5","destinationId":"dest_wallet"}' "$K-a"
post "trailing dot" '{"asset":"ETH","amount":"1.","destinationId":"dest_wallet"}' "$K-b"
post "leading zero" '{"asset":"ETH","amount":"05","destinationId":"dest_wallet"}' "$K-c"
post "exponent" '{"asset":"ETH","amount":"1e-3","destinationId":"dest_wallet"}' "$K-d"
post "json number" '{"asset":"ETH","amount":0.001,"destinationId":"dest_wallet"}' "$K-e"
post "below min" '{"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}' "$K-f"
post "too many decimals BTC" '{"asset":"BTC","amount":"0.000000001","destinationId":"dest_wallet"}' "$K-g"
post "above available" '{"asset":"USDT","amount":"99999999","destinationId":"dest_wallet"}' "$K-h"
post "bad dest + below min" '{"asset":"ETH","amount":"0.001","destinationId":"dest_nope"}' "$K-i"
post "zero" '{"asset":"ETH","amount":"0","destinationId":"dest_wallet"}' "$K-j"
post "negative" '{"asset":"ETH","amount":"-1","destinationId":"dest_wallet"}' "$K-k"
`````

<details><summary>result (Bash)</summary>

`````text
== no token
{"error":{"code":"UNAUTHORIZED","message":"Missing or invalid token"}}
[HTTP 401]
== bad token
{"error":{"code":"UNAUTHORIZED","message":"Missing or invalid token"}}
[HTTP 401]
== unknown claim
{"error":{"code":"NOT_FOUND","message":"Claim not found"}}
[HTTP 404 | 0.684874s]
== unknown endpoint
{"error":{"code":"NOT_FOUND","message":"No such endpoint"}}
[HTTP 404 | 0.752488s]
== POST no idem key :: {"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.391910s]
== POST leading dot :: {"asset":"ETH","amount":".5","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.466905s]
== POST trailing dot :: {"asset":"ETH","amount":"1.","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.442359s]
== POST leading zero :: {"asset":"ETH","amount":"05","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.386734s]
== POST exponent :: {"asset":"ETH","amount":"1e-3","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.333047s]
== POST json number :: {"asset":"ETH","amount":0.001,"destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.428823s]
== POST below min :: {"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.304963s]
== POST too many decimals BTC :: {"asset":"BTC","amount":"0.000000001","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.471205s]
== POST above available :: {"asset":"USDT","amount":"99999999","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.344113s]
== POST bad dest + below min :: {"asset":"ETH","amount":"0.001","destinationId":"dest_nope"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.502781s]
== POST zero :: {"asset":"ETH","amount":"0","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.378791s]
== POST negative :: {"asset":"ETH","amount":"-1","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.381882s]
`````

</details>

## 🤖 Claude — 2026-10-23 07:26:40 UTC

zsh didn't word-split my header variable — the key never got sent. Redoing with the header passed explicitly.

**🔧 Bash** — _Probe claim validation rules with idempotency key set_

`````bash
S=/private/tmp/claude-501/-Users-viktor-Documents-projects-cashmine-task/030c4e6a-119d-45af-b77d-c8093fb57417/scratchpad
T=$(date +%s)
post(){ echo "== $1 :: $2"; $S/api.sh POST /v1/claims -H 'Content-Type: application/json' -H "Idempotency-Key: probe-$T-$3" -d "$2"; }
post "leading dot" '{"asset":"ETH","amount":".5","destinationId":"dest_wallet"}' a
post "trailing dot" '{"asset":"ETH","amount":"1.","destinationId":"dest_wallet"}' b
post "leading zero" '{"asset":"ETH","amount":"05","destinationId":"dest_wallet"}' c
post "exponent" '{"asset":"ETH","amount":"1e-3","destinationId":"dest_wallet"}' d
post "json number" '{"asset":"ETH","amount":0.001,"destinationId":"dest_wallet"}' e
post "below min" '{"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}' f
post "too many decimals BTC" '{"asset":"BTC","amount":"0.000000001","destinationId":"dest_wallet"}' g
post "above available" '{"asset":"USDT","amount":"99999999","destinationId":"dest_wallet"}' h
post "bad dest + below min" '{"asset":"ETH","amount":"0.001","destinationId":"dest_nope"}' i
post "zero" '{"asset":"ETH","amount":"0","destinationId":"dest_wallet"}' j
post "negative" '{"asset":"ETH","amount":"-1","destinationId":"dest_wallet"}' k
post "0.10 trailing zero below min ETH" '{"asset":"ETH","amount":"0.0010","destinationId":"dest_wallet"}' l
post "missing dest" '{"asset":"ETH","amount":"0.001"}' m
post "key too long" '{"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}' "$(printf 'x%.0s' {1..101})"
`````

<details><summary>result (Bash)</summary>

`````text
== leading dot :: {"asset":"ETH","amount":".5","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"amount must be a decimal string such as \"0.5\"","field":"amount"}}
[HTTP 400 | 0.324388s]
== trailing dot :: {"asset":"ETH","amount":"1.","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"amount must be a decimal string such as \"0.5\"","field":"amount"}}
[HTTP 400 | 0.483117s]
== leading zero :: {"asset":"ETH","amount":"05","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"amount must be a decimal string such as \"0.5\"","field":"amount"}}
[HTTP 400 | 0.333755s]
== exponent :: {"asset":"ETH","amount":"1e-3","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"amount must be a decimal string such as \"0.5\"","field":"amount"}}
[HTTP 400 | 0.493070s]
== json number :: {"asset":"ETH","amount":0.001,"destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"amount must be a decimal string such as \"0.5\"","field":"amount"}}
[HTTP 400 | 0.365949s]
== below min :: {"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"The minimum claim is 0.01 ETH","field":"amount"}}
[HTTP 400 | 0.314236s]
== too many decimals BTC :: {"asset":"BTC","amount":"0.000000001","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"BTC amounts have at most 8 decimal places","field":"amount"}}
[HTTP 400 | 0.316453s]
== above available :: {"asset":"USDT","amount":"99999999","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Amount exceeds the available balance","field":"amount"}}
[HTTP 400 | 0.316036s]
== bad dest + below min :: {"asset":"ETH","amount":"0.001","destinationId":"dest_nope"}
{"error":{"code":"VALIDATION","message":"The minimum claim is 0.01 ETH","field":"amount"}}
[HTTP 400 | 0.430798s]
== zero :: {"asset":"ETH","amount":"0","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"The minimum claim is 0.01 ETH","field":"amount"}}
[HTTP 400 | 0.420258s]
== negative :: {"asset":"ETH","amount":"-1","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"amount must be a decimal string such as \"0.5\"","field":"amount"}}
[HTTP 400 | 0.407437s]
== 0.10 trailing zero below min ETH :: {"asset":"ETH","amount":"0.0010","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"The minimum claim is 0.01 ETH","field":"amount"}}
[HTTP 400 | 0.414757s]
== missing dest :: {"asset":"ETH","amount":"0.001"}
{"error":{"code":"VALIDATION","message":"The minimum claim is 0.01 ETH","field":"amount"}}
[HTTP 400 | 0.373500s]
== key too long :: {"asset":"ETH","amount":"0.001","destinationId":"dest_wallet"}
{"error":{"code":"VALIDATION","message":"Idempotency-Key header is required (1 to 100 characters)","field":"Idempotency-Key"}}
[HTTP 400 | 0.321790s]
`````

</details>

**🔧 Bash** — _Sample 25 balance requests for errors and latency_

`````bash
S=/private/tmp/claude-501/-Users-viktor-Documents-projects-cashmine-task/030c4e6a-119d-45af-b77d-c8093fb57417/scratchpad
for i in $(seq 1 25); do curl -sS -o $S/b.json -D $S/h.txt -w "%{http_code} %{time_total}s " -H "Authorization: Bearer $(cat $S/token)" https://task-api.cashmine.io/v1/balances; python3 -I -c 'import json,sys;d=json.load(open(sys.argv[1]));print(d.get("asOf") or d)' $S/b.json; grep -i -E 'retry-after' $S/h.txt; done
`````

<details><summary>result (Bash)</summary>

`````text
200 0.504946s 2026-10-23T07:27:01.261Z
access-control-expose-headers: Retry-After, Idempotent-Replayed
200 0.598578s 2026-10-23T07:27:01.261Z
access-control-expose-headers: Retry-After, Idempotent-Replayed
503 0.256316s {'error': {'code': 'SERVER', 'message': 'Service temporarily unavailable'}}
access-control-expose-headers: Retry-After, Idempotent-Replayed
200 0.726418s 2026-10-23T07:27:01.261Z
access-control-expose-headers: Retry-After, Idempotent-Replayed
200 0.944493s 2026-10-23T07:27:01.261Z
access-control-expose-headers: Retry-After, Idempotent-Replayed
200 0.630006s 2026-10-23T07:27:01.261Z
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.125493s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 5841}}
retry-after: 6
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.100611s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 5656}}
retry-after: 6
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.110691s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 5479}}
retry-after: 6
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.116312s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 5312}}
retry-after: 6
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.110483s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 5124}}
retry-after: 6
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.098006s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 4951}}
retry-after: 5
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.097225s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 4798}}
retry-after: 5
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.754263s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 4005}}
retry-after: 5
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.176347s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 3768}}
retry-after: 4
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.153041s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 3508}}
retry-after: 4
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.118321s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 3309}}
retry-after: 4
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.129807s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 3102}}
retry-after: 4
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.111326s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 2936}}
retry-after: 3
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.280670s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 2605}}
retry-after: 3
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.233247s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 2273}}
retry-after: 3
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.137107s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 2052}}
retry-after: 3
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.134928s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 1856}}
retry-after: 2
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.132503s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 1649}}
retry-after: 2
access-control-expose-headers: Retry-After, Idempotent-Replayed
429 0.116819s {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests', 'retryAfterMs': 1453}}
retry-after: 2
access-control-expose-headers: Retry-After, Idempotent-Replayed
`````

</details>

**🔧 Write** `/Users/viktor/Documents/projects/cashmine-task/docs/superpowers/specs/2026-10-23-cashmine-payback-design.md`

`````markdown
# CashMine Payback App — Design Spec & Task Breakdown

Date: 2026-10-23 · Deadline: **09:00 UTC hard stop** (no pushes/deploys after) · Spec written ~07:35 UTC

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

### D2 — Balance shown right after a claim is submitted — **PENDING USER CHOICE**
The brief requires discussing ≥2 approaches with the AI before choosing (this conversation). Options:

- **A. Optimistic subtract on tap** (before the server answers). Fast feedback, but the next stale
  snapshot (`asOf` before the claim) overwrites it → "dropped, then jumped back". On failure/400 it
  must also roll back. Guessing before the server confirms anything.
- **B. Server snapshot only + "claim in progress" card.** Never shows anything the server didn't
  say, but for up to 15 s available is unchanged → "didn't change, so I claimed again". Needs a
  strong duplicate guard and a clear banner to compensate.
- **C. Confirmed-claim overlay reconciled by `asOf` (recommended).** Only after the server returns
  the claim (201/200 — server-confirmed, and the docs say the amount "leaves `available` at once"),
  apply it to any snapshot that predates it:
  ```
  for each tracked claim c of this asset with createdAt > snapshot.asOf:   // not yet in snapshot
      if c.status == failed: skip                                           // amount is back
      available -= c.amount
      if c.status == pending: claiming += c.amount
  ```
  Once a snapshot with `asOf > createdAt` arrives, the snapshot already includes the claim and the
  overlay drops out naturally, so there's **no drop-then-jump**. The only legitimate jump back is a
  failed claim, and the UI announces it ("Claim failed — 0.5 ETH returned to available").
  Rows with an overlay applied are visibly marked ("includes your claim of 0.5 ETH").
  Risk: depends on `asOf`/`createdAt` being comparable server timestamps (same server clock). Must be
  **verified once** in T6 with a real claim; if it doesn't hold, fall back to B.

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
- **reconcile.ts:** implements D2 (option C, unless the user picks otherwise), compares
  `Date.parse(c.createdAt) > Date.parse(asOf)`, and clamps displayed available at 0 (flagging an
  invariant breach if it happens).
  - Tests: claim before `asOf` → unchanged; after `asOf` pending → available −, claiming +;
    completed → available − only; failed → unchanged; different asset → unchanged; two claims.
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
- `ai-logs/`: export the conversations.
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

`````

<details><summary>result (Write)</summary>

`````text
File created successfully at: /Users/viktor/Documents/projects/cashmine-task/docs/superpowers/specs/2026-10-23-cashmine-payback-design.md (file state is current in your context — no need to Read it back)
`````

</details>

## 🤖 Claude — 2026-10-23 07:32:56 UTC

I wrote the spec to `docs/superpowers/specs/2026-10-23-cashmine-payback-design.md`. It isn't committed yet; say if you want it in commit #1.

**What I checked against the live API.** I only read data and sent requests the server had to reject, so no claim was created and your balances are untouched.
- **ETH uses 18 decimals.** An amount like `12.365678901234591676` breaks JS `number`, so every amount is stored as a `bigint` of the smallest unit.
- **Activity pages overlap by one item.** The last item on each page comes back as the first item of the next page. The list has to drop duplicates by `id`.
- **The rate limit is low.** About 25–30 requests within a minute got a 429, with waits of up to 6 s. With claim polling, auto-refresh and activity all calling the API, a careless app hits that limit quickly.
- **The server fails randomly.** I got 2 × 503 out of about 40 requests. Your token says `"chaos":"normal"`; the graders' tokens may fail more often.
- **Claims need a destination.** The API requires a `destinationId` even though the email never mentions it. There are two options: the Binance account or the wallet.
- **Re-sending a claim is safe.** The API's `Idempotency-Key` returns the original claim on a repeat request and never creates a second one. That answers the timeout decision: resend with the same key, and never generate a new key for the same claim.

**Subtasks:**

| Task | What it covers | When |
|---|---|---|
| T0 | Expo Router setup, dependencies, first deploy | First, blocks the rest |
| T1 | Amount math and its tests | In parallel after T0 |
| T2 | API client | In parallel after T0 |
| T3 | Token screen and app shell | In parallel after T0 |
| T4 | Home with balances | After T1–T3 |
| T5 | Claim form and submission | After T1–T3 |
| T6 | Claim tracking, balance adjustment, status screen | After T1–T2 |
| T7 | Activity | Only if there's time |
| T8 | NOTES.md, README, ai-logs, deploy | Last |

The spec fixes the shared types and function signatures up front and says which files each task owns, so the tasks can be built at the same time without conflicts. It also has a timeline to 08:58 and an order for what to cut if you run late.

**Token warning:** your token appears in the email you pasted and in my test commands in this session. Redact it before this conversation goes into `ai-logs/`. T8 includes a search of the repo for `ct1.` and `eyJjaWQi`.

**The one decision that's yours** (the email wants this conversation in the logs). It's what the balance shows right after a claim is submitted:
- **A. Subtract as soon as the user taps.** The next balance snapshot from the server can be up to 15 s old and puts the old number back. That's the "dropped, then jumped back" complaint.
- **B. Show only the server's numbers, plus a "claim in progress" card.** Available stays the same for up to 15 s. That's the "didn't change, so I claimed again" complaint.
- **C. Adjust only after the server confirms the claim (my recommendation).** Once the server returns the claim, subtract it from any snapshot taken before that claim's `createdAt`. When a newer snapshot arrives, it already includes the claim and the adjustment drops away, so the balance never jumps back. The one exception is a failed claim, which the app announces. This relies on two server timestamps (`asOf` and `createdAt`) being comparable, so T6 checks it once with a real 10 USDT claim and falls back to B if it fails.

Which of A, B or C do you want?

## 🧑 User — 2026-10-23 07:46:52 UTC

lets use option c