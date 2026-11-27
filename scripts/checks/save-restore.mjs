import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync('game/index.html', 'utf8');
function section(start, end) {
  const from = html.indexOf(start), to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'Missing game source section ' + start);
  return html.slice(from, to);
}

const account = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes("panel.id='accountPanel'"));
assert.ok(account, 'Missing embedded account dialog');
const code = [
  section('const HEROES=[', 'const DIRS='),
  section('function cleanHeroName(', 'function setPlayerName('),
  section('function loadSave(){', 'setInterval('),
  section('function slotKey(', 'function anySave('),
  section('/* load any save object', '/* ---------- UI'),
  section('function gmClose(', 'function gmNav('),
  section('function slotClick(', 'function renderGallery('),
  section('function galUnlocked(', 'function unlockScene('),
  account,
].join('\n');

const active = 'marinie.save', backup = 'marinie.beforeCloudLoad', gallery = 'marinie.gallery';
const original = {hero: 'loki', playerName: 'Skipper', coins: 31, x: 3, y: 8, playt: 11};
const selected = {hero: 'yhannie', coins: 812, x: 47, y: 70, playt: 94, meta: {hero: 'Captain'}};
const cloud = {...selected, gallery: {bell_yhannie: 4}};
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture(from = 'play') {
  const records = new Map(), errors = new Map(), elements = new Map(), listeners = new Map();
  const messages = [], starts = [];
  const classes = new Set(from === 'play' ? ['gmopen', 'playing'] : ['gmopen']);
  const state = {coins: original.coins, gate: null};
  const read = key => JSON.parse(records.get(key) ?? 'null');
  const seed = (key, value) => records.set(key, JSON.stringify(value));
  seed(active, original);
  seed(gallery, {wake_boy: 1});
  seed('marinie.slot.1.0', selected);
  const storage = {
    getItem: key => records.get(key) ?? null,
    removeItem: key => records.delete(key),
    setItem(key, value) {
      if (errors.has(key)) throw new DOMException('Device write failed', errors.get(key));
      records.set(key, String(value));
    },
  };
  function element() {
    return {dataset: {}, hidden: false, textContent: '', append() {}, focus() {}, setAttribute() {},
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, element());
        return elements.get(selector);
      }};
  }
  const body = element();
  body.classList = {contains: key => classes.has(key), remove: key => classes.delete(key)};
  body.append = node => elements.set('#' + node.id, node);
  const player = {hero: original.hero, x: original.x, y: original.y, route: [1, 2], pose: 'wave'};
  const context = {
    document: {body, createElement: element, querySelector: selector => body.querySelector(selector),
      addEventListener: (type, fn) => listeners.set(type, fn)},
    confirm: () => true, confirmBox: (_title, _body, _label, yes) => yes(),
    location: {search: ''}, URLSearchParams, cityMapTest: false, gameStorage: () => storage,
    fetch: async () => ({ok: true, json: async () => ({revision: 2, save: cloud, name: 'Tester'})}),
    calendarLabel: () => 'Day 1', toast: text => messages.push(text), sfx() {},
    P: player, SET: {}, GM: {el: element(), sec: 'load', page: '1', prevMode: 'play', from},
    mode: from === 'play' ? 'gmenu' : 'title', marker: {x: 9}, PLAYT: original.playt, talking: true,
    closeDlg() { context.talking = false; },
    snapshotGame: () => ({...original, coins: state.coins}),
    currentNameRecord: () => ({playerName: original.playerName, nameAuto: false, nameVersion: 1}),
    GEMS: 3, todI: 0, INV: {}, EQUIP: {}, FLAGS: {}, ROOM: null, HP: 4, MP: 5, EN: 2,
    LVL: 3, EXP: 67, MAP_VERSION: 22, MAIL: [], HOME: {x: 10, y: 10},
    async continueGame(save) {
      const data = save || context.loadSave();
      starts.push(data);
      if (state.gate) await state.gate;
      Object.assign(player, {hero: data.hero, x: data.x, y: data.y});
      state.coins = data.coins;
      context.mode = 'play';
    },
  };
  Object.defineProperty(context, 'COINS', {get: () => state.coins});
  vm.runInNewContext(code, context);
  async function openAccount() {
    listeners.get('click')({target: {closest: () => true}});
    await flush();
    assert.equal(elements.get('#accountPanel').hidden, false);
    assert.equal(elements.get('#cloudLoad').disabled, false);
  }
  return {context, state, messages, starts, errors, read, seed, elements, openAccount};
}

function checkUntouched(f) {
  const {P, GM} = f.context;
  assert.equal(f.starts.length, 0, 'A failed write must not start a world transition');
  assert.equal(P.hero, original.hero);
  assert.deepEqual([P.x, P.y, P.route, P.pose], [3, 8, [1, 2], 'wave']);
  assert.deepEqual(f.context.marker, {x: 9});
  assert.equal(f.context.PLAYT, original.playt);
  assert.equal(f.context.talking, true);
  assert.equal(GM.el.hidden, false, 'The current menu must stay open for retry');
  assert.equal(f.context.mode, GM.from === 'play' ? 'gmenu' : 'title');
  assert.deepEqual(f.read(active), original);
}

