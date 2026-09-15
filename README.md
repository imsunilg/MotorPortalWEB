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

## Progress

- [x] Bootstrap (ground rules, README, .gitignore)
- [x] App shell, theme, auth service/guard/interceptor, login, layout
- [ ] Dashboard, CD balance, excel upload, batch summary, invalid records
- [ ] Batch processing status, proposal/payment/policy, certificate, bulk print
- [ ] Reports, search & print, policy cancel, responsive/visual polish
