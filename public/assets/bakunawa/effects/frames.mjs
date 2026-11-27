export const FRAME_COUNT = 16;
export const FRAMES_PER_ROW = 4;

// Each clip occupies a four-by-four block. The order also matches the fallback sheets.
const sizes = {
  yhannie: { seal: 208, burst: 264, trail: 160, crystal: 96, contact: 168, ward: 176 },
  loki: { slash: 224, trail: 168, contact: 176, finish: 264, burst: 224, parry: 144 },
};

function layout(sizesByClip) {
  const clips = {};
  const entries = Object.entries(sizesByClip);
  let width = 0;
  let height = 0;
  for (let row = 0; row < entries.length; row += 2) {
    const [[left, a], [right, b]] = entries.slice(row, row + 2);
    clips[left] = { x: 0, y: height, size: a, cell: row };
    clips[right] = { x: a * FRAMES_PER_ROW, y: height, size: b, cell: row + 1 };
    width = Math.max(width, (a + b) * FRAMES_PER_ROW);
    height += Math.max(a, b) * (FRAME_COUNT / FRAMES_PER_ROW);
  }
  return { width, height, clips };
}

export const frameAtlases = {
  yhannie: layout(sizes.yhannie),
  loki: layout(sizes.loki),
};
