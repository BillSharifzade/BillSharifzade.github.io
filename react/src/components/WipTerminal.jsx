import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { wipProjects } from '../data/wip.js'
import { CV_FORMATS } from '../utils/cvExporters.js'
import './WipTerminal.css'


const HOME = '/universe/laniakea/milky_way/solar_system/earth/coolest_website'
const SECTIONS = ['home', 'about', 'skills', 'projects', 'in-progress', 'experience', 'hobbies', 'contact']
const FILES = ['README.md', 'wip.toml']
const DENIED = ['rm', 'touch', 'mkdir', 'rmdir', 'mv', 'cp', 'chmod', 'chown', 'dd']
const COMMANDS = [
  'help', 'pwd', 'ls', 'cd', 'cat', 'wip', 'ps', 'neofetch', 'fastfetch', 'echo', 'download',
  'date', 'whoami', 'uname', 'history', 'clear', 'sudo', 'reboot', 'poweroff', 'shutdown', 'exit',
  ...DENIED,
]
const FORMAT_IDS = CV_FORMATS.map((f) => f.id)
const CV_BASENAME = 'Sharifzoda_Bilol_CV'
const POWER_STAGE_H = 230

const ARCH_ART = [
  '                   -`',
  '                  .o+`',
  '                 `ooo/',
  '                `+oooo:',
  '               `+oooooo:',
  '               -+oooooo+:',
  '             `/:-:++oooo+:',
  '            `/++++/+++++++:',
  '           `/++++++++++++++:',
  '          `/+++ooooooooooooo/`',
  '         ./ooosssso++osssssso+`',
  '        .oossssso-````/ossssss+`',
  '       -osssssso.      :ssssssso.',
  '      :osssssss/        osssso+++.',
  '     /ossssssss/        +ssssooo/-',
  '   `/ossssso+/:-        -:/+osssso+-',
  '  `+sso+:-`                 `.-/+oso:',
  ' `++:.                           `-/+/',
  ' .`                                 `/',
]

const PS_ROWS = [
  ['1', '0.1', '0.2', '/sbin/init --rust-edition=2024'],
  ['42', '12.3', '1.8', 'tokio-runtime-worker'],
  ['101', '3.2', '0.9', 'axum::serve 0.0.0.0:443'],
  ['137', '2.4', '2.6', 'sqlx-postgres-pool'],
  ['256', '0.8', '0.4', 'serde_json::to_writer'],
  ['314', '7.7', '1.1', 'rayon-core (16 threads)'],
  ['420', '1.3', '0.7', 'hyper-h2-stream'],
  ['512', '0.2', '0.3', 'tracing-subscriber'],
  ['777', '99.9', '42.0', 'cargo build --release'],
  ['1024', '0.0', '0.1', 'wip-term -e rush'],
]


const s = (t, c = 'txt') => ({ t, c })
const line = (...spans) => ({ spans })
const pre = (...spans) => ({ pre: true, spans })
const blank = () => line(s(''))

function promptSpans(cmd) {
  return [s('bill', 'ok'), s('@', 'dim'), s('coolest_website', 'ok'), s(':', 'dim'), s('~', 'dir'), s('$ '), s(cmd)]
}

function askPromptSpans(ans) {
  return [s('select format ', 'accent'), s('❯ ', 'ok'), s(ans)]
}

function motdLines() {
  return [
    line(s('Welcome to '), s('coolest_website', 'accent'), s(' 2.0 LTS'), s(' (tty1)', 'dim')),
    line(s('type ', 'dim'), s('help', 'ok'), s(' for commands — the site is the filesystem', 'dim')),
    blank(),
  ]
}

