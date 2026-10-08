#!/usr/bin/env python3
"""Inline src/ (HTML + CSS + JS) into one offline file: dist/hannahs-big-drive.html"""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent
src = root / "src"
html = (src / "index.html").read_text()
css = (src / "style.css").read_text()
js = (src / "audio.js").read_text() + "\n" + (src / "game.js").read_text()
html = html.replace("/*CSS*/", css).replace("/*JS*/", js.replace("</script", "<\\/script"))
bad = re.findall(r"(?:src|href)\s*=\s*[\"']?(?:https?:)?//", html) + re.findall(r"url\(\s*[\"']?https?:", html) + re.findall(r"@import", html)
if bad:
    sys.exit(f"external reference found: {bad}")
out = root / "dist" / "hannahs-big-drive.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html)
print(f"wrote {out} ({out.stat().st_size/1024:.1f} KB)")
