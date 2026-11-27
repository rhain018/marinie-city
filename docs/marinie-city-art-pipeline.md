# Marinie City art pipeline

Use Seafood Wharf in **Developer Test → 2.5D Map Test** as the first review scene. Establish the look at Dusk, then check Day and Night at the same framing. Use the original Marinie City art, character design sheets, map placements, and gameplay collision as the source of truth.

## Visual direction

| Style reference | Application in Marinie City | Production cost |
| --- | --- | --- |
| [Cinematic pixel painting](https://homkathon.gokoding.com/styles/cinematic-pixel-painting) · Eastward and Little Witch in the Woods | Detailed environments, readable walkable surfaces, warm amber lamps and windows, cool blue water and shadows | Original pixel artwork, coherent scale, and carefully masked silhouettes |
| [HD-2D](https://homkathon.gokoding.com/styles/hd-2d) · Octopath Traveler and Eastward | Pixel characters in a lit 3D diorama. Give pier edges, stairs, and selected props real depth. Keep walkable surfaces and characters sharp | Meshes, pixel textures, lighting, and mobile performance checks |
| [Anime cel 2.5D](https://homkathon.gokoding.com/styles/anime-cel) · Guilty Gear Strive | Borrow held poses, clear shadow shapes, and impact timing for the existing character sprites and cut-ins | Authored key poses, effects, and timing for each skill |

Review **values first, then palette, then detail**. Read the character and walking route in grayscale before grading the full palette. Inspect the pixel scale, cutout edges, and filtering at normal gameplay zoom. Fix the largest visible issue before adding effects.

Use original project art and the existing licensed dependencies. For further reference, see the [Guilty Gear Xrd art direction talk](https://www.youtube.com/watch?v=yhGjCzxJV3E) and the catalogue's [2.5D water reflection example](https://x.com/Cyanilux/status/1770095395848237506).

## 1. Extract and review sprites

Work from the original artwork at native pixel scale and prefer existing clean isolated layers when available. See [Wharf placement data](../public/assets/map-test/wharf-data.mjs) and [model source regions](../scripts/wharf-model-sources.mjs). Record the source revision, asset ID, crop rectangle in the 1536 × 864 map space, working image scale, foot or attachment pivot, and placement elevation.

1. Trace the visible object boundary. Use separate masks for disconnected parts. Cut out openings such as the tire center, stool leg gaps, and spaces between boat ropes. Keep canopy tips, lantern brackets, and original lettering intact.
2. Export a transparent RGBA PNG. Preserve source colors inside the mask and use nearest-neighbor sampling if scaling is needed. Leave a small transparent margin. If the crop is trimmed, subtract the trim offset from the image-space pivot, then apply any resize and padding offsets.
3. Compare source, mask, and cutout side by side at native scale and enlarged nearest-neighbor zoom. Use a light, dark, and checkerboard background to expose stray pavement, wall pixels, water, cast shadows, and halos. Check thin parts and intentional holes.
4. Record hidden or inseparable surfaces for art review. Review the boat hull and cabin apart from the painted waterline and rigging. Check the café stools and tables where they overlap the umbrellas.

Start with the lantern, barrel, and seafood sign, then check the canopy edges, fender opening, menu stand legs, and boat waterline. The [Sprite2Model inventory](../public/map-lab/sprite2model/catalog.json) contains draft models and source notes. A high silhouette coverage score describes how well conversion fits the supplied sprite. Crop approval requires reviewing the PNG against the source art.

## 2. Convert approved sprites with Sprite2Model

Use **Developer Test → Sprite2Model** for individual PNGs and four-side previews. For batch generation on a future art worktree, use the existing [Wharf builder](../scripts/build-wharf-models.mjs) after reviewing the masks.

| Source shape | Initial reading | Review |
| --- | --- | --- |
| Barrel, bollard, umbrella canopy | Round | Rim, base, and thickness from the side |
| Cabinet or crate | Box | Front proportions, depth, and back face |
| Sign, banner, or trim | Cut-out or an authored mesh | Exact outline, attachment point, and readable lettering |
| Flat inventory art such as Loki's sword | Flat item / sword | Grip pivot, silhouette, and facing |
| Boat, storefront, or overlapping furniture | Separate components and alternate views | Preserve the visible parts and fit the inferred surfaces to the structure |

Choose the projection that matches the source sprite. Review all four sides, especially the reverse and sides where volume and colors may be inferred. Verify the GLB embeds its texture and that the model's scale and pivot fit the target prop. Record the source hash, converter revision, projection, reading, dimensions, and triangle count. See the pinned [Sprite2Model source and license notes](../public/map-lab/sprite2model/vendor/SOURCE.md).

## 3. Fit props in the Luminati test scene

Use a future isolated art worktree and the current [Wharf scene](../public/assets/map-test/wharf.mjs), [placement data](../public/assets/map-test/wharf-data.mjs), and [walkability layout](../public/assets/map-test/layout.mjs). Add GLB loading within the test scene when a reviewed asset is ready. Set the model's anchor with the existing scene coordinate helpers and match its footprint and elevation to the cutout it represents.

- Keep Loki and Yhannie as their original nearest-filtered sprites with existing pivots and frame data. Use a consistent pixel scale on scenery meshes and clean alpha-test edges on masked art.
- Use Luminati's camera, lighting, shadows, water, and post-processing. Assign the proper color space to color textures and convert to display color once. Keep bloom on emissive highlights and depth of field outside the playable band. Check that signs and silhouettes read in each lighting preset.
- Compare the model to its cutout in WebGL and check the corresponding 2D art in Canvas fallback. Verify camera rotation and zoom, floor contact, foreground occlusion, rail and stair collision, and silhouettes over water. Test iPhone Safari in landscape for touch input and frame pacing.
- Use the existing gameplay events to time anticipation, contact, follow-through, and recovery poses. Sync Loki's crimson trail and Yhannie's cyan seal to release and impact. Keep Bakunawa's warning patterns readable over splashes and lighting. Use held poses and short camera accents for ultimates.

Capture the same camera composition at Dusk and in a well-lit view. Record the sprite review, four-side preview, scene fit, gameplay readability, renderer, and device results for each candidate. Keep the art review distinct from release approval.
