import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { inventoryNotes, modelSources } from './wharf-model-sources.mjs';

const lab = new URL('../public/map-lab/sprite2model/', import.meta.url);
const output = new URL('models/', lab);
const mapImage = new URL('../public/assets/marinie-map-hd-preview.webp', import.meta.url);
const commit = 'b8bb34c8604fff256229429a6bf7531293f002e1';

function inPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
  }
  return inside;
}

async function preparedSprite(spec, mapBytes) {
  let image;
  if (spec.file) {
    image = sharp(await readFile(new URL('../' + spec.file, import.meta.url)));
  } else {
    const [left, top, width, height] = spec.bounds;
    const pixels = await sharp(mapBytes).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sx = left + x + 0.5, sy = top + y + 0.5;
        if (!inPolygon(sx, sy, spec.outline) || spec.holes?.some((hole) => inPolygon(sx, sy, hole))) {
          pixels[(y * width + x) * 4 + 3] = 0;
        }
      }
    }
    image = sharp(pixels, { raw: { width, height, channels: 4 } });
  }
  return image.resize(156, 156, { fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.nearest })
    .extend({ top: 2, bottom: 2, left: 2, right: 2, background: '#00000000' }).png().toBuffer();
}

function validateModel(glb, report, id) {
  assert.equal(glb.toString('ascii', 0, 4), 'glTF', id);
  assert.equal(glb.readUInt32LE(4), 2, id);
  assert.equal(glb.readUInt32LE(8), glb.length, id);
  const chunkSize = glb.readUInt32LE(12);
  assert.equal(glb.readUInt32LE(16), 0x4e4f534a, id);
  const json = JSON.parse(glb.toString('utf8', 20, 20 + chunkSize));
  assert.ok(json.meshes?.length && json.images?.every(({ bufferView }) => Number.isInteger(bufferView)), id);
  assert.ok(report.triangles > 0 && report.size.every(Number.isFinite), id);
}

await import(new URL('vendor/wasm_exec.js', lab).href);
const go = new globalThis.Go();
const { instance } = await WebAssembly.instantiate(await readFile(new URL('vendor/sprite2model.wasm', lab)), go.importObject);
void go.run(instance);
assert.equal(typeof globalThis.sprite2model?.convert, 'function');
const mapBytes = await readFile(mapImage);
await mkdir(output, { recursive: true });

const drafts = [];
for (const spec of modelSources) {
  const sprite = await preparedSprite(spec, mapBytes);
  const options = { projection: 'iso', reading: spec.reading, keepOutline: true };
  const result = JSON.parse(globalThis.sprite2model.convert(new Uint8Array(sprite), JSON.stringify(options), spec.id));
  assert.ok(!result.error, spec.id + ' ' + result.error);
  const glb = Buffer.from(result.glb, 'base64');
  const preview = Buffer.from(result.sides, 'base64');
  validateModel(glb, result.report, spec.id);
  assert.equal((await sharp(preview).metadata()).format, 'png', spec.id);

  const filenames = { sprite: spec.id + '.png', model: spec.id + '.glb', preview: spec.id + '.preview.png' };
  await Promise.all([
    writeFile(new URL(filenames.sprite, output), sprite),
    writeFile(new URL(filenames.model, output), glb),
    writeFile(new URL(filenames.preview, output), preview),
  ]);
  const { id, name, area, bounds, foot, floor, note } = spec;
  drafts.push({ id, name, area, bounds, foot, floor, note, state: 'draft', options,
    files: Object.fromEntries(Object.entries(filenames).map(([kind, file]) => [kind, 'models/' + file])),
    report: result.report });
  console.log(id, result.report.triangles + ' triangles', result.report.covered + '% silhouette match');
}
const entries = [...drafts, ...inventoryNotes];
assert.equal(new Set(entries.map(({ id }) => id)).size, entries.length, 'Duplicate asset IDs');
await writeFile(new URL('catalog.json', lab), JSON.stringify({
  scene: 'Seafood Wharf 2.5D Test',
  coordinateSpace: 'Marinie City 1536 × 864 map pixels, with scene elevations in 3D units',
  converter: { project: 'Coldensjo/sprite2model', commit, version: globalThis.sprite2model.version },
  entries,
}, null, 2) + '\n');
console.log('Verified', drafts.length, 'GLBs for', entries.length, 'inventory entries.');