function wipLines() {
  const dots = ['ok', 'accent', 'cyan']
  const out = [line(s('current work, closest to shipping first:', 'dim')), blank()]
  wipProjects.forEach((p, i) => {
    if (p.special) {
      const filled = Math.round(p.progress * 18)
      out.push(
        line(s('❤ ', 'love'), s(p.name, 'love-name'), s('  @ ' + p.company, 'love-dim')),
        pre(
          s('  [', 'love-dim'),
          s('♥'.repeat(filled), 'love'),
          s('♡'.repeat(18 - filled), 'love-dim'),
          s(`] ${Math.round(p.progress * 100)}%`, 'love'),
          s(` · ${p.spent} in · ${p.left} left · then ∞ together`, 'love-dim')
        ),
        line(s('  stack: ', 'love-dim'), s(p.stack.join(' · '), 'love')),
        line(s('  ' + p.desc, 'love-dim')),
        blank()
      )
      return
    }
    const filled = Math.round(p.progress * 22)
    out.push(
      line(s('● ', dots[i % dots.length]), s(p.name, 'accent'), s('  @ ' + p.company, 'dim')),
      pre(
        s('  ['),
        s('█'.repeat(filled), dots[i % dots.length]),
        s('░'.repeat(22 - filled), 'dim'),
        s(`] ${Math.round(p.progress * 100)}%`),
        s(` · ${p.spent} in · ${p.left}${p.left === 'ongoing' ? '' : ' left'}`, 'dim')
      ),
      line(s('  stack: ', 'dim'), s(p.stack.join(' · '))),
      line(s('  ' + p.desc, 'dim')),
      blank()
    )
  })
  return out
}

function lsLines(long) {
  if (!long) {
    const spans = []
    SECTIONS.forEach((sec) => spans.push(s(sec + '/', 'dir'), s('  ')))
    FILES.forEach((f) => spans.push(s(f), s('  ')))
    return [line(...spans)]
  }
  const rows = [line(s('total 8', 'dim'))]
  SECTIONS.forEach((sec) =>
    rows.push(pre(s('dr-xr-xr-x  bill universe 4096 ', 'dim'), s(sec + '/', 'dir')))
  )
  FILES.forEach((f) => rows.push(pre(s('-r--r--r--  bill universe  512 ', 'dim'), s(f))))
  return rows
}

function psLines() {
  const out = [pre(s('PID    USER  %CPU  %MEM  COMMAND', 'dim'))]
  PS_ROWS.forEach(([pid, cpu, mem, cmd]) =>
    out.push(
      pre(
        s(pid.padEnd(7) + 'bill  ' + cpu.padStart(4) + '  ' + mem.padStart(4) + '  '),
        s(cmd, cmd.startsWith('cargo') ? 'accent' : 'txt')
      )
    )
  )
  return out
}

function neofetchLines() {
  const uptime = Math.max(1, Math.round(performance.now() / 1000))
  const info = [
    ['bill', '@', 'coolest_website'],
    ['-'.repeat(21), '', ''],
    ['OS', ': ', 'Arch Linux x86_64 (btw)'],
    ['Host', ': ', 'coolest_website 2.0'],
    ['Kernel', ': ', '7.1.8-zen1-3-zen'],
    ['Uptime', ': ', `${uptime} sec (this visit)`],
    ['Packages', ': ', '61 (cargo), 1207 (vite)'],
    ['Shell', ': ', 'rush 1.0.0'],
    ['Resolution', ': ', `${window.innerWidth}x${window.innerHeight}`],
    ['WM', ': ', 'React 19'],
    ['Theme', ': ', 'Monochrome [dark]'],
    ['Terminal', ': ', 'wip-term'],
    ['CPU', ': ', 'Rust (16) @ borrow-checked'],
    ['Memory', ': ', '512MiB / ∞'],
  ]
  const width = Math.max(...ARCH_ART.map((l) => l.length)) + 3
  const rows = Math.max(ARCH_ART.length, info.length + 2)
  const out = []
  for (let i = 0; i < rows; i++) {
    const art = (ARCH_ART[i] ?? '').padEnd(width)
    const spans = [s(art, 'cyan')]
    if (i < info.length) {
      const [k, sep, v] = info[i]
      spans.push(s(k, i < 1 ? 'ok' : 'cyan'), s(sep + v))
    } else if (i === info.length + 1) {
      for (let c = 0; c < 8; c++) spans.push(s('███', `c${c}`))
    }
    out.push(pre(...spans))
  }
  return out
}

