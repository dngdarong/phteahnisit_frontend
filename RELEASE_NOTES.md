# Release Notes — Frontend

## v0.3.2 (current)

Covers the hardening, QA, and performance work done on top of the v0.2
feature baseline (Favorites, Bookings, Chat, Map). No UI redesign or
business-logic changes in this entire sequence unless a phase
explicitly says otherwise below.

### Phase 1 — Security Hardening
Backend-only; no frontend changes.

### Phase 2 — Booking Workflow Hardening
Booking action handlers (`MyBookingsView.vue`,
`LandlordBookingsView.vue`) wrap approve/reject/cancel calls in
try/catch + toast, since the backend can now legitimately reject an
invalid state transition (422).

### Phase 3 — Room Lifecycle & Data Integrity
`booking.room` / `conversation.room` null-guarded with fallback text,
matching the backend's soft-delete null-safety fix.

### Phase 4 — API Standardization
`booking.student` null-guarded in `LandlordBookingsView.vue`.

### Phase 5 — Frontend Stability
Previously-unguarded async flows (room list/map load, favorite-toggle,
message-send, room delete, user status-toggle) gained try/catch + toast
error handling; room-approval and booking-approval actions gained a
`reactive(new Set())` busy-state guard against double-submission on a
double-click.

### Phase 5.6 — Release Hygiene
`.env` untracked from git (physical file untouched), `.gitignore`
entries for env files, stale README/architecture-doc corrections.

### Phase 6 + 6.1 — QA Foundation & Coverage Expansion
No test framework existed at all going into this phase. Installed
Vitest, Vue Test Utils, jsdom, coverage-v8, and Pinia testing utilities
(devDependencies only, zero production bundle impact). 19 test files,
101 tests, targeting the highest-risk untested logic: the auth store
and its localStorage persistence, the axios interceptor's
401-vs-other-error handling, and the double-submit guards and
null-relation fallbacks added in Phases 3–5 across bookings, favorites,
messaging, room detail, and admin moderation. Deliberately left
low-value targets (map view, trivial wrapper views, static footer)
uncovered rather than padding the number.

**Result: 101/101 Vitest tests passing, 68.69% statement coverage**
(up from 0%).

### Phase 7 — Performance Optimization
Audit found route-level code splitting, filter debouncing, polling
cleanup, and PrimeVue tree-shaking were already in place from prior
phases — little to fix. Two safe, evidence-based changes applied:

- `RoomDetailView.vue`'s image gallery was missing `loading="lazy"` on
  its two `<img>` tags — added, purely additive, no visual change.
- Vue/Vue Router/Pinia/Axios were bundled into the main entry chunk
  instead of a dedicated vendor chunk, meaning every app-code deploy
  invalidated the browser cache for rarely-changing dependency code
  too. Added `manualChunks` in `vite.config.js` to isolate them into
  `vendor-*.js` (186.66 kB / 70.61 kB gzip). Net first-load bytes are
  essentially unchanged — the win is cache stability across deploys,
  not a smaller initial payload.

No UI/UX changes, no API changes, no test-file changes. 101/101 tests
passing throughout; production build independently verified.

---

## Current status (as of v0.3.2)

- **Tests**: 101/101 Vitest tests passing, 68.69% statement coverage
- **Build**: `npm run build` succeeds, vendor code now cache-isolated
  from app code
- **UI/UX**: unchanged since v0.2
- **API usage**: unchanged since v0.2

## Earlier history

- **v0.2** — Favorites, Bookings, Chat, room Map features added.
- **v0.1** — Initial MVP (auth, room search/list/detail, landlord room
  CRUD, admin moderation, profile).
