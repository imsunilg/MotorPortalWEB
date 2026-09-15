# MotorPortalWEB

Angular web application for **Motor Portal**, a bulk motor-insurance policy
issuance system: login, dashboard, Excel upload, batch summary, invalid
records, batch processing, certificates, reports, search & print, and
policy cancellation.

Built with Angular 22 (standalone components, strict mode), talking to
**MotorPortalAPI** (.NET 8 Web API) over HTTP with JWT bearer
authentication.

Part of the 4-repo Motor Portal system:
[MotorPortalAPI](https://github.com/imsunilg/MotorPortalAPI) ·
**MotorPortalWEB** ·
[MotorPortalDB](https://github.com/imsunilg/MotorPortalDB) ·
[MotorPortalDOC](https://github.com/imsunilg/MotorPortalDOC) (architecture,
ER diagram, API reference, setup guide, changelog for the whole system).

## Tech stack

- Angular 22, standalone components, strict TypeScript
- Angular Router, Reactive Forms, RxJS (`interval` + `switchMap` for live
  status polling)
- Session-based JWT storage (`sessionStorage`, not `localStorage` — see
  Auth flow below)
- Plain CSS design tokens (navy/orange/white theme)

## Project structure

```
src/app/
  core/            # guards, interceptors, services, models (auth, HTTP)
  shared/          # reusable components/directives/pipes
  layout/          # header, sidebar, footer, and the shell that wraps routed pages
  features/        # one folder per feature area (authentication, dashboard, excel-upload, ...)
src/environments/  # environment.ts (production) / environment.development.ts (ng serve)
src/_theme.css     # navy/orange/white design tokens, imported by src/styles.css
```

## Configuring the API base URL

The app reads `environment.apiBaseUrl` for all HTTP calls (see
`src/app/core/services/auth.service.ts`).

- `src/environments/environment.development.ts` is used automatically by
  `ng serve` (wired via the `development` file replacement in
  `angular.json`). It defaults to `http://localhost:5795/api`, matching
  MotorPortalAPI's `http` launch profile.
- `src/environments/environment.ts` is used for production builds
  (`ng build`). Update `apiBaseUrl` there to point at the deployed API
  before building for a real environment.

If MotorPortalAPI's port changes, check
`MotorPortal.API/Properties/launchSettings.json` in the MotorPortalAPI repo
and update the environment file(s) to match.

## How to run locally

```bash
npm install
ng serve
```

Then open `http://localhost:4795`. Log in with the seeded MotorPortalAPI
credentials (`admin` / `admin123`) once the API is running
(`dotnet run --project MotorPortal.API` from the MotorPortalAPI repo). See
MotorPortalDOC's
[`docs/setup-guide.md`](https://github.com/imsunilg/MotorPortalDOC/blob/main/docs/setup-guide.md)
for the full from-zero sequence across all repos.

Other useful commands:

```bash
ng build                       # production build
ng build --configuration development
ng test --watch=false          # unit tests
```

## Auth flow

- `AuthService` (`core/services/auth.service.ts`) logs in against
  `POST /api/auth/login`, stores the token/username/role in
  `sessionStorage` (see the code comment there for why session storage was
  chosen over `localStorage`), and exposes the current user as a signal.
- `authGuard` (`core/guards/auth.guard.ts`) is a functional
  `CanActivateFn` that blocks unauthenticated access to the
  layout-wrapped feature routes and redirects to `/login`.
- `authInterceptor` (`core/interceptors/auth.interceptor.ts`) attaches
  `Authorization: Bearer <token>` to every outgoing request and clears
  the session + redirects to `/login` on a `401` response.
- The layout shell (`layout/shell`) renders the header (brand, welcome
  message, live clock, logout) and sidebar (Dashboard, Excel Upload,
  Batch Summary, Reports, Search & Print, Policy Cancel) around a
  `<router-outlet>`, and sits behind `authGuard`.

## Features (all pages)

- **Login** — JWT auth against MotorPortalAPI.
- **Dashboard** (`features/dashboard`) — mandatory product + process radio
  selection (hardcoded from the seeded `product_master` / `function_master`
  rows in `core/models/product.model.ts` — real IDs, confirmed via direct
  DB query). Submit navigates to the matching feature route with
  `?productId=`. A "View CD Balance" drawer lists `GET /api/master-policies`
  and calls `GET /api/master-policies/{id}/cd-balance`.
- **Excel Upload** (`features/excel-upload`) — reads `productId` from the
  query string (falls back to letting the user pick one), uploads via
  `POST /api/batches/upload`, renders row-numbered validation errors on a
  400, offers the sample template download, and processes the uploaded
  batch via `POST /api/batches/{id}/process`.
- **Batch Summary** (`features/batch-summary`) — optional From/To date
  filters, counters from `GET /api/batches/summary-counters`, and a grid
  from `GET /api/batches` with per-row Process/Payment/Bulk-Print actions,
  a "View Processing" link into batch-processing, a "Certificates
  Generated" panel after Bulk Print succeeds, and a link to Invalid
  Records.
- **Invalid Records** (`/invalid-records/:batchId`) — lists
  `GET /api/batches/{id}/invalid-records` and clears them via `DELETE`
  behind an in-app confirm dialog (`shared/components/confirm-dialog`).
- **Batch Processing** (`/batch-processing/:batchId`) — a six-tile
  pipeline (Excel Upload, Validation, Premium Calculation, GST Rate,
  Proposal Tag, Payment Tag) driven entirely by polling
  `GET /api/batches/{id}/status` every 2.5s via RxJS `interval` +
  `switchMap`; each tile's pending/active/done state is derived from the
  real `status` string against the API's actual lifecycle
  (`UPLOADED → VALIDATED → PREMIUM_CALCULATED → GST_CALCULATED →
  PROPOSAL_CREATED → PAYMENT_PENDING → PAYMENT_PROCESSED →
  POLICY_CREATED → PRINTED`), and polling stops once the batch reaches
  `PAYMENT_PROCESSED`/`POLICY_CREATED`/`PRINTED` or the component is
  destroyed. A "Tag Payments" button calls `POST /api/batches/{id}/payments`
  and renders every per-proposal result (success or failure, with the real
  backend failure message) in a table.
- **Policy Certificate** (`/policy-certificate/:policyId`) — shows Policy
  Number, Master Policy, Make, Model, Engine Number, Chassis Number,
  Premium, Issued Date. Prefers fields passed via router `state` from the
  caller (e.g. a bulk-print result or a search result), and falls back to
  `GET /api/policies/search?policyNo=` when no state is present. **Known
  API gap**: `PolicySearchResultDto` has no master-policy field at all, so
  "Master Policy" only ever renders when a caller happens to pass it
  through state — otherwise it shows "Not available" rather than a guess.
  "Print" and "Download Certificate" both fetch the PDF through
  `PolicyService.getCertificateBlob()` (an `HttpClient` call, so the auth
  interceptor's Bearer token is attached) and open/save it via an object
  URL, since the endpoint is `[Authorize]`-protected and a plain
  `<a href>` can't carry the header.
- **Reports** (`features/reports`) — a single Report Type ("Policy Issue
  Report", read-only — the only type the API exposes) plus From/To date
  pickers. "Export Report" posts `{ fromDate, toDate }` to
  `POST /api/reports/policy-issue` and downloads the returned `.xlsx` blob.
  The API always returns `200` with a real workbook, even for a range with
  no issued policies — there is no "no data" error case.
- **Search & Print Policy** (`features/policy-search`) — Engine Number /
  Chassis Number / TC Number / Policy Number fields with client-side
  validation requiring at least one, calling `GET /api/policies/search`.
  Each result row's "Print" button navigates to
  `/policy-certificate/:policyId` with router state, so printing a
  searched policy never re-fetches it.
- **Policy Cancel Upload** (`features/policy-cancel`) — a file picker
  posting a `POLICY_NO`-column Excel file to
  `POST /api/policies/cancel-upload`. The result always renders as two
  distinct panels — cancelled policy numbers and a table of rejected rows
  with their real reasons (`Policy not found`, `Policy already cancelled`)
  — never collapsed into one pass/fail message.

All pages render the API's `{ statusCode, message, traceId }` error body
(`core/services/api-error.util.ts`) as a visible banner instead of only
logging to console, and every list/grid has a real "No records found"
empty state plus a loading indicator on initial fetch.

**Known backend quirk** (batch summary): passing `fromDate`/`toDate`
previously 400'd server-side; this has since been fixed on the API side.
`summary-counters` and `/batches` now both use `pendingProcessing` for the
same counter (previously inconsistent — fixed during the integration
pass).

## How this fits into the 4-repo system

This app is the only client of MotorPortalAPI and never talks to
MotorPortalDB directly. See MotorPortalDOC's
[`docs/architecture.md`](https://github.com/imsunilg/MotorPortalDOC/blob/main/docs/architecture.md)
for the full component diagram,
[`docs/api-reference.md`](https://github.com/imsunilg/MotorPortalDOC/blob/main/docs/api-reference.md)
for every endpoint this app calls, and
[`docs/setup-guide.md`](https://github.com/imsunilg/MotorPortalDOC/blob/main/docs/setup-guide.md)
for bringing up the whole stack from zero.

## Verification

Verified end-to-end against a live MotorPortalAPI + PostgreSQL instance,
**including a real headless-browser click-through** (Playwright/Chromium —
logged in as `admin`/`admin123` at `http://localhost:4795`, driven through
the actual DOM, at both a 1280px desktop and a 375px mobile viewport, with
zero console/page errors at either width) covering the entire journey:
login → dashboard → Excel upload → batch processing → invalid records →
payment tagging (including a real insufficient-CD-balance case, using
seeded low-balance master policy `DL-3010/A/1485553`) → certificate
view/download (`%PDF-1.4` magic bytes confirmed, requires Bearer token) →
bulk print → search & print by engine number → Policy Issue Report export
(real, non-empty `.xlsx`, `PK` zip signature) → policy cancel upload +
re-upload rejection.

### Responsive & visual polish pass

Read through every page's `.html`/`.css` across all phases and fixed:

- **Low-contrast page titles (fixed everywhere)** — every page's `<h1>`
  was styled `color: var(--mp-white)` on the `--mp-off-white` content
  background, making titles nearly invisible. Changed to `var(--mp-navy)`
  across all 9 affected stylesheets.
- **Hardcoded hex color** — `.mp-badge-warning` used a raw `color:
  #a06a10`; replaced with a new `--mp-warning-text` theme token.
- **Header overflow risk at narrow widths** — the app header had no
  `flex-wrap`, risking overflow at narrow screens. Changed to
  `min-height` + `flex-wrap: wrap` + row gap.
- **Page-header overflow risk** — added `flex-wrap: wrap` + `gap` to four
  page-header flex rows (dashboard, invalid-records, batch-processing,
  policy-certificate) that pair a title with a button.

## Progress

- [x] Bootstrap (ground rules, README, .gitignore)
- [x] App shell, theme, auth service/guard/interceptor, login, layout
- [x] Dashboard, CD balance, excel upload, batch summary, invalid records
- [x] Batch processing status, proposal/payment/policy, certificate, bulk print
- [x] Reports, search & print, policy cancel, responsive/visual polish
- [x] Full cross-repo integration pass — 2 bugs found and fixed (see below)

## Known limitations / not yet implemented

A full cross-repo integration pass (2026-09-15) drove the entire journey
end to end through the real running app in a headless Chromium browser
(login → dashboard → excel upload → batch processing → invalid records →
payment tagging with a real insufficient-CD-balance case → certificate
view/download → bulk print → search & print → report export → policy
cancel + re-upload rejection), against the real API and PostgreSQL
database — no shortcuts.

Two real bugs were found and fixed during that pass:

- `excel-upload.ts` and `policy-cancel.ts` never cleared the native
  `<input type="file">`'s value after handling a selection, so
  re-selecting the *exact same file* a second time (e.g. retrying a
  failed upload, or re-uploading a cancel-list file) silently failed to
  fire the browser's `change` event, leaving the Upload button disabled
  with no feedback. Fixed by resetting `input.value = ''` at the end of
  `onFileSelected()` in both components.

No other known integration-level limitations were found in this pass. The
PF (payment facilitator) confirmation remains simulated on the API side
(`MockPfService`), which is expected and by design for this environment —
the UI already renders whatever real or simulated response the API
returns.
