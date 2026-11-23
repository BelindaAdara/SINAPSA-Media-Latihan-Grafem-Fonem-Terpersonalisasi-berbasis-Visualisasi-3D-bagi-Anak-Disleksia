# SINAPSA — Progress Checklist

Source of truth: [SRS_Sinapsa.md](./SRS_Sinapsa.md). Live API results below are reported by the user; `[~]` means implementation exists but still needs device validation.

## Milestones

- [x] Read the complete SRS, including Parts 0, 8, 11, 12, and all appendices.
- [x] Backend schema, seed generator, API, tests, and lint.
- [x] Live Supabase `requests.http` flow — user reports all requested endpoint tests succeeded.
- [x] Phase 2 — Expo setup, theme, navigation, API client, onboarding, and screen skeletons.
- [x] Phase 3 — letter library, procedural 3D viewer, TTS, mirror control, and 2D fallback.
- [x] Phases 4–7 — all five exercise mechanics, session summary, history, dashboard, progress, and profile.
- [~] Final verification — backend/mobile unit tests, backend/mobile lint, Android bundle export, and live API tests passed; EAS/device tests pending.
- [x] Local baseline and app milestone commits created; never push or include `.env`.

## Part 12 — Acceptance checklist

### Assignment

- [x] App data uses the custom Express API under `/api/v1`; mobile has no direct Supabase client.
- [~] Bottom navigation has five tabs; navigation has not been exercised on a physical device.
- [x] Six main pages exist: Beranda, Pustaka Huruf, Latihan, Progres, Riwayat, Profil.
- [x] Clickable details exist for Pustaka Huruf, Latihan, and Riwayat.
- [x] Profil/Tentang page exists.
- [~] Light/dark/system theme selection is implemented and persisted; device behavior pending.
- [ ] GitHub push — explicitly not done per instruction to keep work local.

### Functional core

- [~] Onboarding creates a child profile through the API and persists `child_id`; live creation returned 201.
- [~] `listen_choose` and `discriminate` implement attempts, hints, summary, mood, notes, and save; API save succeeded, device flow pending.
- [x] Session duration is calculated and sent automatically.
- [~] Home renders Monday–Sunday activity, trained-day sparkles, totals, latest session, target, and recommendations; live API passed, device rendering pending.
- [~] Letter detail includes procedural 3D, rotation, mirror, TTS, examples, tips, and confusions; device/WebGL pending.
- [x] d, p, q are exact geometric transforms of b; backend seed tests verify them.
- [~] Progress renders accuracy, totals, calendar/heatmap, records, mastery map, and confusions; live API passed, device rendering pending.
- [~] History supports reading, editing, and deleting sessions; live requests reported successful; visual/device flow pending.
- [x] Recommendations adapt from mastery and confusion data; backend tests pass.
- [x] All five mechanics are implemented and all five are active in Supabase; user verified `GET /exercise-types`.

### UI/UX

- [x] Both theme palettes and letter-category colors use the SRS tokens; no inline hex colors outside theme tokens.
- [x] Lookalike letters are marked and have mirror controls.
- [x] Child-facing UI does not use the prohibited harsh feedback words or hard red feedback styling.
- [~] Loading, empty, and error states exist across data-driven screens; manual screen-by-screen review pending.
- [x] Accent buttons use dark text.
- [x] Sparkle and 3D motion are gentle and check Reduce Motion.

### Technical

- [x] No external photo, video, audio, font, or 3D-model assets are used; unused scaffold PNGs were removed.
- [~] Backend service-role credential is not in mobile files or tracked files; `.env` is ignored and was not inspected or committed.
- [x] Backend tests pass: 17 tests.
- [x] README covers setup, environment, seed, limitations, and EAS APK instructions.
- [x] Live Supabase endpoint flow tested with `requests.http`; see endpoint results in `DECISIONS.md`.
- [x] Android JavaScript bundle exports successfully with Expo.
- [~] Device-only behavior and manual checks remain outstanding.

## Manual checks required on a phone

- Connect on the same Wi-Fi as the backend and verify LAN URL/firewall reachability.
- Complete onboarding, then try each of the five exercise types, including repeated errors, hints, completion, summary, mood, notes, and save.
- Rotate/mirror letters, test text-to-speech, trace every stroke in order, and confirm 2D fallback without WebGL.
- Review both themes, all five tabs, history editing/deletion, progress calendar/heatmap, accessibility labels, and small-screen layout.
- Run EAS APK build and test app flows on a physical Android device.
