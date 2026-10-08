// ---------- Audio: tiny synth, voice limiting, iOS unlock, offline render for the demo video ----------
const MAXV = 4;
const NOTE = (n) => { const m = /^([A-G])(#?)(\d)$/.exec(n); const s = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0); return 440 * Math.pow(2, (s + (+m[3] + 1) * 12 - 69) / 12); };
const rep = (k, gap, n) => Array.from({ length: k }, (_, i) => Object.assign({}, n, { t: (n.t || 0) + i * gap }));
const SFX = {
  moo: [{ w: 'sawtooth', f: 165, f2: 108, d: 1.1, v: .55, vib: [5, 4], fl: ['lowpass', 650, 3], a: .18 }],
  oink: rep(3, .2, { w: 'sawtooth', f: 260, f2: 150, d: .14, v: .5, fl: ['lowpass', 1100, 6] }),
  baa: [{ w: 'sawtooth', f: 330, f2: 300, d: .8, v: .45, trem: [10, .7], fl: ['bandpass', 1300, 2], a: .05 }],
  quack: rep(2, .24, { w: 'square', f: 560, f2: 380, d: .16, v: .35, fl: ['bandpass', 1100, 4] }),
  neigh: [{ w: 'sawtooth', f: 950, f2: 520, d: .9, v: .35, vib: [14, 40], fl: ['bandpass', 1500, 2] }],
  rooster: [{ w: 'sawtooth', f: 600, f2: 750, d: .18, v: .3, fl: ['bandpass', 1400, 3] }, { t: .2, w: 'sawtooth', f: 650, f2: 800, d: .18, v: .3, fl: ['bandpass', 1400, 3] }, { t: .42, w: 'sawtooth', f: 820, f2: 980, d: .3, v: .32, fl: ['bandpass', 1500, 3] }, { t: .75, w: 'sawtooth', f: 950, f2: 600, d: .5, v: .3, vib: [9, 20], fl: ['bandpass', 1500, 3] }],
  beep: rep(2, .28, { w: 'square', f: 440, d: .2, v: .22 }).concat(rep(2, .28, { w: 'square', f: 554, d: .2, v: .18 })),
  siren: [{ w: 'sine', f: 620, f2: 920, d: .45, v: .35 }, { t: .45, w: 'sine', f: 920, f2: 620, d: .45, v: .35 }, { t: .9, w: 'sine', f: 620, f2: 920, d: .45, v: .35 }],
  choo: rep(2, .45, { w: 'noise', d: .3, v: .4, fl: ['bandpass', 1800, 1.5] }).concat([{ t: .95, w: 'triangle', f: 660, d: .6, v: .3 }, { t: .95, w: 'triangle', f: 830, d: .6, v: .25 }]),
  woof: rep(2, .3, { w: 'sawtooth', f: 330, f2: 140, d: .16, v: .5, fl: ['lowpass', 900, 3] }),
  bell: rep(2, .32, { w: 'sine', f: 2100, d: .28, v: .25, trem: [28, .9] }),
  honk: [{ w: 'square', f: 330, d: .42, v: .22 }, { w: 'square', f: 415, d: .42, v: .2 }],
  snip: rep(2, .18, { w: 'noise', d: .05, v: .5, fl: ['highpass', 3000, 1] }),
  whoosh: [{ w: 'noise', d: 1, v: .45, fl: ['bandpass', 500, 1], a: .4 }],
  toot: rep(2, .35, { w: 'triangle', f: 294, d: .28, v: .45 }),
  arf: rep(2, .3, { w: 'sawtooth', f: 520, f2: 320, d: .18, v: .4, fl: ['lowpass', 1500, 4] }),
  blub: rep(3, .16, { w: 'sine', f: 300, f2: 700, d: .1, v: .45 }),
  hoo: rep(2, .5, { w: 'sine', f: 410, f2: 380, d: .38, v: .5, a: .08 }),
  meow: [{ w: 'sawtooth', f: 520, f2: 820, f3: 430, d: .7, v: .3, fl: ['bandpass', 1400, 3], a: .05 }],
  ribbit: rep(2, .3, { w: 'square', f: 190, d: .2, v: .3, trem: [32, 1], fl: ['lowpass', 900, 2] }),
  chirp: rep(3, .22, { w: 'sine', f: 4200, d: .12, v: .2, trem: [45, 1] }),
  awoo: [{ w: 'sine', f: 380, f2: 700, f3: 480, d: 1.3, v: .45, vib: [5, 8], a: .2 }],
  buzz: [{ w: 'sawtooth', f: 175, d: .9, v: .3, vib: [7, 12], fl: ['lowpass', 1000, 2] }],
  pop: [{ w: 'noise', d: .06, v: .7, fl: ['lowpass', 2500, 1] }, { t: .02, w: 'sine', f: 900, f2: 200, d: .1, v: .4 }],
  yum: rep(2, .28, { w: 'triangle', f: 520, f2: 700, d: .2, v: .4 }),
  flutter: rep(6, .07, { w: 'sine', f: 1600, f2: 2200, d: .05, v: .2 }),
  sparkle: ['E6', 'G6', 'B6', 'E7'].map((n, i) => ({ t: i * .07, w: 'sine', f: NOTE(n), d: .35, v: .22 })),
  star: [{ w: 'sine', f: 1318, d: .12, v: .3 }, { t: .07, w: 'sine', f: 1976, d: .25, v: .3 }],
  confetti: ['C6', 'E6', 'G6', 'C7', 'G6', 'C7'].map((n, i) => ({ t: i * .06, w: 'triangle', f: NOTE(n), d: .2, v: .25 })),
  rainbow: ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'].map((n, i) => ({ t: i * .09, w: 'sine', f: NOTE(n), d: .3, v: .3 })),
  ring: rep(2, .6, { w: 'sine', f: 1400, d: .45, v: .2, trem: [20, 1] }).concat(rep(2, .6, { w: 'sine', f: 1750, d: .45, v: .15, trem: [20, 1] })),
  boing: [{ w: 'sine', f: 180, f2: 620, d: .25, v: .5, vib: [18, 30] }],
  click: [{ w: 'square', f: 1600, d: .03, v: .3 }],
  tick: [{ w: 'square', f: 1200, d: .025, v: .16 }],
  gear0: [{ w: 'sawtooth', f: 70, f2: 60, d: .6, v: .35, fl: ['lowpass', 400, 2] }],
  gear1: [{ w: 'sawtooth', f: 80, f2: 130, d: .6, v: .35, fl: ['lowpass', 500, 2] }],
  gear2: [{ w: 'sawtooth', f: 90, f2: 260, d: .8, v: .38, fl: ['lowpass', 700, 2] }, { t: .1, w: 'noise', d: .7, v: .2, fl: ['bandpass', 700, 1], a: .3 }],
  boop: [{ w: 'sine', f: 330, f2: 260, d: .18, v: .3 }],
  whee: [{ w: 'sine', f: 500, f2: 1200, d: .35, v: .3 }],
  fanfare: [['C5', 0, .16], ['E5', .16, .16], ['G5', .32, .16], ['C6', .48, .5], ['G5', .9, .14], ['C6', 1.05, .7]].flatMap(([n, t, d]) => [{ t, w: 'square', f: NOTE(n), d, v: .14 }, { t, w: 'triangle', f: NOTE(n) / 2, d, v: .3 }]),
  yay: [{ w: 'sine', f: 660, f2: 990, d: .2, v: .3 }, { t: .2, w: 'sine', f: 880, f2: 1320, d: .3, v: .3 }],
};
// Public-domain / traditional melodies. token: note, "/"=half beat, "-"=double, "."=x1.5, "R"=rest
const SONGS = [
  'C4 C4 G4 G4 A4 A4 G4- F4 F4 E4 E4 D4 D4 C4- G4 G4 F4 F4 E4 E4 D4- G4 G4 F4 F4 E4 E4 D4- C4 C4 G4 G4 A4 A4 G4- F4 F4 E4 E4 D4 D4 C4-', // Twinkle Twinkle
  'C4/ F4 F4/ F4/ F4 A4 C5 A4 F4- G4 E4 C4- C5 A4 F4- C4/ F4 F4/ F4/ F4 A4 C5 A4 F4- G4- C4- F4-', // Wheels on the Bus (traditional)
  'C4. C4. C4 D4/ E4. E4 D4/ E4 F4/ G4-. C5/ C5/ C5/ G4/ G4/ G4/ E4/ E4/ E4/ C4/ C4/ C4/ G4 F4/ E4 D4/ C4-.', // Row Row Row Your Boat
  'G4 G4 G4 D4 E4 E4 D4- B4 B4 A4 A4 G4-- R D4 G4 G4 G4 D4 E4 E4 D4- B4 B4 A4 A4 G4--', // Old MacDonald
];
function songNotes(i) {
  const out = []; let t = 0; const beat = 0.36;
  for (const tok of SONGS[i].split(' ')) {
    const m = /^([A-GR]#?\d?)([\/\-.]*)$/.exec(tok); let d = 1;
    for (const c of m[2]) d *= c === '/' ? .5 : c === '-' ? 2 : 1.5;
    if (m[1] !== 'R') { const f = NOTE(m[1]); out.push({ t, w: 'triangle', f, d: Math.max(.18, d * beat * .95), v: .32 }, { t, w: 'sine', f: f * 2, d: Math.min(.3, d * beat), v: .1 }); }
    t += d * beat;
  }
  return out;
}
const noiseCache = new WeakMap();
function noiseBuf(c) { let b = noiseCache.get(c); if (b) return b; b = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = b.getChannelData(0); let s = 7; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823 - 1; } noiseCache.set(c, b); return b; }
function playNotes(c, dest, t0, notes) {
  let end = t0;
  for (const n of notes) {
    const t = t0 + (n.t || 0), d = n.d, v = n.v == null ? .5 : n.v, a = Math.min(n.a == null ? .01 : n.a, d / 2);
    let src;
    if (n.w === 'noise') { src = c.createBufferSource(); src.buffer = noiseBuf(c); src.loop = true; }
    else { src = c.createOscillator(); src.type = n.w || 'sine'; src.frequency.setValueAtTime(n.f, t);
      if (n.f3) { src.frequency.exponentialRampToValueAtTime(n.f2, t + d * .4); src.frequency.exponentialRampToValueAtTime(n.f3, t + d); }
      else if (n.f2) src.frequency.exponentialRampToValueAtTime(n.f2, t + d); }
    let node = src;
    if (n.fl) { const q = c.createBiquadFilter(); q.type = n.fl[0]; q.frequency.value = n.fl[1]; q.Q.value = n.fl[2] || 1; node.connect(q); node = q; }
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + Math.max(a, d - .06)); g.gain.linearRampToValueAtTime(0.0001, t + d);
    node.connect(g);
    if (n.vib && src.frequency) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = n.vib[0]; lg.gain.value = n.vib[1]; l.connect(lg); lg.connect(src.frequency); l.start(t); l.stop(t + d + .05); }
    if (n.trem) { const tg = c.createGain(), l = c.createOscillator(), lg = c.createGain(); tg.gain.value = 1 - n.trem[1] / 2; l.frequency.value = n.trem[0]; lg.gain.value = n.trem[1] / 2; l.connect(lg); lg.connect(tg.gain); l.start(t); l.stop(t + d + .05); g.connect(tg); tg.connect(dest); }
    else g.connect(dest);
    src.start(t); src.stop(t + d + .05); end = Math.max(end, t + d);
  }
  return end;
}
// An Engine wraps one AudioContext (live or offline) with its own voice bookkeeping.
function makeEngine(c, gain) {
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 6;
  const master = c.createGain(); master.gain.value = gain; master.connect(comp); comp.connect(c.destination);
  return { c, master, voices: [], lastBy: {}, song: null, maxSeen: 0 };
}
function killBus(bus, t) { try { bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + .05); setTimeout(() => { try { bus.disconnect(); } catch (e) {} }, 400); } catch (e) {} }
function engSfx(E, name, t) {
  const notes = SFX[name]; if (!notes) return false;
  if (t - (E.lastBy[name] ?? -9) < .12) return false; E.lastBy[name] = t;
  E.voices = E.voices.filter((v) => v.end > t);
  while (E.voices.length >= MAXV) killBus(E.voices.shift().bus, t);
  const bus = E.c.createGain(); bus.connect(E.master);
  const end = playNotes(E.c, bus, t + .005, notes); E.voices.push({ bus, end, name });
  E.maxSeen = Math.max(E.maxSeen, E.voices.length); return true;
}
function engSong(E, i, t) {
  engStopSong(E, t);
  if (i < 0) return;
  const bus = E.c.createGain(); bus.gain.value = .9; bus.connect(E.master);
  const end = playNotes(E.c, bus, t + .02, songNotes(i)); E.song = { bus, end, i };
}
function engStopSong(E, t) { if (E.song) { killBus(E.song.bus, t); E.song = null; } }
