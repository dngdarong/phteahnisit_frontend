# phteahnisit — Frontend (v0.1 MVP + v0.2, hardened through Phase 5)

## 1. Setup

Unlike the backend package, this one was actually built and verified in
the sandbox — `npm install` and `npm run build` both ran clean (npm
registry is reachable here; Packagist wasn't). To run it locally:

```bash
cd phteahnisit-frontend
npm install
cp .env.example .env   # already done in this package; edit VITE_API_BASE_URL if your backend isn't on :8000
npm run dev
```

Requires the Laravel backend running (`php artisan serve`, default
`http://localhost:8000`) and CORS/Sanctum configured to trust
`localhost:5173` — already set as `SANCTUM_STATEFUL_DOMAINS` in the
backend's `.env.example`.

## 2. Stack, as delivered

Vue 3 (Composition API, `<script setup>` throughout) + Vite + Pinia +
Vue Router + Axios + PrimeVue 5 + Tailwind CSS v4 + Vue I18n — matches
the project overview's tech stack exactly. Two version notes since the
overview didn't pin versions and the ecosystem moved:

- **PrimeVue 5**: `Dropdown` was renamed to `Select` upstream — this
  package uses `Select` throughout, not the older name.
- **Tailwind v4**: config is CSS-first (`src/assets/styles/main.css`
  `@theme` block) rather than a `tailwind.config.js` file. No JS config
  file exists by design, not by omission.

## 3. Directory structure

Matches the project overview's modular layout exactly:

```
src/
  modules/       auth, rooms, landlord, admin, profile — each with a views/ folder
  components/    shared, reused across modules (RoomCard, StatusBadge, AppHeader, AppFooter)
  layouts/       (reserved — v0.1 uses a single App.vue shell; see note below)
  router/        route table + role-based guards
  stores/        Pinia (auth.js)
  services/      one file per backend resource (api.js is the shared axios instance)
  locales/       en.json, km.json + i18n setup
  assets/        styles/main.css (design tokens), primevue-preset.js
```

Note: a `layouts/` folder exists per the spec but is currently empty —
v0.1's UI is simple enough (one header/footer shell for every page,
role differences handled by nav visibility) that a layout-switching
system would be unused complexity. Revisit if the Landlord/Admin
dashboards grow distinct chrome (sidebars, etc.) in a future version.

## 4. Design tokens

Chosen deliberately rather than defaulted, per the brief's "soft green
palette, white background, rounded cards" — see comments in
`src/assets/styles/main.css` for the reasoning:

- **Color**: a 10-step brand green scale (`brand-50`...`brand-900`),
  leaning sage/moss rather than a saturated "go" green, applied
  identically in Tailwind (`@theme`) and PrimeVue
  (`primevue-preset.js`) so both systems read as one product.
- **Type**: Hanuman (Khmer-capable) + Be Vietnam Pro (Latin), loaded via
  Google Fonts. Chosen specifically because this app is bilingual —
  most default Latin-only pairings don't render Khmer script at all.
- **Status color**: pending/approved/rejected each get a fixed
  color+dot pairing (`StatusBadge.vue`), reused everywhere a room's
  status appears (search results for landlords, admin queue, room
  cards) — the one consistent visual signature across the app rather
  than a one-off badge style per screen.

## 5. How the pieces connect to the backend

- `services/api.js` — single axios instance, attaches the Sanctum
  bearer token from `localStorage` to every request, and clears local
  session state on any `401` (covers the backend's `EnsureUserIsActive`
  re-check disabling a token mid-session).
- `stores/auth.js` — thin wrapper over `auth.service.js`; `role`,
  `isAdmin`, `isLandlord`, `isStudent` getters used throughout for
  conditional UI.
- `router/index.js` — guards mirror the backend's permission matrix
  (`meta.requiresAuth`, `meta.roles`) but are explicitly commented as a
  UX convenience only — the API is the real authorization boundary,
  every one of these checks is re-verified server-side.
- Room create/update send `multipart/form-data` (images + fields
  together) matching `StoreRoomRequest`/`UpdateRoomRequest` on the
  backend; update uses Laravel's `_method: PUT` spoofing since native
  `PUT` can't carry file uploads.

## 6. What's built vs. what's scaffolded

Built and functional against the API contract: student/landlord
registration, login/logout, public room search + detail (with
pagination, keyword/province/type filters), landlord's room CRUD
(create/edit/delete with image upload, showing the
approved→edit→pending warning from the business rules), admin pending-
queue approve/reject, admin user list with disable/enable, and a
profile page with optional password change.

v0.2 additionally built: favorites (toggle from `RoomCard`/room
detail), bookings (student request/cancel, landlord approve/reject),
chat (per-room conversation threads, polling-based), and a room map
(pin-list linking out to Google Maps). See
`docs/FRONTEND_ARCHITECTURE.md` section 8 for the full breakdown.
Payments, reviews/ratings, and a standalone notifications system
remain out of scope — no UI scaffolding for any of these exists.

## 7. Hardening (Phases 1–5)

Post-v0.2 hardening pass, no UI redesign or business-logic changes:

- **Phase 2**: booking action handlers (`MyBookingsView.vue`,
  `LandlordBookingsView.vue`) wrap approve/reject/cancel calls in
  try/catch + toast, since the backend can now legitimately reject an
  invalid state transition (422).
- **Phase 3**: `booking.room` / `conversation.room` null-guarded with
  fallback text, matching the backend's soft-delete null-safety fix.
- **Phase 4**: `booking.student` null-guarded in
  `LandlordBookingsView.vue`.
- **Phase 5**: previously-unguarded async flows (room list/map load,
  favorite-toggle, message-send, room delete, user status-toggle) now
  have try/catch + toast error handling; room-approval and
  booking-approval actions gained a `reactive(new Set())` busy-state
  guard against double-submission on a double-click.

## 8. Known gaps to close before this ships

- No `.htaccess`/deploy config — this is a dev-mode scaffold
  (`npm run dev` / `npm run build` only).
- No automated tests (Vitest/Cypress) yet — still true as of Phase 5;
  hardening added error-handling coverage, not test coverage.
- The Khmer translations in `locales/km.json` are a reasonable
  best-effort pass, not reviewed by a native speaker — worth a review
  pass before this is user-facing.
- Toast/confirm dialogs use PrimeVue defaults — no custom styling pass
  applied yet.
