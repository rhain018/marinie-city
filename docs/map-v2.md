# Marinie City map v2

Replaces the playable world with the supplied 1536 × 864 map. Original assets remain available and game/map-v1-backup.html retains the prior authored world source.

The editable layout is public/map-lab/map-v2-layout.json. Floor polygons are an explicit whitelist; solidFootprints remove actual props. Runtime collision remains the existing 4-unit foot grid and movement architecture. Seven polygon-masked foreground PNGs are drawn in the existing entity Y-sort, covering the two awnings, two umbrellas, dock roof, statue and dock equipment. These are manual polygon cutouts, not a complete pixel-level segmentation of every object.

All valid foot-grid cells are connected. Door landings, quest pickups, and hotel spawn positions pass mapStand. NPC starts and patrol endpoints were moved onto reachable cells. Old-image decorative overlays are disabled for this map; their assets remain preserved.

Save mapVersion 2 preserves character stats, inventory, equipment, flags, quests and gallery state. Outdoor saves from prior map versions resume safely at the hotel landing. Bedroom saves retain their room. No account schema changes.

Validation: production build, inline JavaScript syntax, floor connectivity and objective placement checks. Browser QA is recorded separately; actual iPhone Safari testing requires the device.

## Water and clarity correction
Water is now a conservative positive open-ocean mask, independent of collision. Shoreline objects and boats remain static. The GPU uses nearest mask sampling and rejects refraction samples crossing the mask boundary. Canvas ripple and fish drawing is clipped to the same mask. Rooms retain their indoor water-disable branch.

The map uses the exact uploaded JPEG instead of an additional lossy WebP conversion. Magnified map pixels and foreground crops use nearest sampling; minified rendering retains high quality filtering. This improves crispness without inventing texture detail or altering object geometry. Source resolution remains 1536 × 864; this is not a newly redrawn 4K asset.

## Arcade roof correction
Added solid footprints for the arcade roof/body and neighboring forge structure; verified all remaining 16,705 valid foot cells form one connected region and all interaction landings and quest pickups remain accessible. Patrol destinations snap to valid floor. Existing save loading calls unstick to recover blocked positions.

Corrected GPU world dimensions from legacy 1536×1024 to MW×MH (1536×864), so water and shadow masks align with the new map. Outdoor zoom levels now 1.4, 1.8 (default), 2.2 and full map to reduce source-pixel enlargement. The source image is still 1536×864.

## Full-resolution map integration
Installed the supplied 6688×3776 map as 28 lossless WebP tiles plus a lightweight overview. Tile pixels are checked against the original PNG. World coordinates remain 1536×864, preserving the architecture and progress schema. Foreground occluders now crop the shared full-resolution map at render time; they reuse the same visible tile cache as the map. Up to 20 tiles are retained, avoiding a separate 100 MB full-map decode for every layer. Original assets remain available.

Audited the visual floor whitelist and physical footprints. Added the second pier and lower east promenade, kept the upper east walkway above its railing, and corrected dock shop/kiosk, lamppost, tree-root and seawall footprints. Ten foreground outlines cover awnings, umbrellas, roof, statue, equipment, tree, lamp and fishing-port sign. Outlines are manual polygon masks, not a claim of per-pixel segmentation.

Checks: 17,008 standable 4-unit grid cells are connected; all NPC starts/routes, doors, quest items and safe hotel positions remain standable. Arcade/forge roofs, dock shop and pier kiosk regression points are blocked. Inline JavaScript syntax and full production build are checked. Device-specific mobile memory and frame-rate testing still requires the target iPhone.

## Entry and dock regression fixes
Arcade cabinet collision now extends to its visible base; the player approaches at (970,590). The forge has a full art-sized click target and a clear landing at (1090,584). Outdoor Torin stands to the east of the landing to keep the approach and Enter action clear. Building exit points remain six units below these safe landings.

The large dock and pier floor masks now stop before the front rim. Collision includes the front of the feet, preventing the sprite from stepping onto the outer tire/piling edge. Rope and net quest targets and Bert's start point were moved onto safe deck. The southwest arcade corner remains a connected paved path.

Save recovery scans for the nearest standable point, including positions farther than the old 80-unit rescue limit, and resets movement interpolation and velocity after relocation. Stats, quest flags and inventory are preserved. All 15,464 valid foot cells are connected.

Run node scripts/checks/entry-edges.mjs to exercise actual game movement and pathfinding for forge/arcade entry and exit landings, NPC clearance, clickable building targets, dock boundary stops and invalid-save rescue.
