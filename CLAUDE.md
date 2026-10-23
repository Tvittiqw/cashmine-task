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
