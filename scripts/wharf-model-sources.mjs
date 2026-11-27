import { DECKS, PROMENADE, STAIRS, STAIR_COUNT } from '../public/assets/map-test/layout.mjs';
import { BACKSTREET, OUTCROP, FACADES, BOATS, RAILS, LAMPS } from '../public/assets/map-test/wharf-data.mjs';

const cutout = (id, name, area, reading, bounds, outline, note, holes = []) =>
  ({ id, name, area, reading, bounds, outline, holes, note });

const lighthouse = FACADES.find(({ id }) => id === 'lighthouse');

export const modelSources = [
  { id: 'red-umbrella', name: 'Red umbrella canopy', area: 'Boardwalk', reading: 'round',
    file: 'public/assets/mapv2-red_umbrella.png', bounds: [264, 575, 56, 36],
    note: 'The canopy has an isolated sprite. Its pole and café furniture have separate footprints.' },
  { id: 'blue-umbrella', name: 'Blue umbrella canopy', area: 'Boardwalk', reading: 'round',
    file: 'public/assets/mapv2-blue_umbrella.png', bounds: [328, 574, 56, 38],
    note: 'The canopy has an isolated sprite. Its pole and café furniture have separate footprints.' },
  cutout('seafood-sign', 'Seafood fish sign', 'Promenade', 'cutout', [282, 395, 126, 68],
    [[285, 433], [304, 429], [305, 415], [321, 406], [337, 398], [349, 395], [364, 397],
      [380, 407], [387, 406], [383, 428], [400, 428], [406, 433], [406, 456], [403, 461],
      [288, 461], [284, 456]],
    'The lettering and fish come directly from the painted shop front. Fit it as a wall-mounted sign.'),
  cutout('seafood-awning', 'Seafood striped awning', 'Promenade', 'cutout', [272, 461, 157, 32],
    [[273, 462], [427, 462], [427, 488], [423, 492], [276, 492], [273, 488]],
    'The canopy is a single painted strip. Add brackets separately when fitting it to a building.'),
  cutout('anchor-banner', 'Blue anchor banner', 'Boardwalk', 'cutout', [200, 543, 27, 38],
    [[202, 546], [225, 546], [225, 568], [214, 579], [204, 571]],
    'The banner is isolated from its pole. Its back color is inferred from the visible side.'),
  cutout('red-dock-cabinet', 'Red vending cabinet', 'Boardwalk', 'box', [414, 539, 37, 69],
    [[417, 541], [446, 541], [450, 546], [450, 601], [447, 606], [415, 606], [416, 572]],
    'The visible front and side establish the box shape. Review the depth and rear face.'),
  cutout('barrel-stool', 'Small rope barrel', 'Boardwalk', 'round', [392, 599, 24, 36],
    [[396, 602], [407, 600], [413, 604], [414, 617], [412, 632], [396, 634], [394, 619]],
    'The visible barrel rim and bands supply the reference for a round model.'),
  cutout('blue-stool', 'Blue round stool', 'Boardwalk', 'round', [410, 608, 26, 30],
    [[414, 613], [419, 609], [429, 611], [434, 618], [434, 626], [432, 636], [426, 637],
      [425, 630], [420, 629], [419, 636], [413, 636], [412, 627], [411, 619]],
    'Check the open space under the stool when reviewing the inferred underside.'),
  cutout('rope-bollard', 'Blue mooring bollard', 'Boardwalk', 'round', [328, 638, 13, 34],
    [[331, 641], [336, 640], [339, 643], [338, 665], [340, 668], [337, 670], [330, 670],
      [329, 667], [331, 663]],
    'The pole is isolated from the rope. Use the bottom as the tether point.'),
  cutout('pier-menu-stand', 'Pier menu stand', 'Pier fingers', 'cutout', [195, 686, 33, 53],
    [[197, 689], [224, 689], [226, 695], [224, 735], [221, 738], [197, 737]],
    'The front remains readable in the draft. Review the support feet from the side.'),
  cutout('rubber-fender', 'Rubber tire fender', 'Pier edge', 'cutout', [253, 668, 31, 31],
    [[256, 674], [263, 669], [274, 669], [281, 676], [283, 684], [279, 693], [273, 697],
      [262, 697], [255, 692], [254, 683]],
    'The center was masked out. Check tire thickness and the gap around the hanging rope.',
    [[[265, 679], [272, 679], [275, 683], [272, 690], [265, 689], [262, 684]]]),
  cutout('brass-lantern', 'Brass pier lantern', 'Pier fingers', 'cutout', [289, 763, 20, 44],
    [[295, 765], [300, 764], [300, 768], [305, 772], [306, 782], [301, 786], [301, 796],
      [305, 803], [303, 805], [292, 805], [291, 802], [295, 796], [295, 786],
      [290, 782], [291, 772], [295, 768]],
    'The sprite includes the support. Emission and the actual light source are assigned by the scene.'),
  cutout('rope-wrapped-piling', 'Rope-wrapped piling', 'Pier edge', 'round', [340, 670, 22, 63],
    [[345, 673], [352, 671], [357, 675], [356, 700], [355, 726], [357, 730], [353, 732],
      [343, 732], [342, 728], [344, 700]],
    'The visible section is a reference for the rope bands. The submerged length must match the deck height.'),
  { ...lighthouse, area: 'Lighthouse point', reading: 'round',
    note: 'The visible tower silhouette is the reference. Inspect the roof, balcony and unseen walls before placement.' },
];

