# Pole masks, NPC schedules and weather

## Foreground and collision revision 6

Re-traced the plaza anchor banner, dock double banner, seafood banner/post and arcade lamp from full-height HD source regions. Masks include their actual feet. Nonzero fill unions overlapping pole/banner pieces; the statue alone keeps even-odd fill for intentional holes. This fixes cutouts caused by overlapping masks cancelling each other.

Dock and seafood pole foot collisions match the extended silhouettes. All 14,590 standable grid cells remain connected, and all 20 interaction landings and 25 NPC locations remain reachable.

## NPC schedules

All 25 NPCs work during day and dusk. At night, 20 leave the outdoor map; Old Salt, Selene, Kairo, Luna and Mr. Finn remain for night duties/story access. A conversation already in progress may finish. Sleeping NPCs stop updating, drawing, lighting, interaction, crowd blocking and quest badges. Daytime restores home locations with normal collision repair. Existing NPC IDs and quest progress are preserved.

## Weather after Scene 3

Automatic weather unlocks from the current save's `flags.frag` after The Blue Fragment. Each save receives a persistent `weatherSeed`; day count plus phase selects clear/rain/fog deterministically, so refresh/load does not reroll the same period. Day, dusk and night have separate rolls (45% clear, 32% rain, 23% fog). Periods can naturally repeat.

Legacy graphics preferences migrate once to Auto. Advanced graphics retains manual Clear/Rain/Fog options. WebGL uses existing blended rain/fog effects; classic Canvas gets a lightweight fallback. Interior weather is suppressed. Calendar phase includes the weather once unlocked. Gallery replay does not unlock another save's weather.

Validation: production movement/map checks, 120-second NPC simulation, sleeping NPC interaction/collision exclusions, night/day return, weather gating and seed stability, save/name compatibility, source syntax and build. Browser checked the three banner locations, a lamp, night fog, dusk rain and morning NPC return in a 960 × 540 landscape viewport. No physical iOS test was performed.
