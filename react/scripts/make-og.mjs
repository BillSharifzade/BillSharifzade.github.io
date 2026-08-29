import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { siArchlinux } from 'simple-icons'

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

const arch = siArchlinux.path.slice(0, siArchlinux.path.indexOf('M', 1))

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
.glow--hi { width: 540px; height: 540px; right: -80px; top: -160px; background: rgba(255, 255, 255, 0.10); }
.glow--lo { width: 500px; height: 500px; left: -140px; bottom: -200px; background: rgba(255, 255, 255, 0.06); }
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
  background: radial-gradient(circle, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.04) 55%, transparent 72%); }
.ring { position: absolute; left: 50%; top: 176px; transform: translateX(-50%);
  width: 264px; height: 264px; border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.30);
  box-shadow: 0 0 34px rgba(255, 255, 255, 0.14), inset 0 0 26px rgba(255, 255, 255, 0.08); }
.arch { position: absolute; left: 50%; top: 158px; transform: translateX(-50%);
  filter: drop-shadow(0 22px 28px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 24px rgba(255, 255, 255, 0.10)); }
.url { position: absolute; left: 0; right: 0; bottom: 92px; text-align: center;
  color: #6e6e78; font-size: 18px; }
.url b { color: #e8ebf0; font-weight: 500; }
</style></head>
<body>
  <div class="glow glow--hi"></div>
  <div class="glow glow--lo"></div>
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
    <!-- Chromed Arch mark: dark extrusion stack under a mirror-break steel
         gradient, finished with a diagonal specular sweep. -->
    <svg class="arch" viewBox="0 0 24 24" width="266" height="266">
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fbfcfe"/>
          <stop offset="0.30" stop-color="#cdd3dc"/>
          <stop offset="0.49" stop-color="#8e949e"/>
          <stop offset="0.51" stop-color="#565b64"/>
          <stop offset="0.74" stop-color="#8f959f"/>
          <stop offset="1" stop-color="#c6ccd5"/>
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#43474e"/>
          <stop offset="1" stop-color="#101216"/>
        </linearGradient>
        <linearGradient id="spec" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.34" stop-color="#fff" stop-opacity="0"/>
          <stop offset="0.48" stop-color="#fff" stop-opacity="0.45"/>
          <stop offset="0.60" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g transform="translate(0 0.42)"><path d="${arch}" fill="#0a0b0e"/></g>
      <g transform="translate(0 0.24)"><path d="${arch}" fill="url(#edge)"/></g>
      <path d="${arch}" fill="url(#steel)"/>
      <path d="${arch}" fill="url(#spec)"/>
    </svg>
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
    '--virtual-time-budget=10000',
    `--screenshot=${OUT}`, `file://${page}`,
  ], { stdio: 'ignore' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log('wrote', OUT)
