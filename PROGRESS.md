# SINAPSA — Progress Checklist

Source of truth: [SRS_Sinapsa.md](./SRS_Sinapsa.md). Update this file at each milestone.

## Milestones

- [x] Read the complete SRS, including Parts 0, 8, 11, 12, and Appendices A–C.
- [x] Backend schema, seed generator, API, tests, and lint baseline are present.
- [ ] Run live Supabase integration requests. **Blocked:** `backend/.env` is not present in the workspace; no Supabase environment variables are available.
- [ ] Phase 2 — Expo setup, theme, navigation, API client, onboarding, and screen skeletons.
- [ ] Phase 3 — Letter library, procedural 3D viewer, TTS, mirror animation, and fallback.
- [ ] Phases 4–7 — Exercise engine, history, dashboard/progress, and all five exercise types.
- [ ] Final backend/mobile verification and local milestone commits.

## Part 12 — Acceptance checklist

### Assignment

- [ ] All application data uses the custom Express API; mobile does not access Supabase directly.
- [ ] Bottom navigation works.
- [ ] Six main pages exist: Beranda, Pustaka Huruf, Latihan, Progres, Riwayat, Profil.
- [ ] At least two list pages open clickable detail pages.
- [ ] Profil/Tentang page exists.
- [ ] Light and dark themes work and persist.
- [ ] Source is committed locally without secrets. Do not push.

### Functional core

- [ ] Onboarding creates a child profile and persists `child_id`.
- [ ] `listen_choose` and `discriminate` complete all attempts, hints, summary, mood, notes, and save flow.
- [ ] Session duration is recorded automatically.
- [ ] Home shows the Monday–Sunday week, trained-day sparkles, totals, last session, target, and recommendations.
- [ ] Letter detail shows rotatable 3D, mirror, TTS, examples, tips, and confusions.
- [ ] d, p, q are exact geometric transforms of b.
- [ ] Progress shows accuracy, totals, frequency, records, and mastery map.
- [ ] History supports view, edit, delete, and mastery recalculation.
- [ ] Recommendations adapt to confusion patterns.
- [ ] All five exercise types are implemented and active.

### UI/UX

- [ ] Both themes use the SRS palette; components do not hardcode hex colors.
- [ ] Letter category colors and ⇄ lookalike indicator match the SRS.
- [ ] Child-facing UI contains no prohibited harsh feedback terms or red styling.
- [ ] Screens handle loading, empty, and error states.
- [ ] Accent buttons use dark text.
- [ ] Motion is gentle and respects Reduce Motion.

### Technical

- [ ] No external photo, video, audio, font, or 3D model assets.
- [ ] Service role key is backend-only and absent from commits/history.
- [ ] Backend unit/integration tests pass.
- [ ] README explains setup, environment, seed, and known limitations.
- [ ] Live Supabase endpoint flow verified.
- [ ] Expo mobile bundle exports successfully.
- [ ] Device-only behavior listed for manual validation.

## Verification notes

- Backend unit tests and ESLint passed before this full build request.
- The live Supabase check has not run because the expected local `.env` file is absent. Never paste or print its values.
