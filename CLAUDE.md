# CLAUDE.md

## Masters migration rules

### Context

We are porting master data (Settings lists, Languages, Zones & States, Brand & Model, Offer Features, user zone) from a prototype at `/Users/raviharde/Documents/Projects/mh-camp` into this live app.

- The prototype is Next.js/TS and is a **read-only reference**. Relevant files: `lib/masterData.ts`, `lib/types.ts`, `app/masters/*/page.tsx`, `components/ChipRow.tsx`.
- This app has real users and data, so the old app must keep working.

### Rules

1. **Additive only.** Add new files, collections, routes and pages. Do not change existing controllers, existing routes, existing schema fields or existing pages.
2. **Do NOT modify** `backend/routes/masterDataRoutes.js`, `backend/controllers/masterCategoryController.js`, or the `ProductCategory` / `BrandCategory` / `ModelCategory` models. Several pages call `/api/master/*` without credentials: BrandTreasuryList, JobCreate, BrandTreasuryUploader, BrandTreasuryCreatePage, ViewBrandTreasuryPage, MasterDataPage.
3. **Never delete or rename** existing `ProductCategory` / `BrandCategory` / `ModelCategory` documents by script. Jobs, BrandTreasury and documents reference them by `_id`.
4. **New backend APIs** go in `backend/routes/mastersRoutes.js`, mounted at `/api/masters`, with `router.use(authenticate)` (`authenticate` comes from `controllers/userController.js`). Writes also need `requireRole('admin', 'master_admin')`.
5. **New frontend API calls** go in `frontend/src/api/mastersApi.js`, always with `withCredentials: true`. New pages go under `frontend/src/pages/masters/` with routes `/masters/*`. The old `/masterdata` page stays.
6. **Allowed edits to existing files (append-only):**
   - the mount line in `backend/index.js`
   - new `<Route>`s in `App.jsx`
   - a nav link in `Nav.jsx`
   - an optional `zone` field in `User.js`
   - a zone select in `UserForm.jsx`
7. **Code style:** use the existing style: ES modules, Mongoose, Express, React + Tailwind, react-icons.
8. **Git:** one branch per step (`feat/masters-N-name`). Never commit `backend/.env 2`, `.DS_Store` or unrelated lockfile changes. Don't push or merge unless asked.
9. **End of each step:** list the changed files, show `git diff --stat`, and give manual test steps. The test steps must include re-checking the old features: login, users, campaigns, artworks/jobs, brand treasury, `/masterdata`.
