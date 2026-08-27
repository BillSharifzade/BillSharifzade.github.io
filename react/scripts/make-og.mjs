// Regenerates public/og.png (the 1200×630 social-preview card) by rendering
// an HTML mock of the site's terminal in headless Chrome. Run from react/:
//
//   node scripts/make-og.mjs
//
// Needs Chrome/Chromium and network access (Google Fonts). The avatar is
// embedded from src/assets/main_img.webp, so the card follows the site photo.

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'og.png')

const CHROMES = ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser']
function chrome() {
  for (const c of CHROMES) {
    try {
      execFileSync('which', [c], { stdio: 'ignore' })
      return c
    } catch { /* try next */ }
  }
  throw new Error('no Chrome/Chromium binary found')
}

const avatar = `data:image/webp;base64,${readFileSync(join(ROOT, 'src/assets/main_img.webp')).toString('base64')}`

const prompt = (cmd) =>
  `<span class="ok">bill</span><span class="dim">@</span><span class="ok">coolest_website</span>` +
  `<span class="dim">:</span><span class="dir">~</span><span class="txt">$ ${cmd}</span>`

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=block" rel="stylesheet">
<style>
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { font-family: 'JetBrains Mono', monospace; background: #07070c; position: relative; }

.glow { position: absolute; border-radius: 50%; filter: blur(90px); }
.glow--green { width: 540px; height: 540px; right: -80px; top: -160px; background: rgba(74, 222, 128, 0.13); }
.glow--blue { width: 500px; height: 500px; left: -140px; bottom: -200px; background: rgba(96, 165, 250, 0.10); }
.grid { position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 26px 26px; }

.term { position: absolute; left: 60px; top: 74px; width: 740px;
  background: #000; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 18px;
  box-shadow: 0 40px 90px -30px rgba(0, 0, 0, 0.95), 0 0 60px rgba(74, 222, 128, 0.07);
  overflow: hidden; }
.term-bar { display: flex; align-items: center; gap: 9px; padding: 15px 20px;
  background: #0a0a0c; border-bottom: 1px solid rgba(255, 255, 255, 0.09); }
.dot { width: 14px; height: 14px; border-radius: 50%; }
.dot--r { background: #ff5f57; } .dot--y { background: #febc2e; } .dot--g { background: #28c840; }
.term-title { margin-left: 12px; color: #6e6e78; font-size: 15px; }
.term-body { padding: 24px 30px 28px; font-size: 20px; line-height: 1.72; }

.name { font-size: 48px; font-weight: 800; color: #f5f0f0; line-height: 1.3;
  margin: 2px 0 12px; letter-spacing: -1px; }
.role { font-size: 26px; font-weight: 700; color: #fdba74; line-height: 1.4; }
.sub { color: #8b8b96; font-size: 19px; margin-bottom: 12px; }
.ok { color: #4ade80; } .dim { color: #6e6e78; } .txt { color: #e3d3d3; }
.dir { color: #60a5fa; font-weight: 700; }
.stack { letter-spacing: 0.5px; }
.cursor { display: inline-block; width: 11px; height: 22px; background: #4ade80;
  vertical-align: -3px; box-shadow: 0 0 10px rgba(74, 222, 128, 0.8); }

.side { position: absolute; right: 40px; top: 0; width: 340px; height: 630px; }
.halo { position: absolute; left: 50%; top: 168px; transform: translateX(-50%);
  width: 280px; height: 280px; border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.20), rgba(74, 222, 128, 0.05) 55%, transparent 72%); }
.ring { position: absolute; left: 50%; top: 176px; transform: translateX(-50%);
  width: 264px; height: 264px; border-radius: 50%;
  border: 2px solid rgba(74, 222, 128, 0.45);
  box-shadow: 0 0 34px rgba(74, 222, 128, 0.25), inset 0 0 26px rgba(74, 222, 128, 0.12); }
.avatar { position: absolute; left: 50%; bottom: 140px; transform: translateX(-50%);
  width: 300px; filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.6));
  -webkit-mask-image: linear-gradient(#000 84%, transparent 99%);
  mask-image: linear-gradient(#000 84%, transparent 99%); }
.url { position: absolute; left: 0; right: 0; bottom: 92px; text-align: center;
  color: #6e6e78; font-size: 18px; }
.url b { color: #4ade80; font-weight: 500; }
</style></head>
<body>
  <div class="glow glow--green"></div>
  <div class="glow glow--blue"></div>
  <div class="grid"></div>

  <div class="term">
    <div class="term-bar">
      <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
      <span class="term-title">bill@coolest_website: ~</span>
    </div>
    <div class="term-body">
      <div>${prompt('whoami')}</div>
      <div class="name">Sharifzoda Bilol</div>
      <div>${prompt('cat role.txt')}</div>
      <div class="role">Backend Architect</div>
      <div class="sub">Rust · high-load systems · Linux internals</div>
      <div>${prompt('ls stack/')}</div>
      <div class="stack"><span class="dir">rust/</span>&nbsp; <span class="dir">postgres/</span>&nbsp; <span class="dir">kafka/</span>&nbsp; <span class="dir">docker/</span>&nbsp; <span class="dir">linux/</span></div>
      <div style="margin-top: 6px">${prompt('')}<span class="cursor"></span></div>
    </div>
  </div>

  <div class="side">
    <div class="halo"></div>
    <div class="ring"></div>
    <img class="avatar" src="${avatar}" alt="">
    <div class="url">→ <b>billsharifzade.github.io</b></div>
  </div>
</body></html>`

const dir = mkdtempSync(join(tmpdir(), 'og-'))
const page = join(dir, 'og.html')
writeFileSync(page, html)
try {
  execFileSync(chrome(), [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1200,630', '--force-device-scale-factor=1',
    // Fast-forwards timers and waits on pending loads, so the web font and
    // the data-URI avatar are guaranteed in before the shot.
    '--virtual-time-budget=10000',
    `--screenshot=${OUT}`, `file://${page}`,
  ], { stdio: 'ignore' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log('wrote', OUT)