function helpLines() {
  const rows = [
    ['wip', 'what I am building right now'],
    ['ls', 'the sections of this site'],
    ['cd <section>', 'actually scrolls you there'],
    ['pwd', 'where you are in the universe'],
    ['cat <file>', 'README.md, wip.toml'],
    ['download', 'grab my CV — pick a format'],
    ['ps aux', 'what is running here'],
    ['neofetch', 'you already know'],
    ['echo · date · whoami · uname · history · clear', ''],
    ['reboot', 'the real one'],
    ['poweroff', 'same as the red button'],
  ]
  return rows.map(([cmd, desc]) =>
    pre(s(cmd.padEnd(16), 'ok'), s(desc, 'dim'))
  )
}

function catLines(file) {
  if (file === 'README.md') {
    return [
      line(s('# coolest_website', 'accent')),
      line(s('Backend architect · Rust enthusiast · Arch user (btw)')),
      line(s('Sections are directories — ', 'dim'), s('cd projects', 'ok'), s(' takes you there.', 'dim')),
    ]
  }
  if (file === 'wip.toml') {
    const out = []
    wipProjects.forEach((p) => {
      out.push(
        line(s('[[project]]', 'accent')),
        line(s('name    = ', 'dim'), s(`"${p.name}"`, p.special ? 'love' : 'ok')),
        line(s('company = ', 'dim'), s(`"${p.company}"`, p.special ? 'love' : 'ok')),
        line(s('spent   = ', 'dim'), s(`"${p.spent}"`, p.special ? 'love' : 'ok')),
        line(s('left    = ', 'dim'), s(`"${p.left}"`, p.special ? 'love' : 'ok')),
        line(s('stack   = ', 'dim'), s(`[${p.stack.map((x) => `"${x}"`).join(', ')}]`, p.special ? 'love' : 'ok')),
        blank()
      )
    })
    return out
  }
  if (!file) return [line(s('usage: cat <file>', 'dim'))]
  return [line(s(`cat: ${file}: no such file`, 'err'))]
}

function downloadListLines() {
  return [
    line(s('select a format to download my CV:', 'dim')),
    blank(),
    ...CV_FORMATS.map((f) => pre(s('  ' + f.id.padEnd(6), 'ok'), s(f.hint, 'dim'))),
    blank(),
    line(s("type a format — or 'cancel'", 'dim')),
  ]
}

function shutdownLines() {
  return [
    line(s('[  OK  ] ', 'ok'), s('Stopped target Multi-User System.')),
    line(s('[  OK  ] ', 'ok'), s('Stopped wip-term.service — terminal emulator.')),
    line(s('[  OK  ] ', 'ok'), s('Reached target Power-Off.')),
  ]
}

function bootEntries() {
  const ok = (txt) => line(s('[  OK  ] ', 'ok'), s(txt))
  const krn = (stamp, txt) => pre(s(`[${stamp}] `, 'dim'), s(txt))
  return [
    { line: krn('    0.000000', 'Linux version 7.1.8-zen1-3-zen (bill@coolest_website) (rustc 1.89.0) #1 SMP PREEMPT_DYNAMIC'), delay: 120 },
    { line: krn('    0.041225', 'Command line: BOOT_IMAGE=/boot/vmlinuz-linux-zen root=/dev/rust0 rw quiet'), delay: 30 },
    { line: krn('    0.183940', 'memory: 512MiB available (the rest belongs to ferris)'), delay: 35 },
    { line: krn('    0.312448', 'clocksource: tsc: mask 0xffffffffffffffff, 3.9 GHz'), delay: 260 },
    { line: line(s(':: running early hook [udev]', 'dim')), delay: 60 },
    { line: line(s(':: running hook [udev]', 'dim')), delay: 40 },
    { line: line(s(':: Triggering uevents…', 'dim')), delay: 300 },
    { line: ok('Mounted /boot.'), delay: 30 },
    { line: ok('Reached target Local File Systems.'), delay: 45 },
    { line: ok('Started Journal Service.'), delay: 25 },
    { line: ok('Started D-Bus System Message Bus.'), delay: 30 },
    { line: ok('Started Network Manager.'), delay: 180 },
    { line: ok('Started borrow-checker.service — memory safety daemon.'), delay: 40 },
    { line: ok('Reached target Multi-User System.'), delay: 35 },
    { line: ok('Reached target Graphical Interface.'), delay: 320 },
    { line: blank(), delay: 40 },
    { line: line(s('Arch Linux 7.1.8-zen1-3-zen', 'cyan'), s(' (tty1)', 'dim')), delay: 150 },
    { line: blank(), delay: 60 },
    { line: line(s('coolest_website login: '), s('bill', 'ok'), s(' (automatic login)', 'dim')), delay: 240 },
    { line: line(s(`Last login: ${new Date().toString().slice(0, 24)} on tty1`, 'dim')), delay: 200 },
  ]
}

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches


