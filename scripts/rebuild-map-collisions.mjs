import {readFileSync, writeFileSync} from 'node:fs';

const layout = JSON.parse(readFileSync('public/map-lab/map-v2-layout.json', 'utf8'));
const revision = JSON.parse(readFileSync('public/' + layout.collisionPatches, 'utf8'));
const {segments: rails} = JSON.parse(readFileSync('public/' + layout.railingAudit, 'utf8'));
const bits = Buffer.from(revision.baseGrid, 'base64');

function contains(change, x, y) {
  if (change.rect) {
    const [left, top, right, bottom] = change.rect;
    return x >= left && x <= right && y >= top && y <= bottom;
  }
  const points = change.polygon;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
  }
  return inside;
}

const changes = [...revision.changes, ...rails];
for (let y = 0; y < 216; y++) {
  for (let x = 0; x < 384; x++) {
    const i = y * 384 + x;
    const mask = 1 << (7 - (i & 7));
    for (const change of changes) {
      if (!contains(change, x * 4 + 2, y * 4 + 2)) continue;
      if (change.walk) bits[i >> 3] |= mask;
      else bits[i >> 3] &= ~mask;
    }
  }
}

const file = 'game/index.html';
const src = readFileSync(file, 'utf8');
writeFileSync(file, src.replace(/const GRID="[^"]+";/, 'const GRID="' + bits.toString('base64') + '";'));
console.log('Rebuilt collision grid with ' + rails.length + ' railing segments.');
