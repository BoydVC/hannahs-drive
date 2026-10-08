// Renders portrait-phone + landscape-tablet screenshots in deterministic demo mode.
import { launch, sleep } from "./cdp.mjs";
const OUT = process.cwd() + "/screenshots/";
const URL = "file://" + process.cwd() + "/dist/hannahs-big-drive.html?demo";
const c = await launch(9581, 1280, 900);
const quick = process.argv.includes("--quick");
async function scene(name, w, h, scale, mobile, setup) {
  await c.viewport(w, h, mobile, scale); await c.goto(URL, 900);
  await c.ev(setup); await sleep(150); await c.ev("HBD.step(0,1)");
  await c.shot(OUT + name); console.log("shot", name);
}
try {
  const base = `HBD.setProgress({stars:23,sceneStars:[10,10,3,0,0],done:[true,true,false,false,false],unlocked:3,met:{'🐄':1,'🐖':1,'🦆':1,'🚌':1,'🚒':1,'🐕':1,'🦀':1}}); HBD.setGame({scene:2,gear:1}); HBD.step(1/30,240);`;
  await scene("00-best-landscape-tablet-beach.png", 1180, 820, 1, false, base + `HBD.setGame({wheel:-70}); HBD.step(1/30,20); document.querySelector('#b-animal').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); HBD.step(1/30,8);`);
  await scene("01-portrait-phone-farm.png", 390, 844, 2, true, `HBD.setProgress({stars:6,sceneStars:[6,0,0,0,0]}); HBD.step(1/30,200); HBD.setGame({wheel:60}); HBD.step(1/30,25);`);
  if (!quick) {
    await scene("02-portrait-phone-night-lights.png", 390, 844, 2, true, `HBD.setProgress({stars:38,sceneStars:[10,10,10,4,0],done:[true,true,true,false,false],unlocked:4}); HBD.setGame({scene:3,lights:true,hazardUntil:9999}); HBD.step(1/30,260); HBD.step(0.21,1);`);
    await scene("03-landscape-tablet-you-did-it.png", 1180, 820, 1, false, `HBD.setProgress({stars:19,sceneStars:[10,9,0,0,0],done:[true,false,false,false,false],unlocked:2}); HBD.setGame({scene:1}); HBD.step(1/30,90); HBD.gainStar(false); HBD.step(1/30,24);`);
    await scene("04-landscape-tablet-sticker-book.png", 1180, 820, 1, false, `HBD.setProgress({stars:41,sceneStars:[10,10,10,7,0],done:[true,true,true,false,false],unlocked:4,met:{'🐄':1,'🐖':1,'🐑':1,'🦆':1,'🐎':1,'🚌':1,'🚒':1,'🚂':1,'🐕':1,'🦀':1,'🐳':1,'🐢':1,'⛵':1,'🦉':1,'🐸':1}}); document.querySelector('#b-book').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); HBD.step(1/30,5);`);
    await scene("05-landscape-tablet-quiz-rainbow-land.png", 1180, 820, 1, false, `HBD.setProgress({stars:52,sceneStars:[10,10,10,10,5],done:[true,true,true,true,false],unlocked:5}); HBD.setGame({scene:4,nextQuiz:9999}); HBD.step(1/30,200); HBD.setGame({quiz:{type:'color',c:'blue',k:'rainbow',t:HBD.state().time-5}}); HBD.step(1/30,2); document.querySelector('#b-shapes').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); HBD.step(1/30,10);`);
    await scene("06-portrait-phone-start.png", 390, 844, 2, true, `document.querySelector('#start').classList.add('show')`);
  }
  if (c.errors.length) console.log("ERRORS", c.errors);
} finally { await c.close(); }
