# Marinie City — Development Handoff

## Start here

Repository: <https://github.com/rhain018/marinie-city>, branch `main`.

Playable game: <https://marinie-city-game.dearberry1024.chatgpt.site>.

Continue from the recovered source checkpoint `7ba256ae49bbf10c440777e57f48d8741b57ed23` (saved Site version 156; game label `v1.151`). GitHub source recovery commit: `e1e03a888312965a29f9932d3b90c1344e46c16e`. Read `PROJECT_STATUS.md`, `recovery/SOURCE_MANIFEST.json`, and `recovery/VERIFICATION.json` before further edits. The recovery commit on GitHub preserves the original initial commit as its ancestor. Use `git log` / `git rev-parse HEAD` for the current GitHub commit; a document cannot contain its own eventual commit hash.

## Architecture and entry points

| Path | Responsibility |
| --- | --- |
| `game/index.html` | Authoritative game markup, inline gameplay code, Canvas rendering, HUD, input, world/quest state, dialogue, inventory and story integration |
| `scripts/prepare-game.mjs` | Inlines the existing battle stylesheet and generates `game/html.ts` |
| `game/html.ts` | Generated HTML string served by the framework; regenerate after game HTML or battle CSS changes |
| `app/route.ts` | Root GET response serves the original game HTML with `Cache-Control: no-store` |
| `game/account.js` | Account/cloud panel source; the game also has embedded account code, so inspect both before changing it |
| `app/api/account/route.ts` | Authenticated manual cloud GET/PUT; checks request origin, save fields/size and optimistic revision conflicts |
| `app/chatgpt-auth.ts` | Existing hosted identity helpers |
| `db/schema.ts`, `drizzle/*.sql` | D1 `game_saves` table: stable user ID, JSON data, integer revision, update timestamp |
| `public/assets/` | Original maps, portraits, sprites, music, cinematics, combat and HD-2D assets |
| `public/assets/bakunawa/` | Boss combat presentation and related assets/modules |
| `public/assets/city-hd2d/scene.mjs` | City remake loading, projection, materials, lighting and water-mask integration |
| `public/assets/city-hd2d/harbor-water-v2.bin` | Recovered harbor water mask excluding solid objects |
| `public/assets/hd2d-test/`, `public/assets/map-test/` | Existing developer prototypes and renderer assets |
| `public/map-lab/` | Collision/foreground manifests, inspection tools and sprite-to-model experiments |
| `scripts/checks/` | Existing automated regression checks, including VM fixtures around real game code |
| `checks/` | Historical verification notes; read their limitations before reusing claims |
| `vite.config.ts`, `worker/index.ts` | Vinext/Vite and Cloudflare Worker integration |
| `.openai/hosting.json` | Existing Site identity and D1 binding; preserve exactly |
| `docs/SOURCE_README.md` | Recovered starter/framework setup guide; root GitHub README remains unchanged |

The runtime is the existing HTML5 game served through a Vinext Worker wrapper. It was not converted to a new engine. `package.json` requires Node >=22.13.0 and preserves the existing dependency versions/lockfiles. Build output and runtime credentials are excluded by the existing `.gitignore`.

## Saves and compatibility

- Active device save: `marinie.save`.
- Slots: `marinie.slot.<page>.<index>`.
- Cloud-load safety backup: `marinie.beforeCloudLoad`.
- Gallery: `marinie.gallery`; settings and graphics have their existing separate keys.
- Current `MAP_VERSION` is 2. Existing map-version migration, safe spawn rescue, player name migration and gallery behavior must remain compatible.
- The `?test=city-hd2d` mode uses isolated test storage. Do not let developer tests advance or overwrite story saves.
- Cloud sync is manual. D1 uses the existing Site's stable authenticated user ID and revision checks. A GitHub clone does not migrate the live D1 database or browser saves.
- Keep the same playable origin so existing browser storage and hosted identity remain usable.

## Verification workflow

From the repository root:

```sh
node scripts/prepare-game.mjs
node --test scripts/checks/*.mjs
```

For framework work, use the established installation/build instructions in `docs/SOURCE_README.md` and the existing package scripts. Do not switch package managers or rewrite lockfiles as part of unrelated work. Never commit `node_modules`, runtime credentials, local environment files or generated build directories.

Run focused checks for the changed behavior. Before a release, test both heroes, old saves, save-write failure recovery, menu/scene transitions, boss retry/victory, collision routes, mobile touch input and the HD-2D test's save isolation. Check visuals in Safari on the actual iPhone when available; desktop-sized screenshots do not establish iPhone compatibility.

## Next bounded development task

1. Inspect the latest city remake at native resolution and compare the reported upper Market stair/building curvature with the original map.
2. Distinguish baked artwork distortion from projection and animated displacement. Current boat/pier water-mask checks pass; preserve their exclusions.
3. Make a localized correction using existing artwork/geometry. Keep buildings, roads, boats and solid objects rigid; restrict water animation to water materials.
4. Re-run `city-hd2d.mjs`, `map-audit.mjs`, `entry-edges.mjs`, `save-restore.mjs` and the full existing suite if shared rendering/state changes.
5. Review before/after images, touch-coordinate alignment and occlusion. Keep previous artwork available through the existing artwork switch.
6. Commit the finished change, record tests/limitations, and checkpoint before any further feature work. Update the same Site only through its existing publication workflow when publishing is part of the task.

Do not start a new combat remake or character redesign during visual repair. Preserve quests, original assets, gameplay timing, save compatibility and existing mobile controls.

## Recovery and future interruptions

`recovery/SOURCE_MANIFEST.json` is a complete byte-level inventory of the recovered checkpoint. `recovery/UPLOAD_CHECKPOINT.json` records uploaded/reused Git object progress, and `recovery/VERIFICATION.json` records final checks. Keep source, upload and documentation milestones as separate commits when practical. Push normally, with the current branch head as parent; inspect any concurrent branch change and never force-push.

After an interruption, fetch `main`, read the checkpoint and compare expected Git blob hashes with the remote tree. Reuse matching objects; upload only missing objects. The available GitHub connection supports batch tree creation and individual binary blob creation; ordinary authenticated Git push was unavailable in this recovery. Text additions were batched in Git trees. Unreachable Git objects cannot be enumerated through a normal clone; exact source hashes allow checking and reusing them.

Report missing source files or inaccessible historical work explicitly. Do not infer uncommitted changes from a conversation summary or replace them with newly generated assets.
