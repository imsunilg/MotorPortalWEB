# MotorPortalWEB

Angular web application for the Motor Portal, including login, dashboard, Excel upload, batch summary, policy processing, reports, search, printing and cancellation.

Built with Angular (standalone components, strict mode), talking to the MotorPortalAPI (.NET 8 Web API) over HTTP with JWT bearer authentication.

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

The app reads `environment.apiBaseUrl` for all HTTP calls (see `src/app/core/services/auth.service.ts`).

- `src/environments/environment.development.ts` is used automatically by `ng serve` (wired via the `development` file replacement in `angular.json`). It defaults to `http://localhost:5287/api`, matching MotorPortalAPI's `http` launch profile.
- `src/environments/environment.ts` is used for production builds (`ng build`). Update `apiBaseUrl` there to point at the deployed API before building for a real environment.

If MotorPortalAPI's port changes, check `MotorPortal.API/Properties/launchSettings.json` in the MotorPortalAPI repo and update the environment file(s) to match.

## Running

```bash
npm install
ng serve
```

Then open http://localhost:4200. Log in with the seeded MotorPortalAPI credentials (`admin` / `admin123`) once the API is running (`dotnet run --project MotorPortal.API` from the MotorPortalAPI repo).

Other useful commands:

```bash
ng build                       # production build
ng build --configuration development
ng test --watch=false          # unit tests
```

## Auth flow

- `AuthService` (`core/services/auth.service.ts`) logs in against `POST /api/auth/login`, stores the token/username/role in `sessionStorage` (see the code comment there for why session storage was chosen over `localStorage`), and exposes the current user as a signal.
- `authGuard` (`core/guards/auth.guard.ts`) is a functional `CanActivateFn` that blocks unauthenticated access to the layout-wrapped feature routes and redirects to `/login`.
- `authInterceptor` (`core/interceptors/auth.interceptor.ts`) attaches `Authorization: Bearer <token>` to every outgoing request and clears the session + redirects to `/login` on a `401` response.
- The layout shell (`layout/shell`) renders the header (brand, welcome message, live clock, logout) and sidebar (Dashboard, Excel Upload, Batch Summary, Reports, Search & Print, Policy Cancel) around a `<router-outlet>`, and sits behind `authGuard`.

## Dashboard, Excel upload, batch summary, invalid records

- `features/dashboard` — mandatory product + process radio selection (hardcoded from the seeded `product_master` / `function_master` rows in `core/models/product.model.ts` — real IDs, confirmed via direct DB query; replace with a live endpoint if the API adds one later). Submit navigates to the matching feature route with `?productId=`. A "View CD Balance" drawer lists `GET /api/master-policies` and calls `GET /api/master-policies/{id}/cd-balance`.
- `features/excel-upload` — reads `productId` from the query string (falls back to letting the user pick one), uploads via `POST /api/batches/upload`, renders row-numbered validation errors on a 400, offers the sample template download (`GET /api/batches/{id}/sample-template` — the API ignores the id and always returns the same static template, so this works before a batch exists), and processes the uploaded batch via `POST /api/batches/{id}/process`.
- `features/batch-summary` — optional From/To date filters, counters from `GET /api/batches/summary-counters`, and a grid from `GET /api/batches` with per-row Process/Payment/Bulk-Print actions and a link to Invalid Records. **Known backend quirk**: passing `fromDate`/`toDate` currently 400s server-side ("Cannot write DateTime with Kind=Unspecified..."); omitting them works. Also note `summary-counters` names its counter `pendingBatchProcessing` while the `/batches` list names the equivalent field `pendingProcessing` — both are honored as-is per the live API.
- `features/invalid-records` (`/invalid-records/:batchId`) — lists `GET /api/batches/{id}/invalid-records` and clears them via `DELETE` behind an in-app confirm dialog (`shared/components/confirm-dialog`).
- All four pages render the API's `{ statusCode, message, traceId }` error body (see `core/services/api-error.util.ts`) as a visible banner instead of only logging to console.

