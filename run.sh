#!/usr/bin/env bash
# Hannah's Big Drive: build the single offline file, then (optionally) screenshots / smoke test / demo video.
#   ./run.sh            build + smoke test
#   ./run.sh --shots    also re-render screenshots
#   ./run.sh --video    also re-render the demo MP4 + GIF
#   ./run.sh --serve    also serve dist/ on :4270 (nohup) for a quick look in the box browser
set -euo pipefail
cd "$(dirname "$0")"
python3 build.py
mkdir -p data
[[ " $* " == *" --shots "* ]] && nice -n 15 node --experimental-websocket tests/shots.mjs
[[ " $* " == *" --video "* ]] && nice -n 15 node --experimental-websocket tests/video.mjs
if [[ " $* " == *" --serve "* ]]; then
  PORT="${HANNAH_PORT:-4270}"
  if [[ -f data/server.pid ]] && kill -0 "$(cat data/server.pid)" 2>/dev/null; then echo "already serving :$PORT"; else
    nohup python3 -m http.server "$PORT" --bind 127.0.0.1 --directory dist > data/server.log 2>&1 & echo $! > data/server.pid
    echo "serving http://127.0.0.1:$PORT/hannahs-big-drive.html"; fi
fi
nice -n 10 node --experimental-websocket tests/smoke.mjs
