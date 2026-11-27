const $ = (id) => document.getElementById(id);
const list = $('objects');
const search = $('search');
const filter = $('filter');
const status = $('status');
const generate = $('generate');
const cancel = $('cancel');
const fileInput = $('file');
const report = $('report');
const modelLink = $('download-glb');
const spriteLink = $('download-png');
const labels = { draft: 'Draft GLB', 'needs-sprite': 'Needs sprite', geometry: 'Scene mesh', animated: 'Animated' };
let catalog = [];
let selected;
let worker;
let revision = 0;
const URLs = new Set();

$('game-link').hidden = window !== window.top;

function objectURL(blob) {
  const url = URL.createObjectURL(blob);
  URLs.add(url);
  return url;
}

function clearURLs() {
  for (const url of URLs) URL.revokeObjectURL(url);
  URLs.clear();
}

function releaseURL(url) {
  if (URLs.delete(url)) URL.revokeObjectURL(url);
}

function stopConversion() {
  revision++;
  worker?.terminate();
  worker = null;
  generate.disabled = false;
  cancel.hidden = true;
}

function showReport(metrics) {
  report.hidden = !metrics;
  report.textContent = metrics
    ? metrics.width + ' × ' + metrics.height + ' px · ' + metrics.triangles.toLocaleString() +
      ' triangles · ' + metrics.covered + '% silhouette coverage · ' + metrics.reading
    : '';
}

function download(link, url, filename) {
  if (link.href !== url) releaseURL(link.href);
  link.hidden = !url;
  if (url) {
    link.href = url;
    link.download = filename;
  } else {
    link.removeAttribute('href');
  }
}

function showPreview(url) {
  const image = $('preview');
  if (image.src !== url) releaseURL(image.src);
  image.hidden = !url;
  if (url) image.src = url;
  else image.removeAttribute('src');
  $('preview-placeholder').hidden = !!url;
}

function renderList() {
  const term = search.value.trim().toLowerCase();
  const matches = catalog.filter((entry) =>
    (!filter.value || entry.state === filter.value) &&
    [entry.name, entry.area, entry.note].some((value) => value.toLowerCase().includes(term)));
  const rows = matches.map((entry) => {
    const row = document.createElement('li');
    const button = document.createElement('button');
    const name = document.createElement('span');
    const state = document.createElement('small');
    name.textContent = entry.name;
    state.textContent = labels[entry.state];
    button.type = 'button';
    button.setAttribute('aria-current', String(selected?.id === entry.id));
    button.addEventListener('click', () => selectEntry(entry));
    button.append(name, state);
    row.append(button);
    return row;
  });
  if (!rows.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No matching objects.';
    rows.push(empty);
  }
  list.replaceChildren(...rows);
}

function selectEntry(entry) {
  stopConversion();
  clearURLs();
  selected = entry;
  status.textContent = '';
  $('object-name').textContent = entry.name;
  $('object-area').textContent = [entry.area, labels[entry.state]].filter(Boolean).join(' · ').toUpperCase();
  $('object-note').textContent = entry.note;
  const bounds = entry.bounds
    ? 'Source region ' + entry.bounds.slice(0, 2).join(', ') + ' · ' + entry.bounds.slice(2).join(' × ') + ' map px'
    : '';
  const placement = entry.foot ? 'Foot ' + entry.foot.join(', ') + ' · elevation ' + entry.floor : '';
  $('object-position').textContent = [bounds, placement, entry.count && entry.count + ' placements'].filter(Boolean).join(' / ');

  const spriteURL = entry.file ? objectURL(entry.file) : entry.files?.sprite;
  $('previews').hidden = $('settings').hidden = generate.hidden = !spriteURL;
  if (spriteURL) $('sprite').src = spriteURL;
  $('reading').value = entry.options?.reading ?? 'auto';
  $('projection').value = entry.options?.projection ?? 'iso';
  $('outline').checked = entry.options?.keepOutline ?? true;
  $('frame').value = 0;
  toggleFrame();
  showPreview(entry.files?.preview);
  showReport(entry.report);
  download(modelLink, entry.files?.model, entry.id + '.glb');
  download(spriteLink, spriteURL, entry.id + '.png');
  const oldSelection = list.querySelector('[aria-current="true"]');
  oldSelection?.setAttribute('aria-current', 'false');
  const matchingRow = [...list.querySelectorAll('button')].find((button) => button.firstChild.textContent === entry.name);
  matchingRow?.setAttribute('aria-current', 'true');
}

function toggleFrame() {
  $('frame-field').hidden = $('reading').value !== 'outfit';
}

