# Map stability audit — revision 4

The existing 1536 × 864 world, HD tile renderer, save fields, quests, assets and game architecture are retained.

## Reviewed geometry

All 27 floor polygons and 30 existing solid footprints were inspected against the current map. The existing grid is retained as a versioned baseline; eight reviewed patches adjust specific object feet and terrace boundaries. Rebuild with `node scripts/rebuild-map-collisions.mjs`.

- Reopened the passage behind the plaza statue. Its pedestal blocks walking; its upper artwork hides actors behind it.
- Added foot collisions for the plaza lamp, seafood street lamp, arcade lamp and dock banner.
- Closed the cafe and market terrace railing bases. The market landing stays accessible behind its railing.
- Preserved the arcade/forge roof exclusions, entrance landings, seafood stairs and the established dock/water boundary.
- Moved Selene from (238,314) to (238,304) for clearance from the terrace railing.

Eight traced foreground polygons supplement the existing ten objects. They cover the plaza lamp, seafood lamp/banner, arcade lamp, dock banner, east dock lamp, cafe rail and east terrace rail. They use the existing HD map renderer, clip to their silhouettes and sort against actor feet.

## NPCs and portraits

All 25 NPCs share a transparent 360 × 450 dialogue render frame with a 12-pixel head margin, preserved aspect ratio and lower fade. Matte removal affects border-connected navy; component cleanup retains meaningful disconnected details such as Hana's face/hair. Original source images remain intact. Hero portrait rendering is preserved.

NPCs found inside newly solid geometry relocate to the nearest valid, unoccupied grid position and clear their stale path. Their dialogue, role and quest state remain intact.

## Validation

- 15,335 of 15,335 standable cells connect to the city.
- All 20 place interaction landings and 25 NPC positions are reachable.
- Roof/water exclusions, the restored statue passage, actual entrance path movement, dock stops and old-save rescue pass.
- All 25 NPCs remain on valid terrain through a 120-second simulation; invalid-position rescue and repeat role actions pass.
- Hero names and legacy/custom save-name migration pass.
- Browser visual checks: all 25 portraits, statue occlusion, 960 × 540 and 844 × 390 landscape viewports.

These are traced 2D collision and foreground shapes over the existing map. Device-specific iOS Safari behavior was not tested on physical hardware.
