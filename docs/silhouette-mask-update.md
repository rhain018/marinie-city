# Silhouette and solid-surface correction

Revision 5 retains source assets and save fields. Foreground masks are cached `Path2D` shapes over the existing HD tile renderer, rather than generated replacement artwork.

- Statue: replaced its broad angular polygon with a curved outline traced against the HD map. Separate transparent holes preserve the spaces between its raised arm and legs. The pedestal's collision and depth baseline match its lower plinth.
- Plaza double lamp: separate stem, crossbar and lantern silhouettes leave open air transparent.
- Other street lamps and banners: separated the narrow stem and head/banner shapes instead of filling the gap between them.
- Terrace rails: separate bars, pickets and posts instead of a solid filled panel.
- Added the plaza anchor banner and kiosk to the foreground pass.
- Closed the stone faces under the east terrace and tunnel bridge, City Hall planter bases, cafe corner pot and arcade/dock equipment bases. Existing routes remain connected.

The immutable collision baseline plus reviewed changes are stored in `public/map-lab/collision-revision5.json`. `node scripts/rebuild-map-collisions.mjs` reproduces the runtime grid.

Validation: all 14,621 standable cells connected; 20 interaction landings and 25 NPC positions reachable; production movement around all four statue sides; entrance/dock/save rescue checks; 120-second all-NPC simulation; hero-name/save compatibility checks; script syntax and build. Browser inspection at high zoom in a 960 × 540 landscape viewport covered statue left/rear/front, lamp, seafood frontage and dock equipment. Physical iOS hardware was not available.

These are manually traced 2D masks; they do not convert the flattened artwork into a 3D scene. Further object-specific reports can be corrected against the same source coordinates.
