export const WORLD = { width: 648, height: 432 };
export const SPAWN = { x: 400, y: 353 };

const UPPER = [[5,189], [643,189], [643,244], [5,244]];
const LOWER = [[43,300], [609,300], [584,328], [566,356], [554,386], [96,386], [92,359], [68,331]];
const STAIR = [[291,230], [374,230], [374,323], [290,323]];
const SURFACES = [UPPER, LOWER, STAIR];
const FEET = [[-5,0], [5,0], [0,-4], [0,4]];

export const PROPS = [
  { art: 'terrace/bench.png', x: 173, y: 222, anchorX: 18, anchorY: 25, radius: 14, halfDepth: 7, shadow: 4 },
  { art: 'terrace/planter.png', x: 566, y: 223, anchorX: 16, anchorY: 30, radius: 8, halfDepth: 6, shadow: 3 },
  { art: 'terrace/cart.png', x: 164, y: 332, anchorX: 27, anchorY: 45, radius: 20, halfDepth: 9, shadow: 5 },
  { art: 'terrace/signal.png', x: 495, y: 368, anchorX: 19, anchorY: 51, radius: 7, halfDepth: 6, shadow: 3, emission: [4, 17, 31, 15] },
];

export const NPCS = [
  { name: 'Tiyo Nilo', art: 'terrace/nilo.png', x: 429, y: 344, anchorX: 15, anchorY: 35, radius: 8, halfDepth: 5, shadow: 3,
    lines: [
      'Amihan! Bukas na ulit ang daan sa taas.',
      'Nandoon si Lira. Akyat ka sa gitnang hagdan.',
    ] },
  { name: 'Lira', art: 'terrace/lira.png', x: 456, y: 215, anchorX: 14, anchorY: 36, radius: 8, halfDepth: 5, shadow: 3,
    lines: [
      'Ayos na ang signal. Parating na ang tren.',
      'Hintay tayo rito hanggang mag-berde ang ilaw.',
    ] },
  { name: 'Aling Pacing', art: 'terrace/npcs/pacing.png', x: 208, y: 350, anchorX: 15, anchorY: 36, radius: 10, halfDepth: 5, shadow: 3,
    lines: [
      "Mainit pa 'tong bibingka. Naamoy mo ba mula sa hagdan?",
      'Kapag nahuli ang tren, may oras ka pa para sa pangalawa.',
    ] },
  { name: 'Mang Ukit', art: 'terrace/npcs/ukit.png', x: 529, y: 349, anchorX: 16, anchorY: 39, radius: 10, halfDepth: 5, shadow: 3,
    lines: [
      "Tatlong ulit kong inayos 'yang signal ngayong linggo.",
      "Apat, kung isasama mo 'yung kinatok ko lang.",
    ] },
  { name: 'Bituin', art: 'terrace/npcs/bituin.png', x: 264, y: 226, anchorX: 11, anchorY: 46, radius: 7, halfDepth: 4, shadow: 3,
    lines: [
      'Kumaliwa ang hangin. Amoy-dagat na ang paparating.',
      "Sabihan mo si Pacing kapag umikot nang todo 'tong panukat.",
    ] },
  { name: 'Kidlat', art: 'terrace/npcs/kidlat.png', x: 310, y: 362, anchorX: 9, anchorY: 32, radius: 6, halfDepth: 4, shadow: 2,
    lines: [
      "Si Kalabit 'to. Kailangan pa niyang matutong magpreno.",
      'Kahapon, muntik na niyang maunahan ang tren.',
    ] },
  { name: 'Lola Habi', art: 'terrace/npcs/habi.png', x: 110, y: 224, anchorX: 13, anchorY: 35, radius: 8, halfDepth: 5, shadow: 3,
    lines: [
      'Itong asul na sinulid? Kakulay ng dagat bago umulan.',
      'Isang dangkal na lang, tapos na ang kumot para sa apo ko.',
    ] },
];

export const LIGHTS = [
  { x: 84, y: 161, radius: 30, color: '255,183,103' },
  { x: 337, y: 157, radius: 45, color: '255,174,88' },
  { x: 452, y: 168, radius: 43, color: '255,177,98' },
  { x: 598, y: 165, radius: 40, color: '255,189,106' },
  { x: 484, y: 339, radius: 26, color: '235,85,69' },
];

function inside(outline, x, y) {
  let hit = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, ay] = outline[i];
    const [bx, by] = outline[j];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) hit = !hit;
  }
  return hit;
}

function surfaceAt(x, y) {
  return SURFACES.find((outline) => inside(outline, x, y));
}

const BLOCKERS = [...PROPS, ...NPCS];
export function canStand(x, y) {
  return FEET.every(([dx, dy]) => surfaceAt(x + dx, y + dy))
    && BLOCKERS.every((piece) => Math.abs(piece.x - x) >= piece.radius + 5 || Math.abs(piece.y - y) >= piece.halfDepth + 4);
}

export function nearestSpeaker({ x, y }) {
  const surface = surfaceAt(x, y);
  let nearest = null;
  let distance = 38;
  for (const npc of NPCS) {
    const length = Math.hypot(x - npc.x, y - npc.y);
    if (length < distance && surface === surfaceAt(npc.x, npc.y)) {
      distance = length;
      nearest = npc;
    }
  }
  return nearest;
}
