import * as THREE from 'three';

const PALETTES = {
  day: ['#abb8ab', '#24798d', '#0c4870', 'none'],
  dusk: ['#8b938e', '#207a8d', '#103c59', 'saturate(1.08)'],
  night: ['#26394f', '#174259', '#071c36', 'brightness(.68) saturate(.75)'],
};

function drawTriangle(ctx, vertices, pattern, color) {
  const [a, b, c] = vertices;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  if (!pattern) {
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }
  const u1 = b.u - a.u, v1 = b.v - a.v;
  const u2 = c.u - a.u, v2 = c.v - a.v;
  const det = u1 * v2 - v1 * u2;
  if (Math.abs(det) < 0.00001) return;
  const x1 = b.x - a.x, y1 = b.y - a.y;
  const x2 = c.x - a.x, y2 = c.y - a.y;
  const m11 = (x1 * v2 - x2 * v1) / det;
  const m12 = (y1 * v2 - y2 * v1) / det;
  const m21 = (x2 * u1 - x1 * u2) / det;
  const m22 = (y2 * u1 - y1 * u2) / det;
  ctx.save();
  ctx.clip();
  ctx.transform(m11, m12, m21, m22, a.x - m11 * a.u - m21 * a.v, a.y - m12 * a.u - m22 * a.v);
  const left = Math.min(a.u, b.u, c.u), top = Math.min(a.v, b.v, c.v);
  ctx.fillStyle = pattern;
  ctx.fillRect(left - 1, top - 1, Math.max(a.u, b.u, c.u) - left + 2, Math.max(a.v, b.v, c.v) - top + 2);
  ctx.restore();
}

