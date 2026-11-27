# Marinie City 2.5D aligned layer pass 01

This update uses four pixel-aligned foreground slices of **the existing playable source image**, rather than replacing the playable terrain with an AI-generated concept.

## New artwork
- Seafood awning facade
- Market storefront awning
- Game shop facade
- City Hall portico

All objects are exported as transparent PNG at 2x world-space resolution; authored world x/y positions are in `layers25d.json`. Layers are loaded into the existing `OCC` Y-depth list, not a new rendering engine. The base image, NPC paths, walkability grid, saved progress, quests, user interface and transitions remain unchanged.

## How to verify
- Launch existing game. Move the player in front of/behind these buildings; check for appropriate cover.
- Add `?layers25d=off` to the game URL to compare with original behavior.
- Open `/map-lab/layers25d-overlay.png` for the aligned transparent overlay and `/map-lab/layers25d.json` for geometry.
- Do not replace game background with `concept-2point5d.png` as it does not share the exact geometry.

## Honest limitations
- This is a **first limited foreground extraction**, not complete map-wide AI instance segmentation, PBR normals, actual 3D geometry, or new collisions.
- Source artwork retains the original image detail only; cropping cannot invent extra authentic resolution.
- Polygon masks are reviewed approximations, and game-device QA is not yet performed.
- Runtime browser checks and iOS landscape checks remain pending.
