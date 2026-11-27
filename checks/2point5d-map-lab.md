# Marinie City — HD 2.5D Integration Audit (2026-11-08)

## Verified architecture
- Game is an existing web app with one large HTML/canvas RPG, backed by the original authored map `public/assets/85831fd94f7e47.webp` (3072×2048 image, 1536×1024 world).
- 384×256 collision grid (`GRID`/`GBITS`), 4 world pixels per cell, preserved unchanged.
- `mapStand` checks a five-point character footprint; collisions are more detailed than an image-only pass.
- Existing WebGL shader includes dynamic light / shadows, water effects and other effects; game has Y-sorted characters and foreground sprites.
- Existing save/account/quest/camera code has NOT been rewritten.

## New deliverables
- `/map-lab/`: non-destructive visual geometry inspector (open on the same host).
- `collision-grid.png`: extracted directly from existing walkability data, green/teal walkable vs red blocked.
- `landmarks.json`: manually identified major areas for editor review; approximate points, not collision polygons.
- `concept-2point5d.png`: generated visual direction concept only. It is *not* pixel-aligned with the playable original and is deliberately not used for runtime art.

## Next steps for true 2.5D integration
1. Isolate polygon masks and separate transparent foreground from the **original aligned image**, not the concept.
2. Confirm player foot anchors and obstacle footprints around seafood, bridges, building eaves and dock railings.
3. Keep existing WebGL lighting; add authored per-object height/normal maps only where they add value.
4. Test routes at 1x/2x camera zoom and iOS Safari 16:9 landscape.
5. Only then replace ground and overlay tiles in the actual runtime, preserving coordinate and save compatibility.

## Scope and limitations
- No changes to the live playable map or game mechanics; this is a visual analysis / pre-integration package.
- No full automatic object segmentation, usable 3D meshes, new collision geometry, or iOS browser QA has been completed.
- The game's original 3072×2048 source map is already HD; do not upscale it blindly.

## Stage 2 — draft pixel-aligned foreground masks
- Six manually outlined, registered object overlays were extracted pixel-for-pixel from the original 3072×2048 map art.
- Existing OCCI/`drawEntities` Y-sort pipeline loads them as additional occluders, rather than replacing the renderer.
- No collision-grid changes, sprite changes, quest changes, save changes, or new engine dependencies.
- Known limitations: draft polygon edges may capture neighboring pixels; behind-object occlusion and mobile performance require live visual testing. These are image slices, not true reconstructed 3D geometry or AI-derived precise segmentation.
- Inspect object overlays and outlines in `/map-lab/`; adjust manifest polygon coordinates and regenerate after QA.