// Use the same geometry, art, collision and CameraRig when WebGL cannot start.
export function canvasView(surface, scene, camera, { palettes = PALETTES,
  glows = [], waterArea = [8, 20, 67, 72], shoreline = [] } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'map-test-software';
  surface.append(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  const matrix = new THREE.Matrix4();
  const pv = new THREE.Matrix4();
  const point = new THREE.Vector4();
  const tint = new THREE.Color();
  const patterns = new WeakMap();
  let width = 0, height = 0, lastTime;

  function pointOnScreen(x, y, z, transform) {
    point.set(x, y, z, 1).applyMatrix4(transform);
    if (point.w < 0.2) return null;
    return { x: (0.5 + point.x / point.w * 0.5) * width,
      y: (0.5 - point.y / point.w * 0.5) * height, depth: point.w };
  }

  function drawSea(elapsed, palette) {
    const fill = ctx.createLinearGradient(0, 0, 0, height);
    palette.slice(0, 3).forEach((color, i) => fill.addColorStop([0, 0.43, 1][i], color));
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);
    const [left, top, right, bottom] = waterArea;
    for (let i = 0; i < 432; i++) {
      const x = left + (i * 43.87) % (right - left);
      const z = top + (i * 29.91) % (bottom - top);
      const wave = Math.sin(i * 2.33 + elapsed * 1.14);
      const a = pointOnScreen(x + wave * 0.11, 0, z, pv);
      const b = pointOnScreen(x + 0.19 + (i % 6) * 0.12, 0, z + 0.15, pv);
      if (!a || !b || a.x < -50 || a.x > width + 50 || a.y < 0 || a.y > height) continue;
      ctx.strokeStyle = i % 11 === 0 ? '#ddf6d9a1' : '#74d7c461';
      ctx.globalAlpha = 0.32 + (wave + 1) * 0.32;
      ctx.lineWidth = a.depth < 36 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(a.x), Math.round(a.y));
      ctx.lineTo(Math.round(b.x), Math.round(b.y));
      ctx.stroke();
    }
    ctx.fillStyle = '#acf0d77a';
    for (const [x0, z0, x1, z1] of shoreline) {
      const segments = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 2.2);
      for (let i = 0; i < segments; i++) {
        const phase = elapsed * 1.65 + i * 0.83;
        const f = (i + 0.28 + Math.cos(phase) * 0.12) / segments;
        const a = pointOnScreen(x0 + (x1 - x0) * f, 0, z0 + (z1 - z0) * f, pv);
        if (!a) continue;
        ctx.globalAlpha = 0.4 + Math.sin(phase) * 0.33;
        const size = height / a.depth * 0.36;
        ctx.fillRect(Math.round(a.x), Math.round(a.y), Math.max(2, Math.round(size)), 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawGlow(time) {
    if (time === 'day' || !glows.length) return;
    ctx.globalCompositeOperation = 'screen';
    for (const position of glows) {
      const point = pointOnScreen(position.x, position.y, position.z, pv);
      if (!point) continue;
      const radius = Math.max(4, height / point.depth * 0.92);
      if (point.x < -radius || point.y < -radius || point.x > width + radius || point.y > height + radius) continue;
      const light = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      light.addColorStop(0, time === 'night' ? '#fbb05680' : '#ffc46d54');
      light.addColorStop(0.38, '#e6904441');
      light.addColorStop(1, '#d56f3000');
      ctx.fillStyle = light;
      ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function visibleTriangles() {
    const triangles = [];
    scene.traverseVisible((mesh) => {
      const geom = mesh.geometry;
      if (!mesh.isMesh || mesh.isInstancedMesh || !geom?.index) return;
      const { position, uv } = geom.attributes;
      const groups = geom.groups.length ? geom.groups : [{ start: 0, count: geom.index.count, materialIndex: 0 }];
      matrix.multiplyMatrices(pv, mesh.matrixWorld);
      for (const group of groups) {
        const material = Array.isArray(mesh.material) ? mesh.material[group.materialIndex] : mesh.material;
        if (!material?.isMeshLambertMaterial || !material.visible) continue;
        const map = material.map;
        let pattern = null;
        if (map?.image) {
          pattern = patterns.get(map);
          if (!pattern) {
            pattern = ctx.createPattern(map.image, map.wrapS === THREE.RepeatWrapping ? 'repeat' : 'no-repeat');
            patterns.set(map, pattern);
          }
        }
        const shade = geom.type === 'BoxGeometry' ? [0.81, 0.69, 1, 0.66, 0.88, 0.75][group.materialIndex] : 1;
        const color = '#' + tint.copy(material.color).multiplyScalar(shade).getHexString();
        for (let i = group.start; i < group.start + group.count; i += 3) {
          const vertices = [];
          for (let j = 0; j < 3; j++) {
            const index = geom.index.getX(i + j);
            const p = pointOnScreen(position.getX(index), position.getY(index), position.getZ(index), matrix);
            if (!p) break;
            if (pattern) {
              p.u = (uv.getX(index) * map.repeat.x + map.offset.x) * map.image.width;
              p.v = (1 - uv.getY(index) * map.repeat.y - map.offset.y) * map.image.height;
            }
            vertices.push(p);
          }
          if (vertices.length !== 3) continue;
          const [a, b, c] = vertices;
          if (material.side !== THREE.DoubleSide && (b.x - a.x) * (c.y - a.y) >= (b.y - a.y) * (c.x - a.x)) continue;
          triangles.push({ vertices, pattern, color, depth: (a.depth + b.depth + c.depth) / 3, order: mesh.renderOrder });
        }
      }
    });
    return triangles.sort((a, b) => a.order - b.order || b.depth - a.depth);
  }

  return {
    resize() {
      const scale = Math.min(devicePixelRatio || 1, 1);
      const w = Math.max(1, Math.round(surface.clientWidth * scale));
      const h = Math.max(1, Math.round(surface.clientHeight * scale));
      if (width === w && height === h) return;
      width = canvas.width = w;
      height = canvas.height = h;
      ctx.imageSmoothingEnabled = false;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render(elapsed, time) {
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
      pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      const palette = palettes[time];
      if (time !== lastTime) {
        canvas.style.filter = palette[3];
        lastTime = time;
      }
      drawSea(elapsed, palette);
      for (const { vertices, pattern, color } of visibleTriangles()) drawTriangle(ctx, vertices, pattern, color);
      drawGlow(time);
    },
    dispose() { canvas.remove(); },
  };
}