Verified end-to-end against a live MotorPortalAPI + PostgreSQL instance: logged in, downloaded the real sample template, uploaded it, processed the batch, listed it in the batch summary grid, and pulled its real invalid record and CD balance data — all via the exact HTTP calls these components make (confirmed with `curl`; no headless-browser click-through was available in this environment, so the UI itself was verified by code review plus a clean `ng build`/`ng serve` with no console/compile errors).

## Batch processing, payments, certificates, bulk print

- `features/batch-processing` (`/batch-processing/:batchId`) — a six-tile pipeline (Excel Upload, Validation, Premium Calculation, GST Rate, Proposal Tag, Payment Tag) driven entirely by polling `GET /api/batches/{id}/status` every 2.5s via RxJS `interval` + `switchMap`; each tile's pending/active/done state is derived from the real `status` string against the API's actual lifecycle (`UPLOADED → VALIDATED → PREMIUM_CALCULATED → GST_CALCULATED → PROPOSAL_CREATED → PAYMENT_PENDING → PAYMENT_PROCESSED → POLICY_CREATED → PRINTED`), and polling stops once the batch reaches `PAYMENT_PROCESSED`/`POLICY_CREATED`/`PRINTED` or the component is destroyed. A "Tag Payments" button calls `POST /api/batches/{id}/payments` and renders every per-proposal result (success or failure, with the real backend failure message) in a table.
- `features/policy-certificate` (`/policy-certificate/:policyId`) — shows Policy Number, Master Policy, Make, Model, Engine Number, Chassis Number, Premium, Issued Date. Prefers fields passed via router `state` from the caller (e.g. a bulk-print result), and falls back to `GET /api/policies/search?policyNo=` (passed as a query param) when no state is present. **Known API gap**: `PolicySearchResultDto` has no master-policy field at all, so "Master Policy" only ever renders when a caller happens to pass it through state — otherwise it shows "Not available" rather than a guess. "Print" and "Download Certificate" both fetch the PDF through `PolicyService.getCertificateBlob()` (an `HttpClient` call, so the auth interceptor's Bearer token is attached) and open/save it via an object URL, since the endpoint is `[Authorize]`-protected and a plain `<a href>` can't carry the header.
- `features/batch-summary` — added a "View Processing" action per row (navigates to the batch-processing view) and a "Certificates Generated" panel that appears after Bulk Print succeeds, listing every generated policy number as a link into `policy-certificate`.
- New `core/models/policy.model.ts` and `core/services/policy.service.ts` wrap `GET /api/policies/search`, `POST /api/policies/{id}/certificate`, and `GET /api/policies/{id}/certificate`.

Verified end-to-end against a live MotorPortalAPI + PostgreSQL instance via direct `curl` calls mirroring exactly what the Angular services send (no headless browser was available in this environment, so the UI itself was verified by code review plus a clean `ng build`):
- Logged in as `admin`/`admin123`, listed `GET /api/batches`, and confirmed `BatchStatusDto`/`PaymentBatchResultDto`/`BulkPrintResultDto` field names match the frontend models exactly (`batchId`, `fileName`, `status`, `totalRecords`, `validRecords`, `invalidRecords`, `createdOn`, `premiumCalculatedCount`, `gstCalculatedCount`, `proposalsCreatedCount`, `paymentsProcessedCount`, `policiesCreatedCount`; `results[].{proposalId,success,message}`; `certificates[].{policyId,policyNo,certPath}`).
- Drove batch 6 (`PROPOSAL_CREATED`) through `POST /api/batches/6/payments` → both proposals succeeded, batch advanced to `POLICY_CREATED`; then `POST /api/batches/6/bulk-print` → 2 certificates generated with real policy numbers, batch advanced to `PRINTED`.
- Fetched `GET /api/policies/search?policyNo=...` for one of those policies and got back `make`, `model`, `engineNo`, `chassisNo`, `premium`, `issuedOn` — exactly what `PolicyCertificateDisplay` expects.
- Fetched `GET /api/policies/5/certificate` and confirmed the response is a genuine PDF (`%PDF-1.4` magic bytes, `Content-Type: application/pdf`, `Content-Disposition: attachment`) and requires the Bearer token (`[Authorize]` on the controller) — matching how `PolicyService.getCertificateBlob()` calls it.
- Reproduced the **insufficient CD balance** failure case for real: built a one-row batch upload referencing the low-balance seeded master policy `DL-3010/A/1485553` (CD balance ₹1,500), uploaded/processed it (batch 9), and calling `POST /api/batches/9/payments` returned `{"success":false,"message":"Insufficient CD balance for master policy id 4"}` with the batch left at `PAYMENT_PENDING` — confirming the batch-processing view's per-case failure rendering (including the message) against a real backend response rather than a guess.
- Not independently confirmed: actual browser rendering/clicking (no headless browser in this environment) and the PDF opening in a real browser tab — the HTTP mechanics (auth header, blob type, object URL usage) were verified precisely instead, per the task's guidance.

## Reports, search & print, policy cancel

- `features/reports` — a single Report Type ("Policy Issue Report", read-only — it's the only type the API exposes today) plus From/To date pickers. "Export Report" posts `{ fromDate, toDate }` to `POST /api/reports/policy-issue` via `core/services/report.service.ts` and downloads the returned `.xlsx` blob through the same create-object-URL/anchor-click/revoke pattern used elsewhere in this repo (`PolicyService.getCertificateBlob`, `BatchService.downloadSampleTemplate`). **Verified live**: the API always returns `200` with a real workbook, even for a range with no issued policies (a header-row-only sheet) or missing dates — it never returns a "no data" error — so the UI always triggers the download on success and only shows an error banner for a genuine HTTP/network failure (plus a client-side check that both dates are filled and in order before calling the API at all).
- `features/policy-search` (Search & Print Policy) — Engine Number / Chassis Number / TC Number / Policy Number fields with client-side validation requiring at least one (mirroring the API's own 400 when none are given), calling `PolicyService.search()` against `GET /api/policies/search`. Results render Policy Number, Make, Model, Chassis, Engine, Premium, Status, Issued On, each row's "Print" button navigating to the existing `/policy-certificate/:policyId` route with the exact `PolicyCertificateNavState` router-state shape that component already expects (`policyNo`, `make`, `model`, `engineNo`, `chassisNo`, `premium`, `issuedOn`), so printing a searched policy never re-fetches it.
- `features/policy-cancel` (Policy Cancel Upload) — a file picker (same browse-button pattern as `features/excel-upload`) posting a `POLICY_NO`-column Excel file to `POST /api/policies/cancel-upload` via the new `PolicyService.cancelUpload()`. The result is always rendered as two distinct panels — a list of cancelled policy numbers and a table of rejected rows with their real reasons (`Policy not found`, `Policy already cancelled`) — never collapsed into one pass/fail message, since the API itself processes every row independently and always returns `200` with both arrays.
- New `core/services/report.service.ts`; `core/models/report.model.ts`; `PolicyCancelUploadResult`/`PolicyCancelRejection` added to `core/models/policy.model.ts`; `cancelUpload()` added to `core/services/policy.service.ts`.

Verified end-to-end against a live MotorPortalAPI + PostgreSQL instance, **including real headless-browser click-through this time** (Playwright/Chromium, installed for this verification pass — logged in as `admin`/`admin123` at `http://localhost:4200`, driven through the actual DOM, at both a 1280px desktop and a 375px mobile viewport, with zero console/page errors at either width):
- Reports: filled From `2020-01-01` / To `2030-01-01`, clicked "Export Report", and captured a real browser `download` event for `policy-issue-report-2020-01-01-to-2030-01-01.xlsx`. Independently confirmed via `curl` that the endpoint returns a genuine, non-empty `.xlsx` (`PK` zip signature, opens as `Microsoft Excel 2007+`) for a wide range, and still returns `200` with a valid (header-only) workbook for an empty range (`1999-01-01`→`1999-01-02`) and even with no body at all — there is no "no data" error case to handle beyond that.
- Search & Print: searched by `engineNo=ENG-SEED-0006`, got back the real seeded policy `3010/A/443668109/00/000` (Bajaj RE) with every column populated, clicked "Print", and landed on `/policy-certificate/1` with the full detail view rendered from router state (no re-fetch).
- Policy Cancel: generated real `.xlsx` test files with ClosedXML (a throwaway console app referencing the same package MotorPortalAPI's `PolicyService` uses, since neither Excel nor Python was available) containing real seeded policy numbers plus one bogus one, uploaded via `curl` and confirmed `{"cancelled":[...],"rejected":[{"reason":"Policy not found"}]}`, re-uploaded the same file and confirmed the rows flipped to `"Policy already cancelled"`; then drove the same "already cancelled" path through the real browser UI and confirmed the two-panel Cancelled/Rejected result renders correctly.

## Responsive & visual polish pass

Read through every page's `.html`/`.css` across all phases (dashboard, excel-upload, batch-summary, invalid-records, batch-processing, policy-certificate, reports, policy-search, policy-cancel, login, layout) and fixed the following real issues found (all confirmed via the Playwright screenshots above, at both 1280px and 375px):

- **Low-contrast page titles (fixed everywhere)** — every page's `<h1>` was styled `color: var(--mp-white)` sitting directly on the `--mp-off-white` content background, making every page title nearly invisible (confirmed visually via screenshot before the fix). Changed to `var(--mp-navy)` in all 9 affected stylesheets (`dashboard`, `excel-upload`, `batch-summary`, `invalid-records`, `batch-processing`, `policy-certificate`, `reports`, `policy-search`, `policy-cancel`).
- **Hardcoded hex color** — `.mp-badge-warning` in `src/styles.css` used a raw `color: #a06a10` instead of a theme token; added `--mp-warning-text` to `src/_theme.css` and pointed the badge at it.
- **Header overflow risk at narrow widths** — `layout/header/header.css`'s `.app-header` was `height: 60px` with no `flex-wrap`, so the brand + welcome text + logout button could overflow horizontally instead of wrapping to a second line on narrow screens. Changed to `min-height` plus `flex-wrap: wrap` and a row gap.
- **Page-header overflow risk** — the `.page-header`/`.dashboard-header` flex rows in `dashboard`, `invalid-records`, `batch-processing`, and `policy-certificate` (title + a back/action button) had no `flex-wrap`, which is a real overflow risk once a long dynamic title (e.g. "Invalid Records — Batch 123") meets a button at 375px. Added `flex-wrap: wrap` + `gap` to all four.
- Every list/grid across the app already had a real "No records found"-style empty state and a loading indicator on initial fetch (verified by reading each component, not assumed) — no missing states found beyond the three new pages, which were built with both from the start.
- Confirmed no other stray hardcoded colors, fixed-width elements, or missing `overflow-x: auto` table wrappers exist outside the two fixes above.

## Progress

- [x] Bootstrap (ground rules, README, .gitignore)
- [x] App shell, theme, auth service/guard/interceptor, login, layout
- [x] Dashboard, CD balance, excel upload, batch summary, invalid records
- [x] Batch processing status, proposal/payment/policy, certificate, bulk print
- [x] Reports, search & print, policy cancel, responsive/visual polish

## Features (all pages built across this build pack)

- Login (JWT auth against MotorPortalAPI)
- Dashboard — product/process selection, CD balance lookup drawer
- Excel Upload — batch upload, sample template download, batch processing kickoff
- Batch Summary — filterable batch list, counters, per-row process/payment/bulk-print actions
- Invalid Records — per-batch invalid row listing and bulk clear
- Batch Processing — live status pipeline, payment tagging
- Policy Certificate — policy detail view, print/download PDF certificate
- Reports — Policy Issue Report export to Excel
- Search & Print Policy — multi-field policy search with print-to-certificate
- Policy Cancel Upload — bulk policy cancellation via Excel upload with per-row results

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

No other known integration-level limitations were found in this pass.
The PF (payment facilitator) confirmation remains simulated on the API
side (`MockPfService`), which is expected and by design for this
environment — the UI already renders whatever real or simulated
response the API returns.
