export const CHARACTER = { name: 'Amihan', role: 'Parcel courier', cellWidth: 48, cellHeight: 54, pivotX: 24, pivotY: 49 };
export const DIRECTIONS = { down: [0, false], right: [1, false], up: [2, false], left: [1, true] };

export const CLIPS = {
  idle: { frames: [0], frameTime: 1 },
  walk: { frames: [1, 0, 2, 0], frameTime: 0.135 },
  run: { frames: [1, 0, 2, 0], frameTime: 0.081, lift: [1, 0, 1, 0] },
};

export function frameIndex(clip, elapsed) {
  return Math.floor(elapsed / clip.frameTime) % clip.frames.length;
}

export function paintCharacter(ctx, image, state, x, y, scale = 1) {
  const [row, mirror] = DIRECTIONS[state.direction];
  const clip = CLIPS[state.clip];
  const column = clip.frames[state.frame];
  const lift = clip.lift?.[state.frame] ?? 0;
  const { cellWidth, cellHeight, pivotX, pivotY } = CHARACTER;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y) - lift * scale);
  ctx.scale(mirror ? -scale : scale, scale);
  ctx.drawImage(image, column * cellWidth, row * cellHeight, cellWidth, cellHeight,
    -pivotX, -pivotY, cellWidth, cellHeight);
  ctx.restore();
}
