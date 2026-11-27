import { DECK_HEIGHT, TERRACE_HEIGHT } from './layout.mjs';

export const BACKSTREET = [104, 405, 538, 527];
export const OUTCROP = [24, 339, 113, 495];

// Silhouettes traced against the original map. Each piece has its own 3D foot anchor.
export const FACADES = [
  {
    id: 'squid-lantern-shop', name: 'Squid Lantern Shop façade',
    bounds: [145, 361, 91, 183], foot: [190, 535], floor: TERRACE_HEIGHT,
    outline: [[145, 384], [158, 379], [158, 365], [208, 365], [212, 399], [230, 413],
      [217, 438], [224, 530], [211, 544], [184, 535], [147, 534]],
  },
  {
    id: 'seafood-shop', name: 'Seafood Shop façade',
    bounds: [217, 327, 216, 226], foot: [325, 540], floor: TERRACE_HEIGHT,
    outline: [[217, 453], [246, 451], [250, 413], [283, 397], [283, 334], [310, 328],
      [418, 328], [418, 399], [429, 412], [421, 459], [430, 497], [427, 532],
      [411, 546], [378, 549], [340, 542], [310, 552], [278, 548], [268, 536], [217, 532]],
  },
  {
    id: 'corner-shop', name: 'Corner Shop façade',
    bounds: [421, 382, 101, 161], foot: [472, 539], floor: TERRACE_HEIGHT,
    outline: [[421, 444], [439, 431], [450, 426], [478, 426], [514, 432],
      [521, 473], [512, 535], [480, 542], [430, 537]],
  },
  {
    id: 'lighthouse', name: 'Lighthouse',
    bounds: [29, 119, 85, 181], foot: [71, 410], floor: 4.45,
    outline: [[31, 157], [55, 133], [65, 120], [74, 123], [96, 143], [103, 162],
      [96, 186], [87, 191], [91, 227], [99, 266], [109, 282], [89, 297], [45, 294], [44, 268],
      [50, 214], [51, 188], [39, 181]],
  },
  {
    id: 'red-cafe-set', name: 'Red umbrella café set',
    bounds: [259, 570, 66, 67], foot: [292, 632], floor: DECK_HEIGHT,
    outline: [[260, 583], [276, 575], [289, 570], [308, 575], [321, 586], [323, 600], [311, 604],
      [314, 614], [320, 623], [315, 633], [266, 635], [263, 625], [272, 615], [275, 605], [260, 599]],
  },
  {
    id: 'blue-cafe-set', name: 'Blue umbrella café set',
    bounds: [322, 571, 67, 69], foot: [355, 635], floor: DECK_HEIGHT,
    outline: [[324, 585], [344, 573], [365, 571], [381, 579], [388, 595], [376, 604], [372, 614],
      [385, 620], [384, 634], [367, 639], [332, 634], [328, 624], [334, 607], [324, 599]],
  },
  {
    id: 'barrel-planters', name: 'Barrel and planter stack',
    bounds: [212, 576, 48, 75], foot: [236, 644], floor: DECK_HEIGHT,
    outline: [[219, 578], [241, 577], [254, 592], [259, 622], [249, 647], [224, 650], [213, 636], [216, 600]],
  },
  {
    id: 'stool-clusters', name: 'Stools and dock cabinet',
    bounds: [387, 585, 58, 58], foot: [416, 639], floor: DECK_HEIGHT,
    outline: [[390, 611], [403, 607], [411, 587], [431, 588], [438, 606], [443, 631],
      [437, 642], [394, 641], [388, 630]],
  },
  {
    id: 'pier-menu-stand', name: 'Pier menu stand',
    bounds: [188, 678, 39, 78], foot: [207, 727], floor: DECK_HEIGHT,
    outline: [[188, 693], [196, 679], [219, 680], [224, 701], [218, 728], [222, 750],
      [196, 755], [192, 730]],
  },
];

export const BOATS = [
  {
    id: 'west-fishing-boat', name: 'West fishing boat',
    bounds: [10, 650, 94, 204], foot: [57, 759], floor: -0.1,
    outline: [[18, 739], [24, 706], [36, 679], [55, 658], [77, 654], [85, 679], [91, 708], [102, 747],
      [91, 810], [75, 840], [51, 853], [31, 843], [18, 824], [13, 787]],
  },
  {
    id: 'east-fishing-boat', name: 'East fishing boat',
    bounds: [369, 697, 95, 147], foot: [419, 788], floor: -0.07,
    outline: [[374, 761], [387, 726], [408, 712], [426, 698], [444, 716], [453, 737], [462, 772],
      [459, 809], [444, 834], [417, 843], [392, 831], [377, 808], [370, 782]],
  },
];

export const RAILS = [
  [120, 538, 120, 574, TERRACE_HEIGHT],
  [224, 576, 413, 576, TERRACE_HEIGHT],
  [451, 642, 531, 642, DECK_HEIGHT],
  [326, 679, 535, 679, DECK_HEIGHT],
  [166, 680, 166, 807, DECK_HEIGHT],
  [237, 686, 237, 807, DECK_HEIGHT],
  [171, 806, 237, 806, DECK_HEIGHT],
  [267, 686, 267, 806, DECK_HEIGHT],
  [321, 686, 321, 806, DECK_HEIGHT],
  [271, 806, 321, 806, DECK_HEIGHT],
];

export const LAMPS = [
    [128, 555, TERRACE_HEIGHT, 2.7], [508, 555, TERRACE_HEIGHT, 2.7],
    [245, 670, DECK_HEIGHT, 2.05], [518, 674, DECK_HEIGHT, 2.05], [175, 794, DECK_HEIGHT, 1.8],
];