const sourceDetails = {
  'squid-lantern-shop': 'The squid banner, balcony, lanterns, storefront door and planters share one painted face. Isolate the structural shell and façade pieces.',
  'seafood-shop': 'The building shell, roof windows, crates, fish trays, counters and door form one painted face. The sign and awning already have individual drafts.',
  'corner-shop': 'The brick walls, balcony guardrail, windows, hanging sign, doorway and trim share one painted face. Capture each part at its own depth.',
  'red-cafe-set': 'The red canopy covers the pole, table and chairs. The isolated canopy is available. Obtain clean views of the furniture.',
  'blue-cafe-set': 'The blue canopy covers the pole, table and chairs. The isolated canopy is available. Obtain clean views of the furniture.',
  'barrel-planters': 'The large barrel, nested planter, flowers and small buckets overlap. Split the rim, barrel body and plant silhouettes.',
  'stool-clusters': 'The stool, barrel and vending cabinet have individual drafts. Hanging signs, cups and small crates need independent masks.',
  'west-fishing-boat': 'The hull, cabin, rigging, deck gear and waterline overlap. Obtain clean hull and cabin views, then attach the animated ropes and wake.',
  'east-fishing-boat': 'The hull, cabin, rigging, deck gear and waterline overlap. Obtain clean hull and cabin views, then attach the animated ropes and wake.',
};

const painted = [...FACADES, ...BOATS]
  .filter(({ id }) => !modelSources.some((entry) => entry.id === id))
  .map(({ id, name, bounds, foot, floor }) => ({
    id, name, bounds, foot, floor, state: 'needs-sprite', area: 'Painted map',
    note: sourceDetails[id],
  }));

const details = [
  ['fish-trays', 'Fish trays, baskets and crates', 'Promenade', [279, 489, 158, 59], 'Create a separate sprite for each tray and crate. Their bases overlap the storefront and pavement.'],
  ['lantern-shop-banner', 'Squid banner and window awnings', 'Promenade', [146, 394, 116, 111], 'Isolate the banner and each awning from the wall and neighboring foliage.'],
  ['planters-and-cliff-foliage', 'Plants, potted flowers and cliff foliage', 'Lighthouse point', [9, 280, 184, 350], 'Keep separate leaf silhouettes and pots. Large patches of foliage are painted into the cliff.'],
  ['rope-and-chain-lines', 'Rope and chain runs', 'Boardwalk', [190, 630, 253, 36], 'Trace each line between the bollards. Use a curve and repeated rope texture for the final mesh.'],
  ['gold-pier-signs', 'Gold hanging signs and cleats', 'Pier fingers', [253, 702, 69, 111], 'Some sign faces and pier cleats are partly hidden by ropes. Obtain separate side views.'],
  ['pier-ladders', 'Pier ladders and access trim', 'Pier edge', [458, 625, 82, 101], 'Recreate the rungs and rails at the correct deck height. Some rungs are hidden by the waterline.'],
  ['fish-shop-door-windows', 'Shop doors, windows and balcony rails', 'Promenade', [145, 356, 388, 183], 'Measure each opening against its storefront before fitting separate meshes.'],
].map(([id, name, area, bounds, note]) => ({ id, name, area, bounds, note, state: 'needs-sprite' }));

const built = [
  ['terrace', 'Stone promenade and retaining wall', [PROMENADE, BACKSTREET], 2, 'Two textured stone platforms use the existing walkable footprint.'],
  ['lighthouse-cliff', 'Lighthouse rock platform', [OUTCROP], 1, 'The outcrop is a separate mesh with a painted rock texture.'],
  ['wood-decks', 'Wood boardwalk and pier fingers', DECKS, DECKS.length, 'Four connected plank platforms use the Wharf elevation and collision layout.'],
  ['stairs', 'West and east stairs', STAIRS, STAIRS.length, `${STAIR_COUNT} steps per run use the shared elevation profile.`],
  ['rail-sections', 'Railing sections and upright supports', RAILS, RAILS.length, 'Rails share the positions used by the 2.5D scene.'],
  ['lamps', 'Street and pier lamp placements', LAMPS, LAMPS.length, 'Each fixture has a model position and height with its own light.'],
  ['piles', 'Pier support piles', DECKS, null, 'Support piles repeat along the deck edges and extend through the waterline.'],
  ['building-volumes', 'Storefront roof and side volumes', FACADES.slice(0, 3).map(({ foot }) => foot), 3, 'Scene meshes give the three painted fronts side and roof depth.'],
].map(([id, name, placements, count, note]) => ({ id, name, area: '3D layout', placements, count, note, state: 'geometry' }));

const animated = [
  { id: 'sea', name: 'Sea, shoreline foam and glints', area: 'Harbor', state: 'animated',
    note: 'The ocean and shoreline animation come from the map renderer.' },
  { id: 'lantern-light', name: 'Lantern light and shadows', area: 'Lighting', state: 'animated',
    note: 'The scene lights follow the Day, Dusk and Night presets.' },
  { id: 'boat-motion', name: 'Boat bobbing', area: 'Harbor', state: 'animated',
    note: 'The water movement animates the two existing boat placements.' },
  { id: 'heroes', name: 'Loki and Yhannie sprite animations', area: 'Actors', state: 'animated',
    note: 'The map uses their original movement sheets. Outfit conversion needs a separate four-view sheet with aligned feet.' },
];

export const inventoryNotes = [...painted, ...details, ...built, ...animated];
