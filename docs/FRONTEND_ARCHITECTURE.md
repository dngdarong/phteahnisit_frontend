# phteahnisit — Frontend (v0.1 MVP + v0.2)

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
                 v0.2 adds: favorites, bookings, chat (each with its own views/ folder,
                 same convention as the v0.1 modules)
  components/    shared, reused across modules (RoomCard, StatusBadge, AppHeader, AppFooter)
  layouts/       (reserved — v0.1 uses a single App.vue shell; see note below)
  router/        route table + role-based guards
  stores/        Pinia (auth.js)
  services/      one file per backend resource (api.js is the shared axios instance)
                 v0.2 adds: favorite.service.js, booking.service.js, chat.service.js
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

### 4.1 v0.2 palette update

Blended with the Claude Design mockup's own token system (warm
cream/white surfaces, rounded-card layout warmth) but with the
mockup's mint-green/terracotta color story swapped for this project's
established sage-green primary and a muted-gold accent:

```
bg #F7F2E9  bg-2 #EFE8DA  surface #FFFFFF  surface-2 #FBF6EC
ink #211F1A  ink-2 #4A4538  mute #857E70  line #E7E0D0 (the mockup's "border")
primary #3F7D57  primary-d #2C5C3E  primary-l #DCEBDF
accent #C99A3D  accent-l #F5E9CE
```

Added as new `@theme` tokens in `main.css`, alongside — not replacing
— the existing `brand-*` scale. `brand-*` was re-anchored to the same
`primary`/`primary-d`/`primary-l` values (it turned out nearly
identical to the old v0.1 green already) so every existing
`text-brand-900` / `bg-brand-50` class across ~15 v0.1 components kept
working unchanged; only the shade shifted slightly, not any class
name. `body`'s background moved from `bg-white` to the new `bg-bg`
cream. The named tokens (`bg`, `surface`, `ink`, `mute`, etc.) are
available for new v0.2 components to opt into explicitly but weren't
force-retrofitted onto every existing v0.1 element — see the "known
gaps" note below.

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

At v0.1, out of scope per every spec doc's "Future Compatibility"
section: favorites, booking, chat, notifications, reviews, ratings,
maps, payments. v0.2 (section 8 below) built four of those; payments,
reviews/ratings, and a standalone notifications system remain out of
scope.

## 7. Known gaps to close before this ships

- No `.htaccess`/deploy config — this is a dev-mode scaffold
  (`npm run dev` / `npm run build` only).
- No automated tests (Vitest/Cypress) yet.
- The Khmer translations in `locales/km.json` are a reasonable
  best-effort pass, not reviewed by a native speaker — worth a review
  pass before this is user-facing.
- Toast/confirm dialogs use PrimeVue defaults — no custom styling pass
  applied yet.
- The new v0.2 named palette tokens (`bg`, `surface`, `ink`, `mute`,
  `accent`, etc.) are defined and used in the new v0.2 views, but v0.1
  components were left on the recolored `brand-*` scale rather than
  migrated wholesale — a future pass could adopt the named tokens
  everywhere for full consistency, but that was out of scope for a
  feature-addition release.

## 8. v0.2 additions — Favorites, Bookings, Chat, Map

Four new modules, each following the exact pattern of the v0.1
modules: a `views/` folder, a dedicated service file, route entries
with `meta.requiresAuth`/`meta.roles`, and full bilingual coverage.

- **`modules/favorites`** — `FavoritesView.vue`, a saved-rooms grid
  reusing `RoomCard`. The favorite toggle itself lives *inside*
  `RoomCard` (a `show-favorite` prop), not as a separate component,
  since it needs to appear inline on cards across search results, the
  favorites list, and the room detail page alike.
- **`modules/bookings`** — `MyBookingsView.vue` (student: list +
  cancel own pending requests) and `LandlordBookingsView.vue`
  (landlord: approve/reject requests on their own rooms, structured
  identically to `PendingRoomsView.vue`'s approve/reject-with-reason
  dialog pattern). The booking request form itself lives inline on
  `RoomDetailView.vue` rather than a separate route, since it only
  makes sense in the context of a specific room already being viewed.
- **`modules/chat`** — `ConversationsView.vue` (thread list with an
  unread-count badge) and `ConversationView.vue` (a single thread).
  Realtime is **polling**, not websockets — the project has no
  websocket dependency (Pusher/Echo/etc.) and adding one for a v0.2
  feature felt like more infrastructure than the feature warranted;
  `ConversationView` polls `GET /conversations/{id}` every 4s while
  mounted and clears the interval on unmount. The "Message landlord"
  entry point lives on `RoomDetailView.vue` (student only) and, on
  first send, redirects into the newly-created conversation thread.
- **Map** — `modules/rooms/views/RoomMapView.vue`, a pin-*list* (not an
  embedded map). No map SDK dependency (Leaflet/Mapbox/Google Maps JS)
  was added — each entry links out to Google Maps' web search URL with
  the room's coordinates instead. This was an explicit scope decision,
  not an oversight: the original v0.2 brief asked to flag rather than
  silently add a new third-party dependency, and a simple list already
  satisfies "browse rooms with a pinned location" for v0.2.
- **`RoomFormView.vue`** (v0.1, extended) — gained optional
  latitude/longitude number inputs so a landlord can pin their room's
  location when creating or editing it.
- **`AppHeader.vue`** (v0.1, extended) — gained role-gated nav entries
  (Favorites/My bookings for students, Booking requests for landlords,
  Messages for everyone authenticated) in the profile dropdown, plus a
  public "Map" link visible to guests too.
