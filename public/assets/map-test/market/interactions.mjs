import * as THREE from 'three';

const TALK_DISTANCE = 2.15;

export function marketInteractions(dialog, surface, npcs, signal) {
  const talk = dialog.querySelector('[data-map-action="talk"]');
  const panel = dialog.querySelector('[data-map-dialogue]');
  const closeButton = panel.querySelector('button');
  const portrait = panel.querySelector('img');
  const name = panel.querySelector('strong');
  const role = panel.querySelector('small');
  const line = panel.querySelector('p');
  const point = new THREE.Vector3();
  let closest = null;
  let speaking = null;

  function dismiss() {
    if (!speaking) return false;
    speaking = null;
    panel.hidden = true;
    talk.focus({ preventScroll: true });
    return true;
  }

  function speak() {
    if (!closest || dismiss()) return;
    speaking = closest;
    portrait.src = new URL('./art/' + closest.id + '.png', import.meta.url).href;
    name.textContent = closest.name;
    role.textContent = closest.role + ' · ' + closest.shop;
    line.textContent = closest.line;
    panel.hidden = false;
    closeButton.focus({ preventScroll: true });
  }

  closeButton.addEventListener('click', dismiss, { signal });
  talk.addEventListener('click', speak, { signal });
  dialog.addEventListener('cancel', (event) => {
    if (dismiss()) event.preventDefault();
  }, { signal });
  surface.addEventListener('click', (event) => {
    if (!closest || speaking || !closest.view) return;
    const bounds = surface.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const { view } = closest;
    if (Math.abs(x - view.x) < 28 && Math.abs(y - view.y) < 34) speak();
  }, { signal });
  signal.addEventListener('abort', () => {
    talk.hidden = true;
    panel.hidden = true;
    portrait.removeAttribute('src');
  }, { once: true });

  return {
    speak, dismiss,
    get speaking() { return Boolean(speaking); },
    update(position, camera) {
      let nearby = null;
      let distance = TALK_DISTANCE;
      for (const npc of npcs) {
        const separation = Math.hypot((position.x - npc.x) / 20, (position.y - npc.y) / 18);
        if (separation < distance) {
          distance = separation;
          nearby = npc;
        }
      }
      if (closest !== nearby) {
        closest = nearby;
        talk.hidden = !closest;
        if (closest) talk.textContent = 'Talk to ' + closest.name;
      }
      if (closest) {
        camera.updateMatrixWorld();
        point.copy(closest.sprite.position);
        point.y += 1.12;
        point.project(camera);
        closest.view = { x: (point.x * 0.5 + 0.5) * surface.clientWidth,
          y: (0.5 - point.y * 0.5) * surface.clientHeight };
      }
    },
  };
}
