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

## Progress

- [x] Bootstrap (ground rules, README, .gitignore)
- [x] App shell, theme, auth service/guard/interceptor, login, layout
- [x] Dashboard, CD balance, excel upload, batch summary, invalid records
- [x] Batch processing status, proposal/payment/policy, certificate, bulk print
- [ ] Reports, search & print, policy cancel, responsive/visual polish
