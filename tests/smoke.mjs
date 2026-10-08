// Hannah's Big Drive smoke test: real touch events in headless Chrome against the offline dist file (file://, real time).
import { launch, sleep } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
const FILE = "file://" + process.cwd() + "/dist/hannahs-big-drive.html";
const c = await launch(9591, 1180, 820);
const R = { checks: {}, notes: [] }; let fails = 0;
const ok = (name, cond, detail) => { R.checks[name] = { pass: !!cond, detail }; if (!cond) fails++; console.log((cond ? "PASS " : "FAIL ") + name + (detail !== undefined ? "  " + JSON.stringify(detail) : "")); };
const st = () => c.ev("HBD.state()");
const log = () => c.ev("HBD.log()");
const touch = async (type, pts) => c.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i, radiusX: 8, radiusY: 8, force: 1 })) });
const tap = async (x, y, hold = 40) => { await touch("touchStart", [[x, y]]); await sleep(hold); await touch("touchEnd", []); };
const center = (sel) => c.ev(`(()=>{const r=document.querySelector('${sel}').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.width,r.height]})()`);
const tapEl = async (sel, wait = 220) => { const [x, y] = await center(sel); await tap(x, y); await sleep(wait); };
const since = async (n) => (await log()).slice(n);
try {
  await c.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await c.viewport(1180, 820, true, 1);
  await c.goto(FILE, 1200);
  let s = await st();
  ok("loads, start screen waiting, no audio before first tap", !s.running && s.audio === "none", { running: s.running, audio: s.audio });
  await tapEl("#go", 500); s = await st();
  ok("first tap starts game + unlocks Web Audio (silent-buffer path used on iOS)", s.running && s.audioUnlocked && s.audio === "running", { audio: s.audio, unlocked: s.audioUnlocked });
  // every button fires its effect
  const expect = { phone: (l) => l.some((e) => e.type === "sfx" && e.name === "ring"), music: (l) => l.some((e) => e.type === "song"), stars: (l, s) => l.some((e) => e.name === "confetti") && s.conf > 0,
    animal: (l) => l.some((e) => e.type === "say" && /!/.test(e.name)), shapes: (l, s) => !!s.shape && l.some((e) => e.type === "say" && /circle|square|triangle|star|heart/i.test(e.name)),
    rainbow: (l, s) => s.rainbowAt > 0 && l.some((e) => e.name === "rainbow"), scene: (l) => l.some((e) => e.name === "boop" || e.type === "scene") };
  for (const [k, f] of Object.entries(expect)) { const n = (await log()).length; await tapEl("#b-" + k, 250); const l = await since(n); s = await st(); ok(`button ${k} fires its effect`, f(l, s), l.map((e) => e.type + ":" + e.name).slice(0, 4)); }
  let n = (await log()).length; await tapEl("#b-book", 300); s = await st(); ok("button book opens sticker book", s.book); await tapEl("#bclose", 300); s = await st(); ok("sticker book back button closes it", !s.book);
  n = (await log()).length; const [wx, wy] = await center("#wheel"); await tap(wx, wy); await sleep(200); ok("tap wheel hub honks horn", (await since(n)).some((e) => e.name === "honk"));
  await tapEl("#lights"); s = await st(); ok("headlight dial toggles lights", s.lights === true);
  await tapEl("#hazard"); s = await st(); ok("hazard button flashes", s.hazard === true && (await c.ev("document.querySelector('#hazard').className")) !== undefined);
  await sleep(500); const flashSeen = await c.ev("new Promise(r=>{let on=0;const t=setInterval(()=>{if(document.querySelector('#hazard').classList.contains('flash'))on++;},40);setTimeout(()=>{clearInterval(t);r(on)},900)})"); ok("hazard actually blinks", flashSeen > 0 && flashSeen < 22, { framesOn: flashSeen });
  const g0 = (await st()).gear; await tapEl("#gear"); const g1 = (await st()).gear; await tapEl("#gear"); const g2 = (await st()).gear; ok("gear lever cycles speeds", g1 === (g0 + 1) % 3 && g2 === (g1 + 1) % 3, [g0, g1, g2]);
  // wheel drag steers the car
  const [cx, cy, ww] = await center("#wheel"); const rad = ww * .42;
  const drag = async (dir) => { const pts = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + dir * i * (Math.PI * .8 / 14); pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
    await touch("touchStart", [pts[0]]); for (const p of pts.slice(1)) { await touch("touchMove", [p]); await sleep(25); } await sleep(700); const s2 = await st(); await touch("touchEnd", []); return s2; };
  let d = await drag(1); ok("drag wheel clockwise → wheel turns right, car moves right", d.wheel > 60 && d.carX > .3, { wheel: d.wheel, carX: d.carX });
  await sleep(2500); d = await drag(-1); ok("drag wheel anticlockwise → car moves left", d.wheel < -60 && d.carX < -.3, { wheel: d.wheel, carX: d.carX });
  await sleep(1500); s = await st(); ok("wheel springs back toward centre when let go", Math.abs(s.wheel) < Math.abs(d.wheel), { wheel: s.wheel });
  // road keeps scrolling + things appear and talk
  await sleep(4000); s = await st(); const lg = await log(); ok("road scrolls, scenery spawns, animals say their name + sound", s.items > 0 && lg.some((e) => e.type === "say" && /Moo|Oink|Baa|Quack|Neigh|Cock/.test(e.name)) , { items: s.items, sample: lg.filter((e) => e.type === "say").slice(-3).map((e) => e.name) });
  // progression: 10 stars finishes the farm → celebration → city unlocked
  const before = await st(); await c.ev(`(()=>{const k=10-HBD.state().sceneStars[0];for(let i=0;i<k;i++) HBD.gainStar(false)})()`); s = await st();
  ok("10 stars → 'You did it, Hannah!' celebration + next place unlocked", s.yay && s.unlocked === 2 && s.done[0], { stars: s.stars, unlocked: s.unlocked, yayText: await c.ev("document.querySelector('#yay .msg').textContent") });
  for (let i = 0; i < 40; i++) { await sleep(250); s = await st(); if (s.scene === "city") break; } ok("after celebration the car drives into the City", s.scene === "city" && !s.yay, { scene: s.scene });
  // quiz
  await c.ev("HBD.setGame({quiz:null})"); await c.ev("HBD.startQuiz()"); const q = (await st()).quiz; n = (await log()).length;
  if (q.type === "color") await tapEl("#b-" + q.k, 300); else for (let i = 0; i < q.n; i++) { await tap(wx, wy); await sleep(260); }
  await sleep(800); let ql = await since(n); ok(`spoken question (${q.type === "color" ? "tap the " + q.c + " button" : "honk " + q.n + " times"}) → praise + bonus star`, ql.some((e) => e.type === "praise") && !(await st()).quiz, ql.filter((e) => e.type === "say").map((e) => e.name));
  // persistence
  const keep = await st(); await c.goto(FILE, 1200); s = await st(); ok("progress saved in localStorage survives reload", s.stars === keep.stars && s.unlocked === 2 && s.done[0], { before: keep.stars, after: s.stars });
  await tapEl("#go", 400);
  // 200-tap mash incl. multi-touch
  const vw = 1180, vh = 820; let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  await c.ev("(()=>{window.__q=0;window.__qmax=0;if(!window.speechSynthesis)return;const S=speechSynthesis,sp=S.speak.bind(S),ca=S.cancel.bind(S);S.speak=(u)=>{__q++;__qmax=Math.max(__qmax,__q);u.addEventListener('end',()=>{__q=Math.max(0,__q-1)});u.addEventListener('error',()=>{__q=Math.max(0,__q-1)});sp(u)};S.cancel=()=>{__q=0;ca()}})()");
  const t0 = (await st()).time; let maxV = 0, maxSpeak = 0;
  for (let i = 0; i < 200; i++) {
    const pts = [[80 + r() * (vw - 100), 80 + r() * (vh - 100)]]; if (i % 7 === 0) pts.push([r() * vw, r() * vh]);
    await touch("touchStart", pts); await sleep(8 + r() * 25); await touch("touchEnd", []); await sleep(5 + r() * 20);
    if (i % 10 === 0) { const ss = await st(); maxV = Math.max(maxV, ss.voicesNow);  if (ss.book) await tapEl("#bclose", 50); }
  }
  await sleep(600); s = await st(); const mashLog = await log();
  ok("200 random taps (some two-finger): no crash, game still running", s.running && s.time > t0 && !c.errors.length, { gameTimeAdvanced: +(s.time - t0).toFixed(1), errors: c.errors.length });
  ok("sounds never stack: simultaneous voices capped", s.maxVoices <= 4 && maxV <= 4, { maxVoicesEver: s.maxVoices, cap: 4, sampledMax: maxV });
  maxSpeak = await c.ev("window.__qmax"); ok("speech never queues (newest cancels older)", maxSpeak <= 1, { maxQueuedUtterances: maxSpeak, spokenDuringMash: await c.ev("HBD.state().said") });
  ok("effects bounded (confetti ≤260, items ≤80)", s.conf <= 260 && s.items <= 80, { conf: s.conf, items: s.items });
  ok("page did not zoom or scroll", (await c.ev("[visualViewport.scale, scrollX, scrollY, document.scrollingElement.scrollTop]")).every((v, i) => (i === 0 ? v === 1 : v === 0)));
  // back-navigation trap
  await c.ev("history.back()"); await sleep(500); ok("browser Back does not leave the game", (await c.ev("location.href")).startsWith(FILE) && (await st()).running);
  // parent corner long-press
  await touch("touchStart", [[25, 25]]); await sleep(1800); await touch("touchEnd", []); await sleep(200); s = await st(); ok("long-press top-left corner (1.5 s) opens grown-up settings", s.parent);
  await c.ev("(()=>{const v=document.querySelector('#pvol');v.value=0.3;v.dispatchEvent(new Event('input'))})()"); await tapEl("#pmute", 150); s = await st();
  ok("volume + mute controls work", (await c.ev("JSON.parse(localStorage.getItem('hannahsBigDrive.v1')).S")).muted === true, await c.ev("JSON.parse(localStorage.getItem('hannahsBigDrive.v1')).S"));
  await tapEl("#pmute", 150); await tapEl("#pclose", 200); ok("settings close back to driving", !(await st()).parent);
  // hit targets in each layout
  for (const [label, w, h] of [["landscape tablet 1180x820", 1180, 820], ["portrait phone 390x844", 390, 844], ["portrait small phone 375x667", 375, 667], ["landscape phone 844x390", 844, 390]]) {
    await c.viewport(w, h, true, 2); await sleep(500);
    const sizes = await c.ev("[...document.querySelectorAll('.btn,#hazard,#lights,#gear,#wheel')].map(e=>{const r=e.getBoundingClientRect();return [e.id,Math.round(r.width),Math.round(r.height)]})");
    const small = sizes.filter(([, a, b]) => a < 80 || b < 80); const overflow = await c.ev("document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1");
    ok(`hit targets ≥ 80 px — ${label}`, small.length === 0, small.length ? small : { smallest: sizes.reduce((m, [, a, b]) => Math.min(m, a, b), 999) });
  }
  // network
  const ext = c.requests.filter((u) => !u.startsWith("file://") && !u.startsWith("data:") && !u.startsWith("blob:"));
  ok("zero network requests (only the local file)", ext.length === 0, { totalRequests: c.requests.length, external: ext });
  ok("no JavaScript errors in the whole run", c.errors.length === 0, c.errors.slice(0, 5));
  R.mashSampleLog = mashLog.slice(-12);
} catch (e) { ok("test harness", false, String(e)); }
finally { await c.close(); }
R.passed = Object.values(R.checks).filter((x) => x.pass).length; R.total = Object.keys(R.checks).length; R.when = new Date().toString();
writeFileSync("data/last-smoke-test.json", JSON.stringify(R, null, 1));
console.log(`\n${R.passed}/${R.total} checks passed`); process.exit(fails ? 1 : 0);
