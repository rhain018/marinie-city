const file = new URL('./combat-sfx.wav', import.meta.url);
const banks = new WeakMap();

// Each cue occupies one second at its original sample rate, with a silent tail.
const cues = new Map([
  'select', 'selectUltimate', 'arcaneCast', 'arcaneBolt', 'crystalCast', 'arcaneHit',
  'crystalBurst', 'magicShield', 'arcaneDash', 'swordReady', 'swordSwing', 'swordHit',
  'swordDash', 'parry', 'ultimateMagic', 'ultimateSword', 'magicRelease', 'swordRelease',
  'arcaneImpact', 'crimsonImpact', 'danger', 'roar', 'tidal', 'vortex', 'lightning', 'hurt',
].map((key, index) => [key, index]));

const bossImpact = {
  burst: 'roar', wave: 'tidal', tail: 'tidal', vortex: 'vortex', lightning: 'lightning', abyss: 'vortex',
};

function cueFor(event, kind, sword) {
  switch (event) {
    case 'cardSelect': return kind === 'ultimate' ? 'selectUltimate' : 'select';
    case 'ultimate': return sword ? 'ultimateSword' : 'ultimateMagic';
    case 'launch':
      if (kind === 'ultimate') return sword ? 'swordRelease' : 'magicRelease';
      return sword ? 'swordSwing' : 'arcaneBolt';
    case 'hit':
      if (kind === 'ultimate') return sword ? 'crimsonImpact' : 'arcaneImpact';
      if (sword) return 'swordHit';
      return kind === 'charge' || kind === 'crescent' ? 'crystalBurst' : 'arcaneHit';
    case 'victoryStrike': return sword ? 'crimsonImpact' : 'arcaneImpact';
    case 'bolt': case 'wave': case 'crescent': case 'aerial':
      return sword ? 'swordReady' : 'arcaneCast';
    case 'charge': return sword ? 'swordDash' : 'crystalCast';
    case 'shield': return sword ? 'swordReady' : 'magicShield';
    case 'dodge': return sword ? 'swordDash' : 'arcaneDash';
    case 'barrierHit': return 'magicShield';
    case 'parry': return 'parry';
    case 'tell': return 'danger';
    case 'impact': return bossImpact[kind] ?? 'roar';
    case 'roar': return 'roar';
    case 'hurt': return 'hurt';
    default: return null;
  }
}

function loadSoundBank(context) {
  if (!banks.has(context)) {
    const loading = fetch(file).then(response => {
      if (!response.ok) throw new Error('Combat sound bank unavailable');
      return response.arrayBuffer();
    }).then(bytes => context.decodeAudioData(bytes)).catch(() => {
      banks.delete(context);
      return null;
    });
    banks.set(context, loading);
  }
  return banks.get(context);
}

export function createCombatSounds(output, fallback) {
  const context = output?.context;
  const voices = new Set();
  let bank;
  if (context) loadSoundBank(context).then(buffer => { bank = buffer; });

  return {
    play(event, kind, hero) {
      if (event === 'heal' && hero === 'yhannie') return; // Healing Light also emits shield.
      const sword = hero === 'loki';
      const cue = cueFor(event, kind, sword);
      const offset = cues.get(cue);
      if (!bank || offset === undefined) {
        if (sword && event === 'launch' && kind !== 'ultimate') fallback('slashSwing', kind);
        else if (sword && event === 'hit' && kind !== 'ultimate') fallback('slashHit', kind);
        else fallback(event, kind);
        return;
      }
      if (output.gain.value <= 0) return;

      const voice = context.createBufferSource();
      voice.buffer = bank;
      voice.connect(output);
      voice.onended = () => {
        voices.delete(voice);
        voice.disconnect();
      };
      voices.add(voice);
      voice.start(context.currentTime + .008, offset, .96);
    },
    stop() {
      for (const voice of voices) {
        voice.stop();
        voice.disconnect();
      }
      voices.clear();
    },
  };
}