export default function WipTerminal() {
  const [lines, setLines] = useState(motdLines)
  const [input, setInput] = useState('')
  const [sel, setSel] = useState(0)
  const [focused, setFocused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [power, setPower] = useState('on')
  const [compact, setCompact] = useState(false)
  const [ask, setAsk] = useState(false)
  const [hintStage, setHintStage] = useState('hidden')
  const [srStatus, setSrStatus] = useState('')
  const stageRef = useRef(null)
  const rootRef = useRef(null)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)
  const powerBtnRef = useRef(null)
  const closeBtnRef = useRef(null)
  const poweringRef = useRef(false)
  const histRef = useRef([])
  const histIdxRef = useRef(-1)
  const bootedRef = useRef(false)
  const streamRef = useRef(null)
  const busyRef = useRef(false)
  const powerRef = useRef('on')
  const stickRef = useRef(true)
  const askRef = useRef(false)
  const exportingRef = useRef(false)
  const hintDoneRef = useRef(false)
  const miscTimersRef = useRef([])

  const append = (extra) => setLines((prev) => [...prev, ...extra])

  const later = (fn, ms) => {
    const id = window.setTimeout(fn, ms)
    miscTimersRef.current.push(id)
    return id
  }

  function announce(msg) {
    setSrStatus(msg)
    later(() => setSrStatus((cur) => (cur === msg ? '' : cur)), 5000)
  }


  function abortStream() {
    const st = streamRef.current
    if (!st) return false
    clearTimeout(st.timer)
    streamRef.current = null
    busyRef.current = false
    poweringRef.current = false
    setBusy(false)
    return true
  }

  function stream(entries, { onDone } = {}) {
    if (!entries.length) {
      onDone?.()
      return
    }
    if (prefersReduced()) {
      append(entries.map((e) => e.line))
      onDone?.()
      return
    }
    abortStream()
    busyRef.current = true
    setBusy(true)
    const st = { i: 0, timer: 0 }
    streamRef.current = st
    const tick = () => {
      if (streamRef.current !== st) return
      const e = entries[st.i++]
      append([e.line])
      if (st.i >= entries.length) {
        streamRef.current = null
        busyRef.current = false
        setBusy(false)
        onDone?.()
        return
      }
      st.timer = setTimeout(tick, e.delay)
    }
    st.timer = setTimeout(tick, 40)
  }


  function collapseToPower() {
    const stage = stageRef.current
    const term = rootRef.current
    if (!stage || !term || powerRef.current === 'off') return
    askRef.current = false
    setAsk(false)
    const hadFocus = stage.contains(document.activeElement)
    stage.style.height = term.offsetHeight + 'px'
    void stage.offsetHeight
    powerRef.current = 'off'
    poweringRef.current = false
    setPower('off')
    requestAnimationFrame(() => {
      stage.style.height = POWER_STAGE_H + 'px'
    })
    if (hadFocus) {
      let tries = 0
      const grab = () => {
        if (powerRef.current !== 'off') return
        const b = powerBtnRef.current
        if (!b) return
        b.focus({ preventScroll: true })
        if (document.activeElement !== b && tries++ < 6) later(grab, 150)
      }
      later(grab, 300)
    }
  }

  function powerOn() {
    if (powerRef.current !== 'off') return
    powerRef.current = 'on'
    poweringRef.current = false
    setPower('on')
    setLines([])
    stickRef.current = true
    const hadFocus = document.activeElement === powerBtnRef.current
    if (hadFocus) {
      let tries = 0
      const grab = () => {
        if (powerRef.current !== 'on') return
        const b = closeBtnRef.current
        if (!b) return
        b.focus({ preventScroll: true })
        if (document.activeElement !== b && tries++ < 6) later(grab, 150)
      }
      later(grab, 60)
    }
    requestAnimationFrame(() => {
      const stage = stageRef.current
      const term = rootRef.current
      if (stage && term) stage.style.height = term.offsetHeight + 'px'
    })
    later(() => {
      if (stageRef.current) stageRef.current.style.height = ''
    }, 700)
    later(() => {
      stream(bootEntries(), { onDone: () => append([blank(), ...motdLines()]) })
    }, 380)
  }

  function onPowerOff() {
    if (powerRef.current !== 'on' || poweringRef.current) return
    abortStream()
    poweringRef.current = true
    stream(shutdownLines().map((l) => ({ line: l, delay: 150 })), { onDone: collapseToPower })
  }

  function toggleCompact() {
    setCompact((c) => !c)
    later(() => {
      const b = bodyRef.current
      if (b && stickRef.current) b.scrollTop = b.scrollHeight
    }, 500)
  }


  function dismissHint() {
    if (hintDoneRef.current) return
    hintDoneRef.current = true
    setHintStage((st) => (st === 'shown' ? 'leaving' : 'hidden'))
    later(() => setHintStage('hidden'), 450)
  }


  async function runExport(fmt) {
    if (exportingRef.current) {
      append([line(s('an export is already running…', 'dim'))])
      announce('An export is already running.')
      return
    }
    exportingRef.current = true
    try {
      await fmt.run()
      append([line(s('✓ ', 'ok'), s(`download started — ${CV_BASENAME}.${fmt.id}`))])
      announce(`Download started — ${CV_BASENAME}.${fmt.id}`)
    } catch {
      append([line(s(`export failed: ${fmt.label} — try again`, 'err'))])
      announce(`Export failed: ${fmt.label} — try again.`)
    } finally {
      exportingRef.current = false
    }
  }

  function answerFormat(raw) {
    const ans = raw.trim().toLowerCase()
    const echo = [line(...askPromptSpans(raw))]
    setInput('')
    setSel(0)
    if (!ans || ans === 'cancel' || ans === 'q') {
      askRef.current = false
      setAsk(false)
      append([...echo, line(s('cancelled', 'dim'))])
      announce('Download cancelled.')
      return
    }
    const fmt = CV_FORMATS.find((f) => f.id === ans)
    if (!fmt) {
      append([...echo, line(s(`no such format: ${ans}`, 'err'), s(' — pdf · docx · xlsx · csv · md · txt', 'dim'))])
      announce(`No such format: ${ans}. Choose pdf, docx, xlsx, csv, md or txt, or type cancel.`)
      return
    }
    askRef.current = false
    setAsk(false)
    append(echo)
    stream([{ line: line(s(`generating ${fmt.label} …`, 'dim')), delay: 80 }], { onDone: () => runExport(fmt) })
  }


  function warpTo(id) {
    const el = document.getElementById(id)
    if (!el) return false
    const lenis = window.__appLenis
    if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.2 })
    else el.scrollIntoView({ behavior: 'smooth' })
    return true
  }

  function exec(raw) {
    const [cmd, ...args] = raw.trim().split(/\s+/)
    const arg = args[0] ?? ''

    switch (cmd) {
      case '':
        return []
      case 'help':
        return helpLines()
      case 'pwd':
        return [line(s(HOME, 'dir'))]
      case 'ls':
        return lsLines(args.some((a) => a.startsWith('-') && a.includes('l')))
      case 'cd': {
        const target = arg.replace(/\/+$/, '')
        if (target.startsWith('..'))
          return [line(s("cd: can't leave such a cool website :)", 'accent'))]
        if (!target || target === '~' || target === '/') {
          warpTo('home')
          return [line(s('~ → warping home', 'dim'))]
        }
        if (SECTIONS.includes(target) && warpTo(target))
          return [line(s(`→ warping to ~/${target}`, 'dim'))]
        return [line(s(`cd: no such directory: ${target}`, 'err'))]
      }
      case 'cat':
        return catLines(arg)
      case 'wip':
      case 'status':
      case 'projects':
        return wipLines()
      case 'ps':
        return psLines()
      case 'neofetch':
      case 'fastfetch':
        return neofetchLines()
      case 'echo':
        return [line(s(args.join(' ')))]
      case 'date':
        return [line(s(new Date().toString()))]
      case 'whoami':
        return [line(s('guest')), line(s('(the coolest visitor so far)', 'dim'))]
      case 'uname':
        return [line(s('Linux coolest_website 7.1.8-zen1-3-zen #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'))]
      case 'history':
        return histRef.current.map((h, i) => pre(s(String(i + 1).padStart(4) + '  ', 'dim'), s(h)))
      case 'sudo':
        return [
          line(s('guest is not in the sudoers file.', 'err')),
          line(s('This incident will be reported to nobody.', 'dim')),
        ]
      case 'download': {
        const want = arg.toLowerCase()
        if (!want) {
          askRef.current = true
          setAsk(true)
          announce('Select a CV format: pdf, docx, xlsx, csv, md or txt — or type cancel.')
          return downloadListLines()
        }
        const fmt = CV_FORMATS.find((f) => f.id === want)
        if (!fmt)
          return [line(s(`download: no such format: ${arg}`, 'err'), s(' — pdf · docx · xlsx · csv · md · txt', 'dim'))]
        return { lines: [line(s(`generating ${fmt.label} …`, 'dim'))], onDone: () => runExport(fmt) }
      }
      case 'exit':
        return [line(s('there is no escape — scroll instead', 'dim'))]
      case 'clear':
        return null
      case 'reboot':
        later(() => window.location.reload(), 900)
        return [
          line(s('[  OK  ] ', 'ok'), s('Reached target Reboot.')),
          line(s('rebooting the universe…', 'dim')),
        ]
      case 'poweroff':
      case 'shutdown':
        poweringRef.current = true
        return { lines: shutdownLines(), pace: 150, onDone: collapseToPower }
      default:
        if (DENIED.includes(cmd)) {
          const out = [line(s(`${cmd}: not enough permissions (read-only universe)`, 'err'))]
          if (cmd === 'rm' && args.includes('-rf')) out.push(line(s('nice try :)', 'dim')))
          return out
        }
        return [line(s(`rush: command not found: ${cmd}`, 'err'), s(" — try 'help'", 'dim'))]
    }
  }

  function submit(raw) {
    if (busyRef.current) return
    if (askRef.current) {
      answerFormat(raw)
      return
    }
    const trimmed = raw.trim()
    const echoed = [line(...promptSpans(raw))]
    if (trimmed) {
      histRef.current.push(trimmed)
      histIdxRef.current = histRef.current.length
    }
    const out = exec(raw)
    setInput('')
    setSel(0)
    if (out === null) {
      abortStream()
      setLines([])
      return
    }
    append(echoed)
    const cmd0 = trimmed.split(/\s+/)[0]
    const slow = cmd0 === 'wip' || cmd0 === 'status' || cmd0 === 'projects'
    let entries
    let onDone
    if (Array.isArray(out)) {
      entries = out.map((l) => ({ line: l, delay: slow ? 46 : 26 }))
    } else {
      const pace = out.pace ?? 26
      entries = out.entries ?? out.lines.map((l) => ({ line: l, delay: pace }))
      onDone = out.onDone
    }
    stream(entries, { onDone })
  }

  useEffect(() => {
    const root = rootRef.current
    if (!root || bootedRef.current) return
    const reduced = prefersReduced()
    let timers = []
    const boot = () => {
      if (bootedRef.current) return
      bootedRef.current = true
      const cmd = 'wip'
      const hint = () => {
        if (!hintDoneRef.current && powerRef.current === 'on') setHintStage('shown')
      }
      if (reduced) {
        submit(cmd)
        timers.push(setTimeout(hint, 1400))
        return
      }
      cmd.split('').forEach((ch, i) => {
        timers.push(setTimeout(() => {
          setInput(cmd.slice(0, i + 1))
          setSel(i + 1)
        }, 260 + i * 150))
      })
      const submitAt = 260 + cmd.length * 150 + 420
      timers.push(setTimeout(() => submit(cmd), submitAt))
      timers.push(setTimeout(hint, submitAt + 2600))
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        boot()
      },
      { threshold: 0.3 }
    )
    io.observe(root)
    return () => {
      io.disconnect()
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    const body = bodyRef.current
    if (body && stickRef.current) body.scrollTop = body.scrollHeight
  }, [lines, input, busy])

  useEffect(() => {
    const timers = miscTimersRef.current
    return () => {
      abortStream()
      timers.forEach(clearTimeout)
    }
  }, [])

  function onBodyScroll() {
    const b = bodyRef.current
    if (!b) return
    stickRef.current = b.scrollHeight - b.scrollTop - b.clientHeight < 48
  }

  function completeInput() {
    if (askRef.current) {
      const hits = FORMAT_IDS.filter((id) => id.startsWith(input.trim().toLowerCase()))
      if (hits.length === 1) {
        setInput(hits[0])
        setSel(hits[0].length)
      } else if (hits.length > 1) {
        append([line(...askPromptSpans(input)), line(...hits.flatMap((h) => [s(h, 'ok'), s('  ')]))])
      }
      return
    }
    const parts = input.split(/\s+/)
    const last = parts[parts.length - 1]
    if (last === '') return
    const pool =
      parts.length === 1
        ? COMMANDS
        : parts[0] === 'cd'
          ? SECTIONS
          : parts[0] === 'cat'
            ? FILES
            : parts[0] === 'download'
              ? FORMAT_IDS
              : []
    const hits = pool.filter((c) => c.startsWith(last))
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0]
      const next = parts.join(' ') + (parts.length === 1 ? ' ' : '')
      setInput(next)
      setSel(next.length)
    } else if (hits.length > 1) {
      append([line(...promptSpans(input)), line(...hits.flatMap((h) => [s(h, pool === SECTIONS ? 'dir' : 'ok'), s('  ')]))])
    }
  }

  function onKeyDown(e) {
    if ((e.isComposing || e.keyCode === 229) && (e.key === 'Enter' || e.key === 'Tab')) return
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (histIdxRef.current > 0) {
        histIdxRef.current -= 1
        const v = histRef.current[histIdxRef.current]
        setInput(v)
        setSel(v.length)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdxRef.current < histRef.current.length - 1) {
        histIdxRef.current += 1
        const v = histRef.current[histIdxRef.current]
        setInput(v)
        setSel(v.length)
      } else {
        histIdxRef.current = histRef.current.length
        setInput('')
        setSel(0)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      completeInput()
    } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault()
      if (abortStream()) {
        append([line(s('^C', 'dim'))])
        return
      }
      if (askRef.current) {
        askRef.current = false
        setAsk(false)
        append([line(...askPromptSpans(input + '^C'))])
        setInput('')
        setSel(0)
        return
      }
      append([line(...promptSpans(input + '^C'))])
      setInput('')
      setSel(0)
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault()
      abortStream()
      setLines([])
    }
  }

  function onBodyClick() {
    if (window.getSelection()?.isCollapsed) inputRef.current?.focus({ preventScroll: true })
  }

  const syncSel = (e) => setSel(e.target.selectionStart ?? e.target.value.length)

  const headSpans = ask ? askPromptSpans('').slice(0, -1) : promptSpans('')

  return (
    <div className={`wt-stage${power === 'off' ? ' wt-stage--off' : ''}`} ref={stageRef}>
      {power === 'on' && hintStage !== 'hidden' && (
        <button
          type="button"
          className={`wt-hint-callout${hintStage === 'leaving' ? ' wt-hint-callout--leaving' : ''}`}
          onClick={() => inputRef.current?.focus({ preventScroll: true })}
          tabIndex={-1}
          aria-hidden="true"
        >
          <span className="wt-hint-note">this terminal is real — click &amp; type</span>
          <svg className="wt-hint-arrow" viewBox="0 0 44 56" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path className="wt-hint-arrow-line" d="M36 4 C 40 20, 30 34, 15 45.4" pathLength="1" />
            <path className="wt-hint-arrow-head" d="M23.2 44.6 L14 46 L18.3 37.6" pathLength="1" />
          </svg>
        </button>
      )}
      <div className={`wip-terminal${compact ? ' wip-terminal--compact' : ''}`} ref={rootRef}>
        <div className="wt-chrome">
          <button
            type="button"
            ref={closeBtnRef}
            className="wt-dot wt-dot--close"
            onClick={onPowerOff}
            aria-label="Power off the terminal"
            title="power off"
          >
            <span className="wt-dot-glyph" aria-hidden="true">×</span>
          </button>
          <span className="wt-dot" aria-hidden="true" />
          <button
            type="button"
            className="wt-dot wt-dot--zoom"
            onClick={toggleCompact}
            aria-label={compact ? 'Restore terminal size' : 'Shrink the terminal a bit'}
            title={compact ? 'maximize' : 'minimize'}
          >
            <span className="wt-dot-glyph" aria-hidden="true">{compact ? '+' : '−'}</span>
          </button>
          <span className="wt-title">bill@coolest_website: ~</span>
          <span className={`wt-hint${focused ? ' wt-hint--off' : ''}`}>click · try 'help'</span>
        </div>
        <div
          className="wt-body"
          ref={bodyRef}
          onClick={onBodyClick}
          onScroll={onBodyScroll}
          data-lenis-prevent=""
        >
          {lines.map((l, i) => (
            <div key={i} className={`wt-line${l.pre ? ' wt-line--pre' : ''}`}>
              {l.spans.map((sp, j) => (
                <span key={j} className={`wt-${sp.c}`}>{sp.t}</span>
              ))}
            </div>
          ))}
          <div className="wt-line wt-line--prompt">
            {!busy && (
              <>
                {headSpans.map((sp, j) => (
                  <span key={j} className={`wt-${sp.c}`}>{sp.t}</span>
                ))}
                <span className="wt-txt">{input.slice(0, sel)}</span>
                <span className={`wt-cursor${focused ? '' : ' wt-cursor--idle'}`}>{input[sel] ?? ' '}</span>
                <span className="wt-txt">{input.slice(sel + 1)}</span>
              </>
            )}
            <input
              ref={inputRef}
              className="wt-input"
              value={input}
              onChange={(e) => { setInput(e.target.value); syncSel(e) }}
              onSelect={syncSel}
              onKeyDown={onKeyDown}
              onFocus={() => { setFocused(true); dismissHint() }}
              onBlur={() => setFocused(false)}
              aria-label={ask
                ? 'CV format — type pdf, docx, xlsx, csv, md or txt, or cancel'
                : "Terminal command input — type 'help' for commands"}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>
      <div className="wt-sr-status" role="status">{srStatus}</div>
      <button
        type="button"
        ref={powerBtnRef}
        className="wt-power"
        onClick={powerOn}
        aria-label="Power the terminal back on"
        title="power on"
        tabIndex={power === 'off' ? 0 : -1}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 3v8" />
          <path d="M6.3 6.5a8 8 0 1 0 11.4 0" />
        </svg>
      </button>
    </div>
  )
}
