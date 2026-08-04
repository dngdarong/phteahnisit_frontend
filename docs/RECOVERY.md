# Frontend Recovery

The frontend has no database and no persistent server-side state — the
only thing to "recover" is the deployed static build.

## What recovery means here

The `dist/` build output is fully reproducible from source: given a git
commit and the matching `.env` (`VITE_API_BASE_URL`), `npm ci && npm run
build` deterministically regenerates it. There is nothing stateful to
back up beyond the git history itself, which already lives on GitHub.

## Recovery procedure

1. Identify the last known-good git tag (e.g. `v0.3.2`) or commit.
2. `git checkout <tag-or-commit>`
3. `npm ci` (not `npm install` - `ci` installs exactly what
   `package-lock.json` specifies, matching the build that was verified
   at that commit)
4. Confirm `.env` has the correct production `VITE_API_BASE_URL`.
5. `npm run build`
6. Deploy the resulting `dist/` to the hosting target, replacing the
   broken deployment.

## Rollback

Rolling back is the same procedure pointed at an earlier tag/commit —
there's no database migration state to reconcile, so a frontend
rollback is never blocked by a backend rollback (or vice versa) unless
the two are on genuinely incompatible API contracts.

## What this does NOT cover

CDN- or hosting-provider-specific rollback mechanics (e.g. "redeploy
previous build" buttons some static hosts offer) are not documented
here since this repo has no evidence of which provider will be used —
see `RELEASE_NOTES.md` / the Phase 8 report for the generic
static-host deployment requirements (SPA rewrite rule, HTTPS, build-time
env var).
