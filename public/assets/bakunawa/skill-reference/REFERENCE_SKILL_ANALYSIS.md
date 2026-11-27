# Bakunawa: Tideborn skill reference

## Source and extraction

The supplied reference is a 6688 × 3776 RGB presentation sheet. It has four horizontal animation strips; each strip contains eight square illustrations, panel borders, captions, numbers, and ornamental dividers. It is not a production atlas and has no alpha channel. The four playable atlases in this folder were extracted from the eight illustrations per strip. Each frame was aligned to a 468 × 468 cell, the panel margins and number labels were cropped away, and a soft navy matte was applied to make the illustration background blend into the battle ocean. The source pixel-art and painted effects were retained; no new frame artwork or external assets were substituted.

Frame bounds are estimated from the displayed 1600 × 904 sheet for extraction. The original source dimensions and exact source/cell coordinates are recorded in `ANIMATION_MANIFEST.json`. Source-confidence is high for the visible sequence and color/shape progression, and medium for precise frame edges because the sheet contains dark artwork backgrounds and decorative panel rules.

## Observed strips

| Strip | Reference position (1600 × 904 preview) | Eight-stage visual progression | Gameplay placement |
|---|---:|---|---|
| Abyssal Roar | y≈180–292 | Bakunawa head, open jaw, cyan eyes, violet throat flare, concentric violet/cyan shockwave, expanding ring | Screen-blended at the boss/head area; played during the existing `burst` wind-up and impact |
| Tidal Cataclysm | y≈359–486 | Low disturbance, small curling blue crest, rising cyan wave, large foaming curl, white-blue crash and spray | Screen-blended over the dock/water lane; existing stripe warning and damage zone remain authoritative |
| Maelstrom Prison | y≈535–662 | Flat ripple, rotating blue-violet spiral, widening ring, lifted water walls, cylindrical prison, bright arc at peak | Screen-blended around the attack target; existing vortex hazard, pull, and dodge behavior remain authoritative |
| Stormfang Lightning | y≈712–844 | Bakunawa horn/mane charge, branching electric arcs, mouth discharge, blue-violet strike and impact splash | Screen-blended from boss toward the target; existing target circle, lightning bolt, damage and hurt reaction remain active |

The sheet gives no measured timing, world-space pivots, collision geometry, or audio. The implementation therefore uses its eight panels as key poses, maps the first four across the battle warning and the last four across the impact, and interpolates adjacent frames for smooth transitions. Existing combat hitboxes, warning duration, and damage are not inferred from the art.

## Runtime and limitations

`battle.mjs` loads the four local WebP atlases with the existing battle art. `render.mjs` selects the matching strip from the active boss attack and blends consecutive source frames without stretching the square frames. Canvas `screen` compositing lets the extracted luminous art sit over the existing water and boss layers. The effects inherit the current quality setting; the low setting uses reduced opacity, and all gameplay hit checks remain in `combat.mjs`.

Because the source illustrations include colored ocean/backdrop pixels behind the effects, the matte is an approximate color key. The result keeps original art and avoids opaque card rectangles, but tiny dark-blue halos or softened dark linework may remain on close inspection. The original sheet does not include sound; skill-specific cues use the game's existing Web Audio synthesizer.