function readSize(bytes) {
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.byteLength < 24 || !png.every((value, i) => new Uint8Array(bytes, 0, 8)[i] === value)) {
    throw new Error('Choose a PNG with a transparent background.');
  }
  const header = new DataView(bytes);
  const width = header.getUint32(16), height = header.getUint32(20);
  if (width < 8 || height < 8 || width > 8192 || height > 8192 || width * height > 16000000) {
    throw new Error('Choose a PNG between 8 and 8,192 pixels per side and under 16 megapixels.');
  }
  return { width, height };
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  stopConversion();
  const token = revision;
  fileInput.value = '';
  try {
    if (file.size > 12 * 1024 * 1024) throw new Error('Choose a PNG under 12 MB.');
    const { width, height } = readSize(await file.slice(0, 24).arrayBuffer());
    if (token !== revision) return;
    const id = file.name.replace(/\.png$/i, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 64) || 'sprite';
    selectEntry({
      id, name: file.name, file, area: 'Local sprite',
      note: width + ' × ' + height + ' px. Choose the reading that fits the sprite. For a four-view outfit, use north, east, south, west columns.',
    });
  } catch (error) {
    if (token === revision) status.textContent = error.message;
  }
});

async function inputBytes(entry, options) {
  if (!entry.file) {
    const response = await fetch(entry.files.sprite);
    if (!response.ok) throw new Error('The source sprite could not load.');
    return response.arrayBuffer();
  }
  const bytes = await entry.file.arrayBuffer();
  const { width, height } = readSize(bytes);
  let w = width, h = height;
  if (options.reading === 'outfit') {
    const cell = width / 4;
    if (width % 4 || height % cell || height / cell > 12) throw new Error('Use four equal square views per outfit row, with up to 12 rows.');
    const side = Math.min(96, Math.floor(960 / (height / cell)), cell);
    w = side * 4;
    h = side * (height / cell);
  } else if (Math.max(width, height) > 192) {
    const scale = 192 / Math.max(width, height);
    w = Math.max(8, Math.round(width * scale));
    h = Math.max(8, Math.round(height * scale));
  }
  const bitmap = await createImageBitmap(entry.file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h).data;
    let transparent = false, painted = false;
    for (let i = 3; i < pixels.length && !(transparent && painted); i += 4) {
      if (pixels[i] < 128) transparent = true;
      else painted = true;
    }
    if (!transparent || !painted) throw new Error('Use a visible sprite with transparent pixels around it.');
    if (w === width && h === height) return bytes;
    const resized = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!resized) throw new Error('The sprite could not be resized.');
    return resized.arrayBuffer();
  } finally {
    bitmap.close();
  }
}

generate.addEventListener('click', async () => {
  if (!selected) return;
  const entry = selected;
  const token = ++revision;
  const options = {
    reading: $('reading').value,
    projection: $('projection').value,
    keepOutline: $('outline').checked,
    frame: Math.max(0, Math.min(63, Math.floor(Number($('frame').value) || 0))),
  };
  generate.disabled = true;
  cancel.hidden = false;
  status.textContent = 'Generating model…';
  function finish(error) {
    stopConversion();
    status.textContent = error || 'Draft GLB generated.';
  }
  try {
    const bytes = await inputBytes(entry, options);
    if (token !== revision) return;
    worker = new Worker(new URL('./converter-worker.js', import.meta.url));
    worker.onmessage = ({ data }) => {
      if (token !== revision) return;
      if (data.error) return finish(data.error);
      showPreview(objectURL(new Blob([data.preview], { type: 'image/png' })));
      showReport(data.report);
      download(modelLink, objectURL(new Blob([data.glb], { type: 'model/gltf-binary' })), entry.id + '.glb');
      finish();
    };
    worker.onerror = () => { if (token === revision) finish('The converter could not start. Try again.'); };
    worker.postMessage({ bytes, options, name: entry.id }, [bytes]);
  } catch (error) {
    if (token === revision) finish(error.message);
  }
});

cancel.addEventListener('click', () => {
  stopConversion();
  status.textContent = 'Conversion cancelled.';
});
search.addEventListener('input', renderList);
filter.addEventListener('change', renderList);
$('reading').addEventListener('change', toggleFrame);

try {
  const response = await fetch('./catalog.json');
  if (!response.ok) throw new Error('The Wharf inventory could not load.');
  catalog = (await response.json()).entries;
  $('inventory-count').textContent = catalog.length + ' entries · ' +
    catalog.filter(({ state }) => state === 'draft').length + ' GLB drafts';
  renderList();
  selectEntry(catalog[0]);
} catch (error) {
  $('object-name').textContent = 'Wharf inventory unavailable';
  status.textContent = error.message;
}
