const track = new URL('./armageddon.mp3', import.meta.url);
// The new recording is about 7 LU louder than the previous battle score.
const trackGain = 10 ** (-7 / 20);

export function createBattleScore(dialog, output) {
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = true;
  audio.src = track.href;
  dialog.append(audio);

  const context = output?.context;
  const gain = context?.createGain();
  const source = context?.createMediaElementSource(audio);
  source?.connect(gain).connect(output);

  return {
    audio,
    play(volume) {
      const level = Math.max(0, Math.min(1, volume)) * trackGain;
      if (gain) gain.gain.value = level;
      else audio.volume = level;
      if (level > 0) audio.play().catch(() => {});
      else audio.pause();
    },
    dispose() {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.remove();
      source?.disconnect();
      gain?.disconnect();
    },
  };
}
