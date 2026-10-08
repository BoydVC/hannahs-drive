// Headless demo-video renderer: deterministic game clock (?demo), real mouse/pointer input via DevTools,
// one JPEG per frame at 30 fps, soundtrack rendered offline from the same synth (OfflineAudioContext), muxed with ffmpeg.
import { launch, sleep } from "./cdp.mjs";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
const FPS = 30, DUR = 28, W = 1280, H = 720, FR = "/tmp/hbd-frames";
rmSync(FR, { recursive: true, force: true }); mkdirSync(FR, { recursive: true });
const c = await launch(9601, W, H);
const center = (sel) => c.ev(`(()=>{const r=document.querySelector('${sel}').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.width]})()`);
const mouse = (type, x, y, buttons = 0) => c.send("Input.dispatchMouseEvent", { type, x, y, button: type === "mouseMoved" && !buttons ? "none" : "left", buttons, clickCount: 1 });
const click = async (sel) => { const [x, y] = await center(sel); await mouse("mousePressed", x, y, 1); await mouse("mouseReleased", x, y, 0); };
try {
  await c.viewport(W, H, false, 1);
  await c.goto("file://" + process.cwd() + "/dist/hannahs-big-drive.html?demo", 1200);
  await c.ev("HBD.setProgress({stars:7,sceneStars:[7,0,0,0,0],unlocked:1,met:{}}); HBD.setGame({nextQuiz:9999, nextThing:6}); HBD.step(1/30,45)");
  const T0 = (await c.ev("HBD.state()")).time; const [wx, wy, ww] = await center("#wheel"); const rad = ww * .42;
  const at = (a) => [wx + Math.cos(a) * rad, wy + Math.sin(a) * rad];
  // timeline: [second, action]
  const drags = [[0.4, 2.2, -Math.PI / 2, -Math.PI / 2 + 2.3], [3.0, 4.6, -Math.PI / 2 + 2.3, -Math.PI / 2 - 1.9]]; // [t0,t1,a0,a1]
  const ev = [[5.0, () => click("#wheel")], [5.8, () => click("#b-animal")], [6.9, () => click("#b-music")], [8.3, () => click("#b-stars")],
    [16.9, () => click("#gear")], [17.9, () => click("#b-shapes")], [19.0, () => click("#b-rainbow")],
    [20.4, async () => { await c.ev("HBD.setProgress({unlocked:4})"); await click("#b-scene"); }], [21.7, () => click("#b-scene")], [22.5, () => click("#lights")], [23.1, () => click("#hazard")],
    [23.8, () => c.ev("HBD.setGame({quiz:null}); (function(){ HBD.setGame({quiz:{type:'color',c:'blue',k:'rainbow',t:HBD.state().time}}); })()")], [25.6, () => click("#b-rainbow")]];
  const sayLog = [];
  let ei = 0, dragDown = [false, false];
  for (let f = 0; f < FPS * DUR; f++) {
    const t = f / FPS;
    for (let di = 0; di < drags.length; di++) { const [t0, t1, a0, a1] = drags[di];
      if (t >= t0 && t <= t1) { const k = (t - t0) / (t1 - t0), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; const [x, y] = at(a0 + (a1 - a0) * e);
        if (!dragDown[di]) { await mouse("mousePressed", x, y, 1); dragDown[di] = true; } else await mouse("mouseMoved", x, y, 1); }
      else if (dragDown[di] === true && t > t1) { const [x, y] = at(a1); await mouse("mouseReleased", x, y, 0); dragDown[di] = "done"; } }
    while (ei < ev.length && t >= ev[ei][0]) { await ev[ei][1](); ei++; }
    // gentle autopilot between 9.8 s and 12 s steers into the stars (the farm finishes at 10 stars)
    if (t > 9.8 && t < 12.5) await c.ev(`(()=>{ const st=HBD.state(); if(st.yay||st.sceneStars[0]>=10) return; HBD.setGame({wheel: ${"__T__"}}); })()`.replace("__T__", "HBD.__starLane()*110"));
    if (Math.abs(t - 12.5) < 1e-6) await c.ev("(()=>{const k=10-HBD.state().sceneStars[0]; for(let i=0;i<k;i++) HBD.gainStar(false)})()");
    await c.ev(`HBD.step(${1 / FPS},1)`);
    const r = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 88 });
    writeFileSync(`${FR}/f${String(f).padStart(4, "0")}.jpg`, Buffer.from(r.data, "base64"));
    if (f % 150 === 0) console.log("frame", f, JSON.stringify(await c.ev("(()=>{const s=HBD.state();return {t:s.time,scene:s.scene,stars:s.stars,carX:s.carX,wheel:s.wheel,yay:s.yay}})()")));
  }
  const wav = await c.ev(`HBD.renderAudio(${DUR}, ${T0})`); writeFileSync("/tmp/hbd-audio.wav", Buffer.from(wav, "base64"));
  const L = await c.ev("HBD.log()"); writeFileSync("data/demo-video-events.json", JSON.stringify(L, null, 0));
  if (c.errors.length) console.log("ERRORS", c.errors);
} finally { await c.close(); }
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${FR}/f%04d.jpg -i /tmp/hbd-audio.wav -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -shortest out/hannahs-big-drive-demo.mp4`, { stdio: "inherit" });
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${FR}/f%04d.jpg -vf "fps=10,scale=560:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" out/hannahs-big-drive-demo.gif`, { stdio: "inherit" });
console.log("video done");
