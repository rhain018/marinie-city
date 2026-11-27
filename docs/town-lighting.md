# Town night lighting

The arcade uses separate cyan and pink sources, sign/cabinet self-emission and gentle bloom. Warm lamps cover the cafe, plaza, market, hotel street and docks; additional shop and window emission regions keep the town lively at night. Rectangles select bright colored pixels from the existing artwork rather than replacing it.

Outdoor moonlight ambient is brighter, night saturation is retained, and edge vignette is reduced. The previous global warm-pixel emission is softened so arbitrary yellow railings do not overpower intentional lighting. Daytime emission stays off, indoor lighting keeps its existing settings, and exterior lights obey the story blackout. The Canvas fallback shares the new lamps and neon aura and uses a brighter night tint.

Validation: actual WebGL scene reviewed in the browser at the arcade at night; cyan/pink banner, cabinet glow, warm forge and street pools are visible with no pixel-renderer compile warning. Emission bounds and inline script syntax checked. Name/save and movement regressions pass. Actual device frame-rate testing remains unverified.
