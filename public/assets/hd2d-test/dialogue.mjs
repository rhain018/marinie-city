import { nearestSpeaker } from './layout.mjs?v=1.147';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function stationDialogue(dialog, world, player, signal, onOpen) {
  const prompt = dialog.querySelector('[data-hd-talk]');
  const bubble = dialog.querySelector('[data-hd-speech]');
  const speakerName = bubble.querySelector('[data-hd-speaker]');
  const line = bubble.querySelector('[data-hd-line]');
  const advance = bubble.querySelector('[data-hd-advance]');
  let nearby = null;
  let speaker = null;
  let page = 0;
  let view = null;

  function renderPage() {
    const final = page === speaker.lines.length - 1;
    speakerName.textContent = speaker.name;
    line.textContent = speaker.lines[page];
    advance.setAttribute('aria-label', final ? 'Close dialogue' : 'Next line');
  }

  function close(restoreFocus = false) {
    const wasSpeaking = Boolean(speaker);
    speaker = null;
    bubble.hidden = true;
    if (restoreFocus && wasSpeaking) {
      prompt.hidden = !nearby;
      (nearby ? prompt : world).focus({ preventScroll: true });
    }
  }

  function startOrAdvance() {
    if (speaker) {
      if (++page >= speaker.lines.length) close(true);
      else renderPage();
      return;
    }
    if (!nearby) return;
    speaker = nearby;
    page = 0;
    onOpen(speaker);
    renderPage();
    prompt.hidden = true;
    bubble.hidden = false;
    advance.focus({ preventScroll: true });
  }

  function update(nextView) {
    view = nextView;
    const next = nearestSpeaker(player);
    if (next !== nearby) {
      nearby = next;
      if (next) prompt.setAttribute('aria-label', 'Talk to ' + next.name);
    }
    const promptVisible = Boolean(nearby) && !speaker;
    if (!promptVisible && document.activeElement === prompt) world.focus({ preventScroll: true });
    prompt.hidden = !promptVisible;
    const actor = speaker ?? nearby;
    if (!actor) return;
    const x = (actor.x - view.x) * view.screenWidth / view.width;
    const y = (actor.y - actor.anchorY + 2 - view.y) * view.screenHeight / view.height;

    if (!speaker) {
      prompt.style.left = clamp(x, 26, view.screenWidth - 26) + 'px';
      prompt.style.top = Math.max(58, y - 3) + 'px';
      return;
    }

    const left = clamp(Math.round(x - bubble.offsetWidth * 0.42), 8, view.screenWidth - bubble.offsetWidth - 8);
    const top = y - bubble.offsetHeight - 11;
    const below = top < Math.min(105, view.screenHeight * 0.21);
    const foot = (actor.y - view.y) * view.screenHeight / view.height;
    bubble.style.left = left + 'px';
    bubble.style.top = Math.round(below ? foot + 14 : top) + 'px';
    bubble.style.setProperty('--hd-tail-x', clamp(x - left, 14, bubble.offsetWidth - 14) + 'px');
    bubble.toggleAttribute('data-tail-up', below);
  }

  prompt.addEventListener('click', startOrAdvance, { signal });
  advance.addEventListener('click', startOrAdvance, { signal });
  world.addEventListener('click', (event) => {
    if (!nearby || !view || speaker || dialog.dataset.hdMode !== 'map') return;
    const bounds = world.getBoundingClientRect();
    const x = view.x + (event.clientX - bounds.left) * view.width / bounds.width;
    const y = view.y + (event.clientY - bounds.top) * view.height / bounds.height;
    if (Math.abs(x - nearby.x) <= nearby.anchorX + 4
      && y >= nearby.y - nearby.anchorY && y <= nearby.y + 4) startOrAdvance();
  }, { signal });

  dialog.addEventListener('keydown', (event) => {
    if (dialog.dataset.hdMode !== 'map' || event.repeat || event.target instanceof HTMLSelectElement
      || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    const advanceKey = speaker && (key === 'enter' || key === ' ') && !(event.target instanceof HTMLButtonElement);
    if ((key === 'e' || advanceKey) && (speaker || nearby)) {
      event.preventDefault();
      startOrAdvance();
    }
  }, { signal });

  dialog.addEventListener('cancel', (event) => {
    if (!speaker) return;
    event.preventDefault();
    close(true);
  }, { signal });

  function clear() {
    close();
    nearby = null;
    prompt.hidden = true;
  }
  signal.addEventListener('abort', clear, { once: true });
  return { get active() { return Boolean(speaker); }, update, clear };
}
