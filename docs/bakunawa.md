# Bakunawa Tideborn battle reconstruction

The 1536 × 864 reference uses an elevated three-quarter view. The deck enters from the lower left, turns at the upper-left lantern, and narrows toward broken boards at right. The deep-blue ocean dominates the upper half. Bakunawa faces down-left toward Yhannie, with the back coil behind the swell and foam crossing the neck at water level. The darkest values sit in the sea and mane. Cyan foam, violet magic, and two amber lanterns separate the silhouettes. Floor seams and streaked reflections follow the planks. The left and right HUD groups leave the center open for the boss.

[Object manifest](../public/assets/bakunawa/OBJECT_MANIFEST.json) records approximate reference coordinates and distinguishes reconstructed elements from observations.

## Implementation plan

1. Generate a dock-and-ocean environment plate and a separate transparent dragon plate. The original composite is never used in the renderer.
2. Animate far currents and rear coil behind the boss. Draw the dragon with a waterline mask and a separate animated front crest, then dock-local lights, actors, attacks and near occlusion.
3. Keep the existing Yhannie atlas for movement and add procedural casting, shielding, recoil and victory cues. Document asset-backed versus procedural motion in the animation inventory.
4. Implement a fixed-step encounter with independent HP, MP, position, cooldowns and boss phases. Constrain the player to the deck polygon and prop footprints. Use a shared display and damage geometry for attack telegraphs.
5. Mount the scene as a modal from Developer Test. Reuse the title game audio mixer and asset loader. Entering, restarting and exiting require no story save operations.
6. Validate attack timing, phase thresholds, collision, inputs, cleanup and integration with focused checks and a browser preview where available.

## Shipped assets and motion

- [Animation metadata](../public/assets/bakunawa/ANIMATION_METADATA.json) records the eight generated Yhannie poses, legacy walk/run atlas, animated jaw and neck, boss states, water layers, and spell overlays.
- [Sprite sheet specification](../public/assets/bakunawa/SPRITE_SHEET_SPEC.json) distinguishes shipped assets from per-action atlases specified for future production. The test uses an eight-pose sheet and procedural motion for the dragon, water, magic, and lighting.
- [Sound manifest](../public/assets/bakunawa/SOUND_MANIFEST.json) records the synthesized cues. Sounds use the existing mixer and inherit its SFX and Music settings.
- [Combat simulation](../public/assets/bakunawa/combat.mjs) owns all encounter HP, MP, collision and attack state. The Lv. 7 HUD is a local test preset. It writes no progress to game storage.

## Verification

The automated encounter check exercises the deck perimeter, obstacles, movement and dodge, telegraph damage, shield mitigation, cooldowns and MP, all HP thresholds, win, loss and restart. Existing map, entrance, weather, NPC and hero-name checks were also run. The battle uses a fixed 120 Hz simulation and a render fallback with a reduced effects budget. Real-device frame rates and iOS Safari were not measured.

Chrome preview exercised the main menu entry, arena rendering, spell damage on the boss meter, Pause and Exit, plus the 844 × 390 landscape layout and a switch to a 390 × 844 portrait viewport and back. Physical touch hardware and native iOS Safari / Android Chrome remain unverified.
