// ---------- Hannah's Big Drive: game ----------
(function () {
'use strict';
const Q = new URLSearchParams(location.search), DEMO = Q.has('demo');
const $ = (s) => document.querySelector(s);
const pd = (e) => { if (e.cancelable) e.preventDefault(); };
let seed = DEMO ? 20261007 : (Date.now() % 2147483646) + 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PER = 10; // stars needed to finish a place
const SCENES = [
  { id: 'farm', name: 'Farm', sticker: '🚜', deco: ['🌳', '🌻', '🌾', '🌳'], things: [['🐄', 'Cow', 'Moo!', 'moo'], ['🐖', 'Pig', 'Oink oink!', 'oink'], ['🐑', 'Sheep', 'Baa!', 'baa'], ['🦆', 'Duck', 'Quack quack!', 'quack'], ['🐎', 'Horse', 'Neigh!', 'neigh'], ['🐓', 'Rooster', 'Cock-a-doodle-doo!', 'rooster']] },
  { id: 'city', name: 'City', sticker: '🏙️', deco: ['🏢', '🌳', '🚦', '🏬'], things: [['🚌', 'Bus', 'Beep beep!', 'beep'], ['🚒', 'Fire truck', 'Wee-oo wee-oo!', 'siren'], ['🚂', 'Train', 'Choo choo!', 'choo'], ['🐕', 'Dog', 'Woof woof!', 'woof'], ['🚲', 'Bike', 'Ring ring!', 'bell'], ['🚕', 'Taxi', 'Honk honk!', 'honk']] },
  { id: 'beach', name: 'Beach', sticker: '🏖️', deco: ['🌴', '⛱️', '🐚', '🌴'], things: [['🦀', 'Crab', 'Snip snip!', 'snip'], ['🐳', 'Whale', 'Whoosh!', 'whoosh'], ['🐢', 'Turtle', 'Hello, turtle!', 'sparkle'], ['⛵', 'Boat', 'Toot toot!', 'toot'], ['🦭', 'Seal', 'Arf arf!', 'arf'], ['🐠', 'Fish', 'Blub blub!', 'blub']] },
  { id: 'night', name: 'Night time', sticker: '🌙', deco: ['🌲', '🏡', '🌲', '🍄'], things: [['🦉', 'Owl', 'Hoo hoo!', 'hoo'], ['🐈', 'Cat', 'Meow!', 'meow'], ['🐸', 'Frog', 'Ribbit!', 'ribbit'], ['🦗', 'Cricket', 'Chirp chirp!', 'chirp'], ['🐺', 'Wolf', 'Awoo!', 'awoo'], ['🦔', 'Hedgehog', 'Sniff sniff!', 'boop']] },
  { id: 'rainbow', name: 'Rainbow land', sticker: '🌈', deco: ['🍭', '🌸', '🍄', '🌷'], things: [['🦄', 'Unicorn', 'Neigh! Sparkle!', 'neigh'], ['🦋', 'Butterfly', 'Flutter flutter!', 'flutter'], ['🐝', 'Bee', 'Buzz buzz!', 'buzz'], ['🎈', 'Balloon', 'Pop!', 'pop'], ['🐞', 'Ladybug', 'Hello, ladybug!', 'sparkle'], ['🍦', 'Ice cream', 'Yum yum!', 'yum']] },
];
const ALL_THINGS = SCENES.flatMap((s) => s.things);
const COLORS = { red: '#ff3b3b', orange: '#ff8c1a', yellow: '#ffd60a', green: '#2ecc40', blue: '#2f80ff', purple: '#a35cff' };
const COLOR_BTN = { red: 'shapes', orange: 'animal', yellow: 'stars', green: 'phone', blue: 'rainbow', purple: 'music' };
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const NUMS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five'];
const SPEEDS = [3.2, 5.6, 9.5];
const KEY = 'hannahsBigDrive.v1';
// ---------- saved progress + settings ----------
const P0 = () => ({ stars: 0, sceneStars: [0, 0, 0, 0, 0], done: [false, false, false, false, false], unlocked: 1, met: {}, trophy: false });
let P = P0(), S = { vol: .6, muted: false, voice: true, quiz: true };
let storageOK = false;
try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && !DEMO) { P = Object.assign(P0(), j.P || {}); S = Object.assign(S, j.S || {}); } storageOK = true; } catch (e) {}
function save() { if (DEMO) return; try { localStorage.setItem(KEY, JSON.stringify({ P, S })); } catch (e) {} }
// ---------- game state ----------
const G = { time: 0, running: false, gear: 1, carX: 0, wheel: 0, wheelHeld: false, keySteer: 0, lights: false, hazardUntil: -1, scene: 0, sceneAt: -9, dist: 0,
  items: [], nextThing: 14, nextStar: 8, nextDeco: 2, parts: [], conf: [], rainbowAt: -99, shape: null, bubble: null, yay: null, quiz: null, nextQuiz: 28,
  hornAt: -9, press: {}, songUntil: -1, songIdx: -1, bookOpen: false, parentOpen: false, nudge: 0, frames: 0 };
