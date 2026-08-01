# phteahnisit — Frontend (v0.1 MVP)

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

Not built (out of v0.1 scope per every spec doc's "Future
Compatibility" section): favorites, booking, chat, notifications,
reviews, ratings, maps, payments — no UI scaffolding for any of these
exists, intentionally.

## 7. Known gaps to close before this ships

- No `.htaccess`/deploy config — this is a dev-mode scaffold
  (`npm run dev` / `npm run build` only).
- No automated tests (Vitest/Cypress) yet.
- The Khmer translations in `locales/km.json` are a reasonable
  best-effort pass, not reviewed by a native speaker — worth a review
  pass before this is user-facing.
- Toast/confirm dialogs use PrimeVue defaults — no custom styling pass
  applied yet.
