# Marinie City 2.5D Stage 3 — optional occlusion draft

Added five original-art alpha-mask layers to the existing Y-sorted `OCC` rendering system: lighthouse upper section, blue dock hut roof, red and blue pier umbrellas, and east harbor boat cabin. Original art resolution is preserved (2 image px per game-world px). New source slices are in `public/assets/layer25d-stage3-*` and the metadata and aligned composite are in `public/map-lab/`.

Disable **new** layers with `?layers25d3=off`. Disable **stage 1** layers with `?layers25d=off`. No ground, collision, quest, sprite, NPC, save, or engine changes.

## Testing
1. In game, walk player in front of and behind each new object. Check for masking overlap and pixel-edge seams.
2. Toggle `?layers25d3=off` and compare to existing version.
3. Check iPhone landscape performance and touch controls.
4. Polygon masks are **drafts**, not guaranteed perfectly aligned. No browser/mobile runtime QA has been performed for this package.

This is a layer-only update; it is NOT full 3D reconstruction, and no extra true detail was invented by cropping.
