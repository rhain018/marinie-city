# Marinie City — Vercel testing

This branch contains the latest game, repaired HD-2D artwork, material masks,
foreground layers and town music from the Sites source checkpoint `214fdd9`.
The original README and GitHub history are preserved.

Import `rhain018/marinie-city` into Vercel. Keep the project root at the
repository root. `vercel.json` selects Other, skips dependency installation,
runs `node scripts/build-vercel-preview.mjs`, and serves `dist-vercel`.
Deploy this testing branch as Preview; the existing Sites deployment is separate.

Open `/?test=city-hd2d` for the repaired map, or `/?menu=developer` for the
Developer Test menu. The root opens the ordinary game menu.

Device saves work on the Vercel origin. Saves from another host are not copied
automatically. The HD-2D map test continues to isolate its progress from story
saves. ChatGPT identity and cloud saves use the Sites-managed server and D1
database, so this Vercel testing build displays a device-save message and hides
unavailable cloud actions. It never trusts forwarded identity headers.

The adapter only changes generated output. It preserves the source game,
Sites backend, save format, maps, characters, quests, combat, cinematics and audio.

## Local checks

```sh
node scripts/build-vercel-preview.mjs
node scripts/checks/vercel-preview.mjs
node scripts/checks/city-repair.mjs
node scripts/checks/map-audit.mjs
node scripts/checks/save-restore.mjs
```