function checkSelected(f) {
  assert.equal(f.starts.length, 1);
  assert.equal(f.context.P.hero, selected.hero);
  assert.equal(f.state.coins, selected.coins);
  assert.deepEqual([f.context.P.x, f.context.P.y], [selected.x, selected.y]);
  assert.equal(f.read(active).playerName, 'Captain');
  assert.equal(f.read(active).meta, undefined);
}

for (const [from, error] of [['play', 'QuotaExceededError'], ['title', 'SecurityError']]) {
  test(from + ' slot keeps progress after ' + error + ' and retries the selected save', async () => {
    const f = fixture(from);
    f.errors.set(active, error);
    await f.context.slotClick(0);
    await flush(); // in-game confirmation callbacks can finish after the click handler
    checkUntouched(f);
    assert.ok(f.messages.length, 'The slot must explain the failed write');
    f.errors.clear();
    await f.context.slotClick(0);
    await flush();
    checkSelected(f);
    assert.equal(f.context.GM.el.hidden, true);
  });
}

for (const [button, failingKey] of [
  ['cloudLoad', active], ['cloudLoad', backup], ['cloudRestore', active],
]) {
  test(button + ' recovers after a failed write to ' + failingKey, async () => {
    const f = fixture('title');
    if (button === 'cloudRestore') f.seed(backup, selected);
    await f.openAccount();
    const action = f.elements.get('#' + button);
    const status = f.elements.get('#accountStatus');
    const previousStatus = status.textContent;
    f.errors.set(failingKey, 'QuotaExceededError');
    await action.onclick();
    checkUntouched(f);
    assert.equal(f.elements.get('#accountPanel').hidden, false);
    assert.notEqual(status.textContent, previousStatus, 'Display the error in the open dialog');
    assert.equal(action.disabled === true, false, 'Retry control must be available');
    assert.deepEqual(f.read(gallery), {wake_boy: 1}, 'Failed loads must preserve gallery unlocks');
    assert.ok(f.messages.every(message => !/cloud save loaded|device backup restored/i.test(message)));
    if (button === 'cloudLoad') assert.equal(f.read(backup), null, 'Remove any incomplete backup');
    f.errors.clear();
    await action.onclick();
    checkSelected(f);
    assert.equal(f.elements.get('#accountPanel').hidden, true);
    if (button === 'cloudLoad') {
      assert.equal(f.read(backup).hero, original.hero);
      assert.equal(f.read(backup).coins, original.coins);
      assert.deepEqual(f.read(gallery), {wake_boy: 1, bell_yhannie: 4});
    } else assert.deepEqual(f.read(backup), selected);
  });
}

test('cloud load backs up live progress and ignores repeat clicks during the transition', async () => {
  const f = fixture();
  f.state.coins = 504;
  f.context.ROOM = {kind: 'bedroom'};
  await f.openAccount();
  let resume;
  f.state.gate = new Promise(resolve => { resume = resolve; });
  const load = f.elements.get('#cloudLoad');
  const first = load.onclick();
  const second = load.onclick();
  resume();
  await Promise.all([first, second]);
  checkSelected(f);
  assert.equal(f.read(backup).hero, original.hero);
  assert.equal(f.read(backup).scene, 'room');
  assert.equal(f.read(backup).roomKind, 'bedroom');
  assert.deepEqual([f.read(backup).x, f.read(backup).y], [3, 8]);
  assert.equal(f.read(backup).coins, 504, 'Back up the running game with unsaved changes');
});

test('double-tapping a slot starts only one world transition', async () => {
  const f = fixture('title');
  let finish;
  f.state.gate = new Promise(resolve => { finish = resolve; });
  const first = f.context.slotClick(0);
  const second = f.context.slotClick(0);
  finish();
  await Promise.all([first, second]);
  await flush();
  checkSelected(f);
});

test('cloud load keeps the existing backup when a replacement backup write is denied', async () => {
  const f = fixture();
  const previousBackup = {...original, coins: 1};
  f.seed(backup, previousBackup);
  f.state.coins = 504;
  f.errors.set(backup, 'SecurityError');
  await f.openAccount();
  await f.elements.get('#cloudLoad').onclick();
  assert.deepEqual(f.read(backup), previousBackup);
  assert.equal(f.state.coins, 504);
  assert.deepEqual(f.read(gallery), {wake_boy: 1});
  checkUntouched(f);
});

test('a failed cloud load restores the earlier safety backup and preserves unsaved progress', async () => {
  const f = fixture();
  const priorBackup = {...original, coins: 77};
  f.seed(backup, priorBackup);
  f.state.coins = 504;
  f.errors.set(active, 'QuotaExceededError');
  await f.openAccount();
  await f.elements.get('#cloudLoad').onclick();
  checkUntouched(f);
  assert.equal(f.state.coins, 504);
  assert.deepEqual(f.read(backup), priorBackup);
  assert.deepEqual(f.read(gallery), {wake_boy: 1});
});