const LOG = []; let saidCount = 0;
const logE = (type, name) => { LOG.push({ t: +G.time.toFixed(2), type, name }); if (LOG.length > 2000) LOG.splice(0, 500); };
// ---------- audio glue ----------
let E = null, unlocked = false; const REC = [];
function ensureAudio() {
  if (E) return E; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iOS 17+: play even with the silent switch on
  try { E = makeEngine(new AC(), 0); applyVol(); } catch (e) { E = null; } return E;
}
function applyVol() { if (E) E.master.gain.value = S.muted ? 0 : S.vol * .55; }
function unlockAudio() {
  const e = ensureAudio(); if (!e) return;
  if (e.c.state !== 'running') { try { e.c.resume(); } catch (x) {} }
  if (!unlocked) { // iOS Safari: a silent buffer started inside a touchend/click unlocks Web Audio
    try { const b = e.c.createBuffer(1, 1, 22050), s = e.c.createBufferSource(); s.buffer = b; s.connect(e.c.destination); s.start(0); } catch (x) {}
    try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (x) {}
    unlocked = true; logE('unlock', e.c.state);
  }
}
function sfx(name) { REC.push({ t: G.time, k: 'sfx', name }); logE('sfx', name); if (E && !DEMO && E.c.state === 'running') engSfx(E, name, E.c.currentTime); }
function song(i) { REC.push({ t: G.time, k: 'song', i }); logE('song', i); if (E && !DEMO && E.c.state === 'running') engSong(E, i, E.c.currentTime); }
let lastSay = -9, voice = null;
function pickVoice() { try { const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); voice = vs.find((v) => /Samantha|Karen|Moira|Tessa|Google US|Aria|Jenny/i.test(v.name)) || vs.find((v) => /en-US/i.test(v.lang)) || vs[0] || null; } catch (e) {} }
if (window.speechSynthesis) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {} }
function say(text, prio) {
  logE('say', text); REC.push({ t: G.time, k: 'say', text });
  const now = performance.now(); if (!prio && now - lastSay < 900) return; lastSay = now;
  if (DEMO || !S.voice || S.muted || !window.speechSynthesis) return;
  try {
    const go = () => { const u = new SpeechSynthesisUtterance(text); u.rate = .92; u.pitch = 1.25; u.volume = clamp(S.vol * 1.4, .2, 1); if (voice) u.voice = voice; speechSynthesis.speak(u); saidCount++; };
    const busy = speechSynthesis.speaking || speechSynthesis.pending; speechSynthesis.cancel(); // never queue: newest wins
    if (busy) setTimeout(go, 70); else go();
  } catch (e) {}
}
// ---------- emoji sprite cache (fast drawImage instead of fillText each frame) ----------
const EMO = new Map();
function emo(e) { let c = EMO.get(e); if (c) return c; c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.font = '100px "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72); EMO.set(e, c); return c; }
// ---------- DOM refs ----------
const road = $('#road'), rc = road.getContext('2d'), fx = $('#fx'), fc = fx.getContext('2d');
const wheelEl = $('#wheel'), wheelArea = $('#wheelArea'), gearEl = $('#gear'), knob = $('#gknob');
const BTN = {}; document.querySelectorAll('.btn').forEach((b) => (BTN[b.dataset.k] = b));
let W = 0, H = 0, FW = 0, FH = 0, DPR = 1;
function layout() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  const r = road.getBoundingClientRect(); W = Math.max(50, r.width); H = Math.max(50, r.height);
  road.width = Math.round(W * DPR); road.height = Math.round(H * DPR);
  FW = innerWidth; FH = innerHeight; fx.width = Math.round(FW * DPR); fx.height = Math.round(FH * DPR);
  const a = wheelArea.getBoundingClientRect(); const s = Math.max(120, Math.min(a.width, a.height) * .98); wheelEl.style.width = wheelEl.style.height = s + 'px';
  render();
}
addEventListener('resize', layout); addEventListener('orientationchange', () => setTimeout(layout, 250));
// ---------- actions ----------
const BUMP = (k) => { G.press[k] = G.time; };
function bubble(e, text, dur = 2.4) { G.bubble = { e, text, t: G.time, dur }; }
function addConfetti(n, x, y) { for (let i = 0; i < n && G.conf.length < 260; i++) { const a = rnd() * Math.PI * 2, sp = 200 + rnd() * 520; G.conf.push({ x: x ?? FW / 2, y: y ?? FH * .45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 300, r: 8 + rnd() * 12, rot: rnd() * 6, vr: (rnd() - .5) * 10, c: pick(Object.values(COLORS).concat(['#ff6fb5', '#fff'])), life: 2.2 + rnd() }); } }
function meet(th) { if (!P.met[th[0]]) { P.met[th[0]] = 1; save(); } }
const lastTap = {};
const ACT = {
  phone() { sfx('ring'); bubble('📞', 'Hello!'); setTimeoutG(1.1, () => say('Hello, Hannah! Beep beep!', true)); },
  music() { G.songIdx = (G.songIdx + 1) % SONGS.length; song(G.songIdx); G.songUntil = G.time + songNotes(G.songIdx).slice(-1)[0].t + .6; bubble('🎵', ['Twinkle twinkle', 'Wheels on the bus', 'Row your boat', 'Old MacDonald'][G.songIdx], 2); },
  stars() { sfx('confetti'); const r = BTN.stars.getBoundingClientRect(); addConfetti(70, r.left + r.width / 2, r.top + r.height / 2); addConfetti(50); say('Stars!'); },
  animal() { const th = pick(SCENES[G.scene].things); sfx(th[3]); bubble(th[0], th[1] + '! ' + th[2]); say(th[1] + '! ' + th[2], true); meet(th); },
  shapes() { const c = pick(Object.keys(COLORS)), s = pick(SHAPES); G.shape = { c, s, t: G.time }; sfx('boing'); say(c[0].toUpperCase() + c.slice(1) + ' ' + s + '!', true); },
  rainbow() { G.rainbowAt = G.time; sfx('rainbow'); say('Rainbow!'); },
  scene() { if (P.unlocked < 2) { sfx('boop'); bubble('⭐', 'Catch stars to drive somewhere new!'); say('Catch the stars!', true); return; } setScene((G.scene + 1) % P.unlocked); },
  book() { openBook(); },
};
function setScene(n, quiet) { G.scene = n; G.sceneAt = G.time; G.items = []; G.nextThing = G.dist + 10; G.nextStar = G.dist + 5; sfx('whee'); if (!quiet) { say(SCENES[n].name + '!', true); bubble(SCENES[n].sticker, SCENES[n].name, 2); } logE('scene', SCENES[n].id); }
function press(k) {
  const now = G.time; if (now - (lastTap[k] ?? -9) < .15) return; lastTap[k] = now;
  BUMP(k); logE('btn', k); ACT[k](); quizCheck('btn', k);
}
function horn() { if (G.time - G.hornAt < .2) return; G.hornAt = G.time; BUMP('horn'); sfx('honk'); logE('btn', 'horn'); quizCheck('horn'); }
function toggleLights() { G.lights = !G.lights; sfx('click'); say(G.lights ? 'Lights on!' : 'Lights off!'); logE('btn', 'lights'); BUMP('lights'); }
function toggleHazard() { G.hazardUntil = G.hazardUntil > G.time ? -1 : G.time + 10; sfx('click'); logE('btn', 'hazard'); BUMP('hazard'); if (G.hazardUntil > 0) say('Blinky lights!'); }
function setGear(g) { if (g === G.gear) return; G.gear = g; sfx('gear' + g); say(['Slow and steady.', 'Vroom!', 'Zoom zoom!'][g]); logE('gear', g); }
// game-clock timers (deterministic in the video)
const TIMERS = []; function setTimeoutG(dt, f) { TIMERS.push({ at: G.time + dt, f }); }
// ---------- quiz (gentle questions; nothing bad happens if ignored) ----------
function startQuiz() {
  if (rnd() < .68) { const c = pick(Object.keys(COLOR_BTN)); G.quiz = { type: 'color', c, k: COLOR_BTN[c], t: G.time }; say('Can you tap the ' + c + ' button?', true); }
  else { const n = 2 + Math.floor(rnd() * 3); G.quiz = { type: 'count', n, got: 0, t: G.time }; say('Honk the horn ' + NUMS[n].toLowerCase() + ' times!', true); }
  logE('quiz', G.quiz.type === 'color' ? G.quiz.c : 'horn x' + G.quiz.n);
}
function quizCheck(kind, k) {
  const q = G.quiz; if (!q) return;
  if (q.type === 'color' && kind === 'btn' && k === q.k) return praise();
  if (q.type === 'count' && kind === 'horn') { q.got++; say(NUMS[Math.min(5, q.got)] + '!', true); if (q.got >= q.n) setTimeoutG(.6, praise); }
}
function praise() { G.quiz = null; G.nextQuiz = G.time + 40 + rnd() * 25; sfx('yay'); addConfetti(90); say(pick(['Yay! Great job, Hannah!', 'You did it! Super!', 'Wow, Hannah! Amazing!', 'High five, Hannah!']), true); logE('praise', 1); gainStar(true); }
// ---------- stars + progression ----------
function gainStar(bonus) {
  P.stars++; const sc = G.scene; P.sceneStars[sc] = Math.min(PER, P.sceneStars[sc] + 1); G.starPop = G.time;
  if (!bonus) sfx('star');
  if (P.sceneStars[sc] >= PER && !P.done[sc]) {
    P.done[sc] = true; const nu = Math.min(SCENES.length, sc + 2); const fresh = nu > P.unlocked; P.unlocked = Math.max(P.unlocked, nu);
    if (sc === SCENES.length - 1) P.trophy = true;
    G.yay = { t: G.time, sc, next: fresh ? nu - 1 : -1 }; $('#yaybig').textContent = SCENES[sc].sticker; $('#yay').classList.add('show');
    sfx('fanfare'); addConfetti(160); say(sc === SCENES.length - 1 ? 'You did it, Hannah! You drove everywhere!' : 'You did it, Hannah!', true); logE('yay', SCENES[sc].id);
  }
  save();
}
function endYay() { const y = G.yay; if (!y) return; G.yay = null; $('#yay').classList.remove('show'); if (y.next >= 0) setScene(y.next); }
// ---------- sticker book ----------
function openBook() {
  G.bookOpen = true; sfx('sparkle'); say("Hannah's stickers!", true);
  $('#btotal').textContent = '⭐ ' + P.stars;
  $('#bscenes').innerHTML = SCENES.map((s, i) => `<div class="sst ${P.done[i] ? 'got' : ''}" data-s="${i}"><span class="${P.done[i] ? '' : 'lock'}">${s.sticker}</span>${P.sceneStars[i] ? `<span class="n">${P.sceneStars[i]}</span>` : ''}</div>`).join('') +
    `<div class="sst ${P.trophy ? 'got' : ''}"><span class="${P.trophy ? '' : 'lock'}">🏆</span></div>`;
  $('#bthings').innerHTML = ALL_THINGS.map((t, i) => `<div class="tst" data-i="${i}"><span class="${P.met[t[0]] ? '' : 'lock'}">${t[0]}</span></div>`).join('');
  $('#book').classList.add('show'); logE('book', 'open');
}
function closeBook() { G.bookOpen = false; $('#book').classList.remove('show'); sfx('pop'); logE('book', 'close'); }
$('#bthings').addEventListener('pointerup', (e) => { const el = e.target.closest('.tst'); if (!el) return; const t = ALL_THINGS[+el.dataset.i]; if (P.met[t[0]]) { sfx(t[3]); say(t[1] + '! ' + t[2], true); } else sfx('boop'); });
$('#bscenes').addEventListener('pointerup', (e) => { const el = e.target.closest('.sst'); if (!el || el.dataset.s == null) return; const i = +el.dataset.s; if (P.done[i]) { sfx('sparkle'); say(SCENES[i].name + '!', true); } else { sfx('boop'); say(NUMS[Math.min(5, P.sceneStars[i])] === 'Zero' ? 'Catch the stars!' : 'Keep catching stars!', true); } });
$('#bclose').addEventListener('pointerdown', (e) => { pd(e); closeBook(); });
// ---------- input ----------
Object.entries(BTN).forEach(([k, b]) => b.addEventListener('pointerdown', (e) => { pd(e); press(k); }));
$('#lights').addEventListener('pointerdown', (e) => { pd(e); toggleLights(); });
$('#hazard').addEventListener('pointerdown', (e) => { pd(e); toggleHazard(); });
let gearDrag = null;
gearEl.addEventListener('pointerdown', (e) => { pd(e); try { gearEl.setPointerCapture(e.pointerId); } catch (x) {} gearDrag = { id: e.pointerId, y: e.clientY, moved: false }; });
gearEl.addEventListener('pointermove', (e) => { if (!gearDrag || e.pointerId !== gearDrag.id) return; if (Math.abs(e.clientY - gearDrag.y) > 12) { gearDrag.moved = true; const r = gearEl.getBoundingClientRect(); const f = 1 - (e.clientY - r.top) / r.height; setGear(clamp(Math.round((f - .16) / .34), 0, 2)); } });
gearEl.addEventListener('pointerup', (e) => { if (!gearDrag) return; if (!gearDrag.moved) setGear((G.gear + 1) % 3); gearDrag = null; });
gearEl.addEventListener('pointercancel', () => (gearDrag = null));
let wd = null;
const angAt = (e) => { const r = wheelEl.getBoundingClientRect(); return { a: Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)), d: Math.hypot(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) / (r.width / 2) }; };
wheelEl.addEventListener('pointerdown', (e) => { pd(e); if (wd) return; try { wheelEl.setPointerCapture(e.pointerId); } catch (x) {} const p = angAt(e); wd = { id: e.pointerId, last: p.a, travel: 0, d0: p.d }; G.wheelHeld = true; });
wheelEl.addEventListener('pointermove', (e) => { if (!wd || e.pointerId !== wd.id) return; const p = angAt(e); let d = p.a - wd.last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; wd.last = p.a; wd.travel += Math.abs(d); G.wheel = clamp(G.wheel + d * 180 / Math.PI, -160, 160); });
const wheelUp = (e) => { if (!wd || e.pointerId !== wd.id) return; if (wd.travel < .12 && wd.d0 < .48) horn(); wd = null; G.wheelHeld = false; };
wheelEl.addEventListener('pointerup', wheelUp); wheelEl.addEventListener('pointercancel', wheelUp);
road.addEventListener('pointerdown', (e) => { pd(e); const r = road.getBoundingClientRect(); const fxp = (e.clientX - r.left) / r.width; G.nudge = fxp < .4 ? -1 : fxp > .6 ? 1 : 0; G.nudgeUntil = G.time + .7; if (!G.nudge) horn(); });
addEventListener('keydown', (e) => { if (e.repeat) return; if (e.key === 'ArrowLeft') G.keySteer = -1; else if (e.key === 'ArrowRight') G.keySteer = 1; else if (e.key === ' ') horn(); else if (e.key === 'Escape') openParent(); });
addEventListener('keyup', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') G.keySteer = 0; });
$('#yay').addEventListener('pointerdown', (e) => { pd(e); if (G.yay && G.time - G.yay.t > 2) endYay(); });
// toddler-proofing: no zoom, scroll, long-press menus, double-tap zoom, pinch
const inParent = (e) => e.target && e.target.closest && e.target.closest('#parent,#bthings');
document.addEventListener('touchmove', (e) => { if (!inParent(e)) pd(e); }, { passive: false });
document.addEventListener('touchstart', (e) => { if (e.touches.length > 1 && !inParent(e)) pd(e); }, { passive: false });
['gesturestart', 'gesturechange', 'dblclick', 'contextmenu', 'selectstart', 'dragstart'].forEach((t) => document.addEventListener(t, (e) => { if (!inParent(e)) pd(e); }, { passive: false }));
['touchend', 'click', 'pointerup', 'keydown'].forEach((t) => document.addEventListener(t, () => { if (G.running) unlockAudio(); }, true));
let allowBack = false;
addEventListener('popstate', () => { if (!allowBack && G.running) { try { history.pushState({ hbd: 1 }, ''); } catch (e) {} } });
let wakeLock = null;
async function keepAwake() { try { if (navigator.wakeLock && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => (wakeLock = null)); } } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (E) engStopSong(E, E.c.currentTime); try { speechSynthesis.cancel(); } catch (e) {} } else if (G.running) { keepAwake(); } });
function goFull() { const d = document.documentElement; try { const f = d.requestFullscreen || d.webkitRequestFullscreen; if (f && !document.fullscreenElement && !document.webkitFullscreenElement) { const p = f.call(d); if (p && p.catch) p.catch(() => {}); } } catch (e) {} }
function exitFull() { try { const f = document.exitFullscreen || document.webkitExitFullscreen; if (f && (document.fullscreenElement || document.webkitFullscreenElement)) { const p = f.call(document); if (p && p.catch) p.catch(() => {}); } } catch (e) {} }
function start() {
  if (G.running) return; unlockAudio(); G.running = true; $('#start').classList.remove('show'); allowBack = false;
  try { history.pushState({ hbd: 1 }, ''); } catch (e) {}
  if (!DEMO) { goFull(); keepAwake(); }
  sfx('gear1'); say("Let's drive, Hannah!", true); logE('start', 1);
}
$('#go').addEventListener('click', start);
$('#go').addEventListener('touchend', (e) => { pd(e); start(); });
// ---------- parent corner (long-press 1.5 s) ----------
let pcDown = null; const pc = $('#pc');
pc.addEventListener('pointerdown', (e) => { pd(e); e.stopPropagation(); pcDown = performance.now(); });
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => pc.addEventListener(t, () => { pcDown = null; pc.style.setProperty('--p', '0%'); }));
function openParent() { pcDown = null; pc.style.setProperty('--p', '0%'); G.parentOpen = true; $('#parent').classList.add('show'); syncParent(); logE('parent', 'open'); }
function syncParent() { $('#pvol').value = S.vol; $('#pmute').textContent = S.muted ? 'Sound OFF' : 'Sound on'; $('#pmute').classList.toggle('on', !S.muted); $('#pvoice').textContent = S.voice ? 'Talking on' : 'Talking OFF'; $('#pvoice').classList.toggle('on', S.voice); $('#pquiz').textContent = S.quiz ? 'Questions on' : 'Questions OFF'; $('#pquiz').classList.toggle('on', S.quiz); }
$('#pvol').addEventListener('input', (e) => { S.vol = +e.target.value; applyVol(); save(); });
$('#pmute').addEventListener('click', () => { S.muted = !S.muted; applyVol(); if (S.muted) { try { speechSynthesis.cancel(); } catch (e) {} } syncParent(); save(); });
$('#pvoice').addEventListener('click', () => { S.voice = !S.voice; syncParent(); save(); });
$('#pquiz').addEventListener('click', () => { S.quiz = !S.quiz; G.quiz = null; syncParent(); save(); });
$('#pfs').addEventListener('click', goFull);
let resetArm = 0;
$('#preset').addEventListener('click', () => { if (Date.now() - resetArm < 3000) { P = P0(); save(); G.scene = 0; $('#preset').textContent = 'Stickers reset'; resetArm = 0; } else { resetArm = Date.now(); $('#preset').textContent = 'Tap again to reset'; } });
$('#pexit').addEventListener('click', () => { allowBack = true; exitFull(); G.running = false; G.parentOpen = false; $('#parent').classList.remove('show'); $('#start').classList.add('show'); if (E) engStopSong(E, E.c.currentTime); });
$('#pclose').addEventListener('click', () => { G.parentOpen = false; $('#parent').classList.remove('show'); });
// ---------- update ----------
function update(dt) {
  G.time += dt; G.frames++;
  for (let i = TIMERS.length - 1; i >= 0; i--) if (TIMERS[i].at <= G.time) { const t = TIMERS.splice(i, 1)[0]; t.f(); }
  if (pcDown && performance.now() - pcDown > 1500) openParent(); else if (pcDown) pc.style.setProperty('--p', Math.min(100, (performance.now() - pcDown) / 15) + '%');
  const paused = G.bookOpen || G.parentOpen || !G.running;
  // steering: wheel angle → car position; wheel springs back gently when let go
  let target = G.wheel;
  if (!G.wheelHeld) { if (G.keySteer) G.wheel = clamp(G.wheel + G.keySteer * 260 * dt, -140, 140); else if (G.nudge && G.time < G.nudgeUntil) G.wheel += (G.nudge * 100 - G.wheel) * Math.min(1, dt * 8); else G.wheel *= Math.exp(-1.6 * dt); }
  target = clamp(G.wheel / 110, -1, 1) * .9;
  G.carX += (target - G.carX) * Math.min(1, dt * 5);
  if (paused) return;
  const sp = SPEEDS[G.gear] * (G.yay ? .5 : 1); G.dist += sp * dt;
  if (G.hazardUntil > 0 && G.time > G.hazardUntil) G.hazardUntil = -1;
  if (G.hazardUntil > 0) { const ph = Math.floor(G.time * 2.4); if (ph !== G.hzPh) { G.hzPh = ph; sfx('tick'); } }
  const sc = SCENES[G.scene];
  if (!G.yay) {
    if (G.dist > G.nextDeco) { G.items.push({ kind: 'deco', e: pick(sc.deco), x: (rnd() < .5 ? -1 : 1) * (1.5 + rnd() * 1.4), z: 30 }); G.nextDeco = G.dist + 2.2 + rnd() * 2.5; }
    if (G.dist > G.nextThing) { const th = pick(sc.things); G.items.push({ kind: 'thing', th, e: th[0], x: (rnd() < .5 ? -1 : 1) * (1.35 + rnd() * .3), z: 30 }); G.nextThing = G.dist + 16 + rnd() * 12; }
    if (G.dist > G.nextStar) { const lane = pick([-.62, -.62, 0, .62, .62]); for (let i = 0; i < 3; i++) G.items.push({ kind: 'star', x: lane, z: 30 + i * 1.6 }); G.nextStar = G.dist + 14 + rnd() * 8; }
  }
  for (const it of G.items) {
    it.z -= sp * dt;
    if (it.kind === 'star' && !it.got && it.z < 1.35 && it.z > .45 && Math.abs(it.x - G.carX) < .5) { it.got = true; it.gotAt = G.time; gainStar(false); burst(it); }
    if (it.kind === 'thing' && !it.said && it.z < 4) { it.said = true; const th = it.th; sfx(th[3]); bubble(th[0], th[1] + '! ' + th[2]); say(th[1] + '! ' + th[2]); meet(th); }
  }
  G.items = G.items.filter((it) => it.z > -1.2 && !(it.got && G.time - it.gotAt > .5));
  if (G.items.length > 80) G.items.splice(0, G.items.length - 80);
  if (G.yay && G.time - G.yay.t > 4.6) endYay();
  if (S.quiz && !G.quiz && !G.yay && G.time > G.nextQuiz) startQuiz();
  if (G.quiz) { const q = G.quiz; if (q.type === 'color') BTN[q.k].classList.toggle('hint', G.time - q.t > 4 && Math.floor(G.time * 3) % 2 === 0); if (G.time - q.t > 16) { if (q.type === 'color') BTN[q.k].classList.remove('hint'); G.quiz = null; G.nextQuiz = G.time + 35 + rnd() * 20; logE('quiz', 'timeout'); } }
  else document.querySelectorAll('.btn.hint').forEach((b) => b.classList.remove('hint'));
  if (G.quiz === null) {} // nothing
}
function burst(it) { for (let i = 0; i < 10 && G.parts.length < 120; i++) { const a = rnd() * 6.28; G.parts.push({ x: it.x, a, t: G.time, sp: .6 + rnd() * .8 }); } }
// ---------- render ----------
function proj(x, z) { const s = 1 / (Math.max(-.9, z) * .35 + 1), hor = H * .4; return [W / 2 + x * W * .42 * s, hor + (H - hor) * s, s]; }
function starPath(c, x, y, r, rot = 0) { c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, a = rot - Math.PI / 2 + i * Math.PI / 5; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
function heartPath(c, x, y, r) { c.beginPath(); c.moveTo(x, y + r * .8); c.bezierCurveTo(x - r * 1.4, y - r * .1, x - r * .6, y - r * 1.1, x, y - r * .4); c.bezierCurveTo(x + r * .6, y - r * 1.1, x + r * 1.4, y - r * .1, x, y + r * .8); c.closePath(); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const SKY = { farm: ['#5fb8ff', '#d5f1ff', '#79cc4a', '#5aa83a'], city: ['#79b7ff', '#e3f0ff', '#9aa5b1', '#7f8b97'], beach: ['#4fc3ff', '#d8f6ff', '#f6dc8e', '#ecc770'], night: ['#0b1238', '#2a2f6b', '#1d4a2e', '#143720'], rainbow: ['#ffb3e1', '#e6d6ff', '#a6f0c9', '#7fe0b1'] };
function drawScene(c) {
  const sc = SCENES[G.scene], k = SKY[sc.id], hor = H * .4, t = G.time;
  let g = c.createLinearGradient(0, 0, 0, hor); g.addColorStop(0, k[0]); g.addColorStop(1, k[1]); c.fillStyle = g; c.fillRect(0, 0, W, hor + 1);
  if (sc.id === 'night') { for (let i = 0; i < 40; i++) { const x = (i * 97.3 % 1) * W, y = ((i * 57.7) % 1) * hor * .9; const tw = .5 + .5 * Math.sin(t * 3 + i); c.fillStyle = `rgba(255,255,220,${.4 + .6 * tw})`; starPath(c, x, y, 1.5 + 2.5 * tw); c.fill(); } c.drawImage(emo('🌙'), W * .78, hor * .08, hor * .42, hor * .42); }
  else if (sc.id !== 'city') c.drawImage(emo('☀️'), W * .78, hor * .05, hor * .4, hor * .4);
  // clouds
  if (sc.id !== 'night') for (let i = 0; i < 3; i++) { const x = ((i * .37 + t * .012 * (i + 1)) % 1.3 - .15) * W, y = hor * (.18 + i * .2); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(x, y, W * .06, hor * .07, 0, 0, 7); c.ellipse(x + W * .05, y - hor * .04, W * .05, hor * .08, 0, 0, 7); c.ellipse(x + W * .1, y, W * .055, hor * .06, 0, 0, 7); c.fill(); }
  if (sc.id === 'rainbow' || G.time - G.rainbowAt < 4) { const a = sc.id === 'rainbow' ? 1 : Math.min(1, (4 - (G.time - G.rainbowAt)) * 1.5, (G.time - G.rainbowAt) * 3); c.save(); c.globalAlpha = a * .9; const cols = ['#ff3b3b', '#ff8c1a', '#ffd60a', '#2ecc40', '#2f80ff', '#a35cff']; cols.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = hor * .07; c.beginPath(); c.arc(W / 2, hor * 1.05, hor * (.95 - i * .07), Math.PI, 0); c.stroke(); }); c.restore(); }
  if (sc.id === 'city') { for (let i = 0; i < 14; i++) { const bw = W / 14, bh = hor * (.25 + ((i * 37) % 11) / 22); c.fillStyle = ['#5c6b8a', '#6f7fa3', '#4e5b78'][i % 3]; c.fillRect(i * bw, hor - bh, bw - 2, bh); c.fillStyle = '#ffe98a'; for (let y = hor - bh + 6; y < hor - 6; y += 10) for (let x = i * bw + 4; x < (i + 1) * bw - 6; x += 8) if ((x * 7 + y * 3) % 5 < 2) c.fillRect(x, y, 3, 4); } }
  if (sc.id === 'farm') { c.fillStyle = '#8fd15a'; c.beginPath(); c.ellipse(W * .2, hor, W * .3, hor * .16, 0, Math.PI, 0); c.ellipse(W * .75, hor, W * .35, hor * .2, 0, Math.PI, 0); c.fill(); }
  if (sc.id === 'beach') { c.fillStyle = '#1f9be8'; c.fillRect(0, hor - hor * .1, W, hor * .1 + 2); c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 8; i++) c.fillRect(((i * .13 + t * .03) % 1) * W, hor - hor * .06, W * .04, 2); }
  if (sc.id === 'night') { c.fillStyle = '#26326b'; c.beginPath(); c.ellipse(W * .3, hor, W * .4, hor * .18, 0, Math.PI, 0); c.fill(); }
  g = c.createLinearGradient(0, hor, 0, H); g.addColorStop(0, k[3]); g.addColorStop(1, k[2]); c.fillStyle = g; c.fillRect(0, hor, W, H - hor);
  // road
  const [lx0, y0] = proj(-1, 30), [rx0] = proj(1, 30), [lx1, y1] = proj(-1, -.9), [rx1] = proj(1, -.9);
  c.fillStyle = sc.id === 'rainbow' ? '#b79cff' : sc.id === 'night' ? '#3b3f55' : '#5d6170'; c.beginPath(); c.moveTo(lx0, y0); c.lineTo(rx0, y0); c.lineTo(rx1, y1); c.lineTo(lx1, y1); c.closePath(); c.fill();
  // kerbs + centre dashes
  for (let z = 3 - (G.dist % 3) - 3; z < 30; z += 3) {
    for (const side of [-1, 1]) { const [ax, ay, as] = proj(side * 1.04, z), [bx, by] = proj(side * 1.04, z + 1.5); c.strokeStyle = sc.id === 'rainbow' ? '#ff6fb5' : '#ff3b3b'; c.lineWidth = Math.max(1, W * .03 * as); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); const [cx2, cy2] = proj(side * 1.04, z + 1.5), [dx, dy] = proj(side * 1.04, z + 3); c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(cx2, cy2); c.lineTo(dx, dy); c.stroke(); }
    const [ax, ay, as] = proj(0, z), [, by] = proj(0, z + 1.4); c.fillStyle = sc.id === 'rainbow' ? '#fff3a0' : '#ffd000'; c.fillRect(ax - W * .012 * as, by, W * .024 * as, ay - by);
  }
}
function drawCar(c) {
  const [x, y, s] = proj(G.carX, 1), w = W * .42 * s * .62, h = w * .62, t = G.time;
  const bob = Math.sin(t * (6 + G.gear * 4)) * h * .02, tilt = (G.wheel / 160) * .12;
  if (G.lights) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y, 0, H * .4); g.addColorStop(0, 'rgba(255,240,150,.55)'); g.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - w * .4, y - h * .5); c.lineTo(x - w * 1.3, H * .42); c.lineTo(x + w * 1.3, H * .42); c.lineTo(x + w * .4, y - h * .5); c.fill(); c.restore(); }
  c.save(); c.translate(x, y + bob); c.rotate(tilt);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, h * .55, w * .6, h * .12, 0, 0, 7); c.fill();
  c.fillStyle = '#151515'; rr(c, -w * .5, h * .15, w * .2, h * .42, h * .08); c.fill(); rr(c, w * .3, h * .15, w * .2, h * .42, h * .08); c.fill();
  c.fillStyle = '#ffd000'; rr(c, -w * .34, -h * .78, w * .68, h * .6, h * .22); c.fill();
  c.fillStyle = '#bfe8ff'; rr(c, -w * .26, -h * .68, w * .52, h * .38, h * .12); c.fill();
  c.fillStyle = '#1e7bff'; rr(c, -w * .5, -h * .32, w, h * .72, h * .22); c.fill();
  const hz = G.hazardUntil > 0 && Math.floor(G.time * 2.4) % 2 === 0;
  for (const sd of [-1, 1]) { c.fillStyle = hz ? '#ffb300' : '#ff3b3b'; c.beginPath(); c.arc(sd * w * .34, -h * .08, h * .11, 0, 7); c.fill(); if (hz) { c.fillStyle = 'rgba(255,190,0,.35)'; c.beginPath(); c.arc(sd * w * .34, -h * .08, h * .25, 0, 7); c.fill(); } }
  c.fillStyle = '#fff'; rr(c, -w * .16, h * .04, w * .32, h * .16, h * .05); c.fill(); c.fillStyle = '#e8322b'; heartPath(c, 0, h * .12, h * .06); c.fill();
  c.restore();
  if (G.time - G.hornAt < .6) { const a = 1 - (G.time - G.hornAt) / .6; c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 4; for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(x, y - h * .5, w * (.3 + i * .18 + (1 - a) * .3), -2.6, -.54); c.stroke(); } }
  if (G.gear === 2 && G.running) for (let i = 0; i < 4; i++) { const p = (G.time * 2 + i / 4) % 1; c.fillStyle = `rgba(255,255,255,${.6 * (1 - p)})`; c.beginPath(); c.arc(x + (i % 2 ? 1 : -1) * w * .2, y + h * (.3 + p * .8), h * (.08 + p * .2), 0, 7); c.fill(); }
  if (G.songUntil > G.time) for (let i = 0; i < 3; i++) { const p = (G.time * .7 + i / 3) % 1; c.globalAlpha = 1 - p; c.drawImage(emo(i % 2 ? '🎶' : '🎵'), x + (i - 1) * w * .5 + Math.sin(p * 6) * 10, y - h - p * H * .25, h * .6, h * .6); c.globalAlpha = 1; }
}
function render() {
  if (!W) return;
  const c = rc; c.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawScene(c);
  const its = G.items.slice().sort((a, b) => b.z - a.z);
  let carDrawn = false;
  for (const it of its) {
    if (!carDrawn && it.z < 1) { drawCar(c); carDrawn = true; }
    const [x, y, s] = proj(it.x, it.z); if (y < H * .38) continue;
    if (it.kind === 'star') { const r = W * .42 * s * .16 * (it.got ? 1 + (G.time - it.gotAt) * 3 : 1); c.globalAlpha = it.got ? Math.max(0, 1 - (G.time - it.gotAt) * 2) : 1; c.fillStyle = '#ffd60a'; c.strokeStyle = '#c47f00'; c.lineWidth = Math.max(1, r * .15); starPath(c, x, y - r, r, Math.sin(G.time * 4 + it.z) * .2); c.fill(); c.stroke(); c.globalAlpha = 1; }
    else { const sz = W * .42 * s * (it.kind === 'thing' ? .62 : .55); const hop = it.kind === 'thing' ? Math.abs(Math.sin(G.time * 5 + it.x)) * sz * .12 : 0; c.drawImage(emo(it.e), x - sz / 2, y - sz - hop, sz, sz); }
  }
  if (!carDrawn) drawCar(c);
  for (const p of G.parts) { const a = G.time - p.t; if (a > .6) continue; const [x, y, s] = proj(G.carX, 1); c.fillStyle = `rgba(255,230,80,${1 - a / .6})`; starPath(c, x + Math.cos(p.a) * a * p.sp * W * .3, y - H * .1 + Math.sin(p.a) * a * p.sp * H * .3, 6 * s + 4); c.fill(); }
  G.parts = G.parts.filter((p) => G.time - p.t < .6);
  if (SCENES[G.scene].id === 'night' && !G.lights) { c.fillStyle = 'rgba(0,0,30,.18)'; c.fillRect(0, 0, W, H); }
  if (G.time - G.sceneAt < .7) { c.fillStyle = `rgba(255,255,255,${1 - (G.time - G.sceneAt) / .7})`; c.fillRect(0, 0, W, H); }
  // HUD: big star counter + this place's progress pips
  const u = Math.min(W, H) / 9; const pop = G.starPop && G.time - G.starPop < .35 ? 1 + .35 * Math.sin((G.time - G.starPop) / .35 * Math.PI) : 1;
  c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, u * .3, u * .3, u * 3.1, u * 1.35, u * .6); c.fill();
  c.save(); c.translate(u * .95, u * .97); c.scale(pop, pop); c.fillStyle = '#ffd60a'; c.strokeStyle = '#a86a00'; c.lineWidth = u * .08; starPath(c, 0, 0, u * .5); c.fill(); c.stroke(); c.restore();
  c.fillStyle = '#fff'; c.font = `900 ${u * .95}px ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif`; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(String(P.stars), u * 1.6, u * 1.02);
  const n = P.sceneStars[G.scene], pr = Math.min(u * .26, (W * .5) / (PER * 2.6)); const px0 = W - u * .3 - PER * pr * 2.4;
  c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, px0 - pr * .8, u * .3, PER * pr * 2.4 + pr * .4, pr * 3, pr * 1.2); c.fill();
  for (let i = 0; i < PER; i++) { const cx = px0 + pr * .4 + i * pr * 2.4, cy = u * .3 + pr * 1.5; starPath(c, cx, cy, pr); if (i < n) { c.fillStyle = '#ffd60a'; c.fill(); } else { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.stroke(); } }
  // bubble (thing name) / shape / quiz prompt
  const b = G.bubble; if (b && G.time - b.t < b.dur) { const a = G.time - b.t, sc = Math.min(1, a * 6) * (a > b.dur - .3 ? (b.dur - a) / .3 : 1); const sz = Math.min(W, H) * .32 * sc; c.fillStyle = `rgba(255,255,255,${.9 * sc})`; c.beginPath(); c.ellipse(W / 2, H * .27, sz * .9, sz * .62, 0, 0, 7); c.fill(); c.drawImage(emo(b.e), W / 2 - sz * .38, H * .27 - sz * .5, sz * .76, sz * .76); if (b.text) { c.fillStyle = `rgba(30,30,80,${sc})`; let fs = Math.max(12, sz * .14); c.font = `900 ${fs}px ui-rounded,system-ui,sans-serif`; const tw = c.measureText(b.text).width; if (tw > W * .9) { fs *= W * .9 / tw; c.font = `900 ${fs}px ui-rounded,system-ui,sans-serif`; } c.textAlign = 'center'; c.fillText(b.text, W / 2, H * .27 + sz * .4); } }
  const sh = G.shape; if (sh && G.time - sh.t < 2.6) { const a = G.time - sh.t, k = Math.min(1, a * 5) * (1 + .1 * Math.sin(a * 12) * Math.max(0, 1 - a)) * (a > 2.3 ? (2.6 - a) / .3 : 1), r = Math.min(W, H) * .2 * k, x = W / 2, y = H * .5; c.fillStyle = COLORS[sh.c]; c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath();
    if (sh.s === 'circle') c.arc(x, y, r, 0, 7); else if (sh.s === 'square') c.rect(x - r, y - r, r * 2, r * 2); else if (sh.s === 'triangle') { c.moveTo(x, y - r * 1.1); c.lineTo(x + r * 1.1, y + r * .8); c.lineTo(x - r * 1.1, y + r * .8); c.closePath(); } else if (sh.s === 'star') starPath(c, x, y, r * 1.2); else heartPath(c, x, y, r * 1.1); c.fill(); c.stroke(); }
  const q = G.quiz; if (q) { const pulse = 1 + .08 * Math.sin(G.time * 6), r = Math.min(W, H) * .085 * pulse, top = u * 1.85; c.fillStyle = 'rgba(255,255,255,.92)'; rr(c, W / 2 - r * 3.2, top, r * 6.4, r * 2.3, r * .8); c.fill();
    if (q.type === 'color') { c.fillStyle = COLORS[q.c]; c.beginPath(); c.arc(W / 2 - r * 1.2, top + r * 1.15, r * .8, 0, 7); c.fill(); c.drawImage(emo('👆'), W / 2 + r * .1, top + r * .2, r * 1.9, r * 1.9); }
    else for (let i = 0; i < q.n; i++) { const xx = W / 2 + (i - (q.n - 1) / 2) * r * 1.5; c.globalAlpha = i < q.got ? 1 : .3; c.drawImage(emo('📯'), xx - r * .65, top + r * .5, r * 1.3, r * 1.3); c.globalAlpha = 1; } }
  // DOM bits driven by the game clock (so the recorded video is deterministic)
  wheelEl.style.transform = `rotate(${G.wheel.toFixed(1)}deg) scale(${G.press.horn != null && G.time - G.press.horn < .2 ? .96 : 1})`;
  for (const [k, el] of Object.entries(BTN)) { const a = G.time - (G.press[k] ?? -9); const s = a < .25 ? 1 - .14 * Math.sin(a / .25 * Math.PI) : 1; const tf = s === 1 ? '' : `scale(${s.toFixed(3)})`; if (el._tf !== tf) { el.style.transform = tf; el._tf = tf; } }
  knob.style.top = (84 - G.gear * 34) + '%'; document.querySelectorAll('.gicon').forEach((e) => e.classList.toggle('on', +e.dataset.g === G.gear));
  $('#hazard').classList.toggle('flash', G.hazardUntil > 0 && Math.floor(G.time * 2.4) % 2 === 0);
  $('#lights').classList.toggle('on', G.lights); $('#dial').style.transform = G.lights ? 'rotate(90deg)' : '';
  if (G.yay) { const a = G.time - G.yay.t; $('#yaybig').style.transform = `rotate(${Math.sin(a * 5) * 12}deg) scale(${1 + .1 * Math.sin(a * 8)})`; }
  // confetti layer
  fc.setTransform(DPR, 0, 0, DPR, 0, 0); fc.clearRect(0, 0, FW, FH);
  for (const p of G.conf) { fc.save(); fc.translate(p.x, p.y); fc.globalAlpha = Math.min(1, p.life); fc.fillStyle = p.c; starPath(fc, 0, 0, p.r, p.rot); fc.fill(); fc.restore(); }
}
function stepFx(dt) { for (const p of G.conf) { p.vy += 900 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt; } G.conf = G.conf.filter((p) => p.life > 0 && p.y < FH + 40); }
let lastTs = null;
function frame(ts) {
  requestAnimationFrame(frame); if (DEMO) return;
  if (lastTs == null) lastTs = ts; const dt = Math.min(.05, (ts - lastTs) / 1000); lastTs = ts;
  try { update(dt); stepFx(dt); render(); } catch (e) { console.error(e); }
}
requestAnimationFrame(frame);
layout(); setTimeout(layout, 300);
// ---------- test / demo hooks ----------
async function renderAudio(dur, off = 0) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; const sr = 44100; const oc = new OAC(1, Math.ceil(dur * sr), sr); const e = makeEngine(oc, .5);
  for (const ev of REC) { const t = ev.t - off; if (t < 0 || t > dur) continue; if (ev.k === 'sfx') engSfx(e, ev.name, t); else if (ev.k === 'song') engSong(e, ev.i, t); }
  const buf = await oc.startRendering(); const d = buf.getChannelData(0); const ab = new ArrayBuffer(44 + d.length * 2), v = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + d.length * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, d.length * 2, true);
  for (let i = 0; i < d.length; i++) v.setInt16(44 + i * 2, clamp(d[i], -1, 1) * 32767, true);
  let bin = ''; const u8 = new Uint8Array(ab); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(bin);
}
window.HBD = {
  state: () => ({ time: +G.time.toFixed(2), running: G.running, carX: +G.carX.toFixed(3), wheel: +G.wheel.toFixed(1), scene: SCENES[G.scene].id, gear: G.gear, lights: G.lights, hazard: G.hazardUntil > 0,
    stars: P.stars, sceneStars: P.sceneStars.slice(), unlocked: P.unlocked, done: P.done.slice(), met: Object.keys(P.met).length, items: G.items.length, conf: G.conf.length, quiz: G.quiz && { ...G.quiz },
    yay: !!G.yay, book: G.bookOpen, parent: G.parentOpen, maxVoices: E ? E.maxSeen : 0, voicesNow: E ? E.voices.filter((v) => v.end > E.c.currentTime).length : 0, songPlaying: !!(E && E.song),
    audio: E ? E.c.state : 'none', audioUnlocked: unlocked, storageOK, said: saidCount, shape: G.shape && G.shape.c + ' ' + G.shape.s, rainbowAt: G.rainbowAt, songIdx: G.songIdx, hornAt: G.hornAt }),
  log: () => LOG.slice(), step(dt, n = 1) { for (let i = 0; i < n; i++) { update(dt); stepFx(dt); } render(); return G.time; },
  __starLane() { const st = G.items.filter((i) => i.kind === 'star' && !i.got && i.z > .8).sort((a, b) => a.z - b.z)[0]; return st ? st.x / .9 : 0; },
  setProgress(o) { Object.assign(P, o); }, gainStar, setGame(o) { Object.assign(G, o); }, startQuiz, start, renderAudio, MAXV, SPEEDS, PER,
};
if (DEMO) { G.running = true; $('#start').classList.remove('show'); }
})();
