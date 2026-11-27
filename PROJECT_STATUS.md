# Marinie City — Project Status

Recovery date: 2026-11-27 (Asia/Dubai).

## Verified recovery source

- Latest complete ZIP located: `Marinie-City-v1.151-Complete.zip`, 123,316,797 bytes; ZIP CRC verification passed. It contains 695 files, totaling 134,233,536 uncompressed bytes.
- A newer, exact source checkpoint was recovered from the existing game's source repository: `7ba256ae49bbf10c440777e57f48d8741b57ed23`, corresponding to saved Site version 156.
- The newer checkpoint contains **697 tracked files / 132,910,616 bytes**. It is the authoritative recovery source. The in-game version label remains `v1.151`; Site version numbers and game labels are separate.
- The older ZIP lacks the harbor water mask, its generator, and the save-restore regression script. Six existing files also differ. Its extra `public/index.html` is absent from the newer tracked source and was not reintroduced.
- GitHub's starting `main` commit was `4dc52649121531a465e865d481c806944c1d792f`, with only `README.md` reachable. Its README and history are retained. The source README is preserved as `docs/SOURCE_README.md`.
- `recovery/SOURCE_MANIFEST.json` records every source path, repository path, size, Git blob SHA, and SHA-256. Recovery does not alter game source or assets.

GitHub source recovery checkpoint: `e1e03a888312965a29f9932d3b90c1344e46c16e` (698 repository files, including the preserved GitHub README). The documentation checkpoint follows this commit.

## Existing features preserved

| Area | Recovered implementation |
| --- | --- |
| Game engine | Existing HTML5 Canvas game in `game/index.html`, generated response in `game/html.ts`, original game loop and state |
| Characters | Loki and Yhannie designs, sprites, portraits, automatic/custom names, combat animations and VFX |
| World | Existing town, docks, market, lighthouse, hotel/interiors, collision grid, pathfinding and foreground occlusion |
| NPCs | Existing dialogue, routes and actions; 25 NPC locations covered by checks; day/night sleeping rules and birds |
| Story | Main/side quests, Broken Fishing Nets, bell cinematics, Bakunawa encounter, Chapter 1 ending assets and gallery |
| Combat | Loki/Yhannie attacks, skills, ultimates, boss telegraphs, damage timing, dodge/cancel rules and practice tools |
| HD-2D | Developer test maps, city remake, projection/inverse tap mapping, foreground data, harbor material mask, lighting and model experiments |
| Audio | Existing music, ambience, skill sounds and cinematics; combat and harbor music transitions |
| Persistence | Existing device saves/slots/gallery, legacy name handling, safe cloud-load backup/restore and manual cloud sync |
| Mobile | Existing landscape HUD, joystick, action controls and fullscreen behavior retained byte-for-byte |

These are implementation inventory statements. Automated checks below cover specific behavior; they do not replace a full story playthrough or physical iPhone testing.

## Validation performed in this recovery

- Existing `node --test scripts/checks/*.mjs`: **20 passed, 0 failed**.
- Coverage includes save-write failures and rollback, duplicate-load prevention, legacy names, character/HUD consistency, world connectivity, railing/stair collisions, NPC schedules, weather, combat damage/cancel windows, renderer smoke frames, music transitions, city projection and water-mask exclusions for boats/piers.
- All **101 tracked `.js`/`.mjs` files** passed `node --check`.
- All **3 inline JavaScript blocks** passed syntax checks; the separate JSON import map parsed successfully.
- Regenerating `game/html.ts` with `node scripts/prepare-game.mjs` produced no diff from the recovered checkpoint.
- All 390 raster images passed Pillow verification; 35 JSON files parsed; 14 GLB containers, one WebAssembly module header and four MP4 container headers passed structural checks. Audio/video playback was not tested by these container checks.
- Repository integrity is checked using the source manifest and Git object hashes. See `recovery/VERIFICATION.json` for the final recorded results.
- No dependency reinstall, full framework rebuild, authenticated production cloud round-trip, browser playthrough, or physical iPhone test was performed in this recovery. Runtime code and lockfiles were not changed.

## Known issues and pending verification

| Priority | Item | Evidence / next action |
| --- | --- | --- |
| High | Upper Market stairs/building perspective still appears slightly curved | User report from previous conversation; inspect the latest artwork at native scale before editing. Earlier promenade/lower stair fixes are in the recovered checkpoint. |
| High | Confirm boat and solid-object stability visually | Current water-mask tests pass for boat/pier exclusions. Check the moving image on iPhone Safari; do not apply full-scene water displacement. |
| High | Physical iPhone landscape regression | Verify joystick drag, dodge, tap projection, safe areas, fullscreen, menus, both heroes and post-boss controls. |
| Medium | Authenticated cloud-save round-trip | Earlier `checks/account-cloud.md` explicitly leaves hosted authenticated testing unverified. Verify save/load/backup and revision conflicts with the existing account. |
| Medium | Foreground mask edges | `checks/2point5d-stage3.md` calls some polygon masks drafts. Check seams around roofs, umbrellas, boat cabin, lamps and poles. |
| Medium | Full Chapter 1 and gallery playthrough | Verify prerequisites, checkpoint retry, rewards and replay isolation on both heroes. Automated combat checks are not a complete story playthrough. |
| Low | Legacy experimental tools and starter components | Preserved intentionally. Review usage only as a separately scoped cleanup; do not remove assets during recovery. |

## Preservation constraints

Do not rebuild the game, redesign Loki/Yhannie, substitute unavailable assets, change save keys/schema, reset player progress, force-push, or replace the existing playable URL. The existing hosted game remains at <https://marinie-city-game.dearberry1024.chatgpt.site>; recovery does not publish a new Site version or change its audience.

## Missing or inaccessible historical material

The earlier conversation's exact 150-blob receipt list and any uncommitted workspace-only changes could not be retrieved. Existing remote objects were tested directly by source SHA instead. Every file from the verified 697-file source is accounted for; no replacement artwork or code was invented. Claims from older conversations that are not covered by current files/checks remain historical reports.
