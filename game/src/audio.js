// Aurum After Hours — tiny WebAudio synth: clicks, chimes, alarm pulses.
// No audio files, no network. Starts lazily on the first user gesture.

let ctx = null;
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, dur, type = "sine", gain = 0.05, when = 0) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  unlock() { ac(); },
  step() { tone(190, 0.05, "triangle", 0.012); },
  loot() { tone(880, 0.09, "sine", 0.05); tone(1318, 0.14, "sine", 0.05, 0.07); },
  ledger() { tone(659, 0.12, "sine", 0.06); tone(988, 0.12, "sine", 0.06, 0.1); tone(1318, 0.22, "sine", 0.06, 0.2); },
  cut() { tone(2400, 0.06, "sawtooth", 0.02); tone(1800, 0.08, "sawtooth", 0.02, 0.05); },
  chime() { tone(1568, 0.3, "sine", 0.045); tone(2093, 0.4, "sine", 0.03, 0.05); },
  alarmPulse() { tone(520, 0.16, "square", 0.02); },
  caught() { tone(220, 0.5, "sawtooth", 0.06); tone(165, 0.7, "sawtooth", 0.06, 0.15); },
  win() { tone(523, 0.12, "sine", 0.05); tone(659, 0.12, "sine", 0.05, 0.1); tone(784, 0.12, "sine", 0.05, 0.2); tone(1046, 0.3, "sine", 0.06, 0.3); },
};
