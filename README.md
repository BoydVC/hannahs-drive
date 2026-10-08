# Hannah's Big Drive 🚗

A toddler/preschooler driving-dashboard toy for Hannah (Adam's daughter). One offline HTML file, no internet, nothing to buy, no links out, no way to lose, no reading needed. An original design inspired by a classic red toy dashboard: no toy-brand names or logos, no photos, no people.

**File to share:** `dist/hannahs-big-drive.html` (about 62 KB, everything inline)

## What Hannah can do
- **Steering wheel:** drag it around and the little blue-and-yellow car moves across the road. It springs back slowly when she lets go. Tap the yellow middle to honk the horn. She can also tap the left or right side of the road screen to steer.
- **Catch the stars:** stars come down the road in lanes. Steer into them to collect them. The big counter at top left is her total, and the 10 pips at top right show the current place.
- **Places unlock in order:** Farm → City → Beach → Night time → Rainbow land. Each one takes 10 stars, and finishing one shows a big "You did it, Hannah!" with confetti and a fanfare. After that, the 🗺️ button switches between any unlocked places.
- **Things along the road** say their name and make their sound, for example "Cow! Moo!", "Fire truck! Wee-oo!", "Owl! Hoo hoo!". There are 30 in all, 6 per place.
- **Buttons:**
  - 📞 phone ring ("Hello, Hannah!")
  - 🎵 songs, tap again for the next one (Twinkle Twinkle, Wheels on the Bus, Row Row Row Your Boat, Old MacDonald; all traditional/public-domain melodies, synthesized)
  - 🎉 confetti stars
  - 🐮 an animal from the current place
  - shapes ("Red circle!")
  - 🌈 rainbow
  - 🗺️ next place
  - 📒 sticker book
- **Hazard triangle** blinks with a tick-tock sound. The **yellow dial** turns the headlights on and off. The **gear lever** has three speeds: 🐢 slow, 🚙 medium, 🚀 zoom (tap to cycle, or slide it).
- **Gentle questions** come up about every 40–65 seconds: "Can you tap the blue button?" or "Honk the horn three times!" (it counts along). The right button glows after 4 seconds as a hint. Getting it right earns praise, confetti and a bonus star. Ignoring the question is fine and nothing bad happens.
- **Hannah's Progress sticker book (📒):** her big total star count, a sticker for each place she has finished (plus a 🏆 for finishing all five), and stickers for every animal or thing she has met. Tap a sticker to hear it again. Progress is saved on the device in `localStorage`.

## How to share with Adam
1. Just send him the file **`hannahs-big-drive.html`** (AirDrop, iMessage, email or WhatsApp all work; it's about 62 KB).
2. **On iPhone/iPad:** save it to Files, then open it in Safari. Tap the big green car button once to start; that first tap turns the sound on.
   - If tapping the file only shows a preview where nothing moves, that preview is iOS Quick Look, which doesn't run games. The most reliable option is to put the file on any web host (any static hosting works; it's a single file with no server needed), open that link in **Safari**, then Share → **Add to Home Screen** so it opens full screen like an app.
3. **On Android or a computer:** open the file in Chrome, Edge, Firefox or Safari.
4. **Grown-up settings:** press and hold the **top-left corner for 1.5 seconds** (a little ring fills up). The panel has volume, sound on/off, talking on/off, questions on/off, full screen, reset stickers (tap twice) and "Leave kid mode".
5. **To lock the phone to the game:** use iOS **Guided Access** (Settings → Accessibility → Guided Access, then triple-click the side button). That's the only real way to stop little fingers from leaving Safari.

## Toddler-proofing
- Pinch-zoom, double-tap zoom, scrolling, pull-to-refresh, long-press menus, text selection and the Back button are all blocked (Back is trapped while playing).
- At most 4 sound effects play at once (the oldest is cut), plus one song. Each button has a 150 ms cool-down. Speech never queues: each new phrase replaces the old one. Volume defaults to moderate, behind a limiter.
- Confetti and road items are capped, so mashing can't slow it down.
- Content-Security-Policy `connect-src 'none'` and `default-src 'none'`: the page *cannot* make network requests.

## Things that may not work on iPhone (not tested on a real device; tested in headless Chrome only)
- **Silent switch:** on iOS 17 and later, the game asks for "playback" audio so sounds play even with the ringer off. On older iOS, game sounds are muted when the side switch is on silent. Spoken words usually still play.
- **Voice:** spoken words use the phone's built-in voice (speechSynthesis), so it sounds different on each device. If a device has no voice, the sounds and pictures still work.
- **Full screen:** iPhone Safari doesn't allow full screen for web pages. "Add to Home Screen" from a hosted link is the closest option. iPad and Android do go full screen.
- **Swipe-back from the screen edge** in iPhone Safari can't be fully blocked by a web page. Guided Access fixes it.
- **Saved progress:** if the file is opened from Quick Look or a "private" tab, stickers may not be saved between visits. A hosted link in Safari keeps them.
- **Art:** the art uses the device's emoji, so it will look like Apple emoji on iPhone. The screenshots and video were rendered with Noto emoji.

## Folder
| Path | What |
|---|---|
| `dist/hannahs-big-drive.html` | the whole game, offline, single file |
| `out/hannahs-big-drive-demo.mp4` | 28 s, 720p demo with sound (synth sounds only; spoken words aren't in the video because the box has no text-to-speech voice) |
| `out/hannahs-big-drive-demo.gif` | preview GIF |
| `screenshots/` | portrait-phone and landscape-tablet shots; `00-best-*` is the pick |
| `src/` | `index.html`, `style.css`, `audio.js`, `game.js`; `build.py` inlines them |
| `tests/smoke.mjs` | real-touch smoke test in headless Chrome (results in `data/last-smoke-test.json`) |
| `tests/shots.mjs`, `tests/video.mjs` | screenshot and demo-video renderers (deterministic `?demo` clock) |
| `run.sh` | build + smoke test (`--shots`, `--video`, `--serve` to serve on :4270) |

The demo video is scripted: progress is pre-seeded so the "You did it" moment and several places fit into 28 seconds. Real play takes about 1–2 minutes per place.


---
## Repo notes
- **Built:** Oct 2026 (TokenMax build week; see SHORTLIST/ledger), by TokenMax (Boyd's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/hannahs-drive` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
