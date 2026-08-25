import { useEffect, useRef, useState } from 'react'
import { wipProjects } from '../data/wip.js'
import './WipTerminal.css'

// A working shell, not a screenshot of one. Everything routes through one
// exec(): the auto-typed `wip` on first scroll-into-view runs the same path a
// visitor's keystrokes do, so there is no separate "demo mode" to drift out of
// sync. `cd <section>` drives the page's own Lenis instance, which is the whole
// joke: the site really is the filesystem.
//
// Input is a real <input> laid transparently over the prompt line (mobile
// keyboards, IME, native selection all keep working); what you see is a mirror
// of its value with a block cursor drawn at selectionStart.

const HOME = '/universe/laniakea/milky_way/solar_system/earth/coolest_website'
const SECTIONS = ['home', 'about', 'skills', 'projects', 'in-progress', 'experience', 'hobbies', 'contact']
const FILES = ['README.md', 'wip.toml']
// Write-y verbs all fail the same way; sudo has its own answer.
const DENIED = ['rm', 'touch', 'mkdir', 'rmdir', 'mv', 'cp', 'chmod', 'chown', 'dd']
const COMMANDS = [
  'help', 'pwd', 'ls', 'cd', 'cat', 'wip', 'ps', 'neofetch', 'fastfetch', 'echo',
  'date', 'whoami', 'uname', 'history', 'clear', 'sudo', 'reboot', 'poweroff', 'shutdown', 'exit',
  ...DENIED,
]

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

// --- pure line builders: a line is { pre?, spans: [{ t, c }] } -------------

const s = (t, c = 'txt') => ({ t, c })
const line = (...spans) => ({ spans })
const pre = (...spans) => ({ pre: true, spans })
const blank = () => line(s(''))

function promptSpans(cmd) {
  return [s('bill', 'ok'), s('@', 'dim'), s('coolest_website', 'ok'), s(':', 'dim'), s('~', 'dir'), s('$ '), s(cmd)]
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
    ['ps aux', 'what is running here'],
    ['neofetch', 'you already know'],
    ['echo · date · whoami · uname · history · clear', ''],
    ['reboot', 'the real one'],
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
        line(s('name    = ', 'dim'), s(`"${p.name}"`, 'ok')),
        line(s('company = ', 'dim'), s(`"${p.company}"`, 'ok')),
        line(s('spent   = ', 'dim'), s(`"${p.spent}"`, 'ok')),
        line(s('left    = ', 'dim'), s(`"${p.left}"`, 'ok')),
        line(s('stack   = ', 'dim'), s(`[${p.stack.map((x) => `"${x}"`).join(', ')}]`, 'ok')),
        blank()
      )
    })
    return out
  }
  if (!file) return [line(s('usage: cat <file>', 'dim'))]
  return [line(s(`cat: ${file}: no such file`, 'err'))]
}

// --------------------------------------------------------------------------

export default function WipTerminal() {
  const [lines, setLines] = useState(motdLines)
  const [input, setInput] = useState('')
  const [sel, setSel] = useState(0)
  const [focused, setFocused] = useState(false)
  const rootRef = useRef(null)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)
  const histRef = useRef([])
  const histIdxRef = useRef(-1)
  const bootedRef = useRef(false)

  const append = (extra) => setLines((prev) => [...prev, ...extra])

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
      case 'exit':
        return [line(s('there is no escape — scroll instead', 'dim'))]
      case 'clear':
        return null // handled by caller
      case 'reboot':
      case 'poweroff':
      case 'shutdown':
        setTimeout(() => window.location.reload(), 900)
        return [
          line(s('[  OK  ] ', 'ok'), s('Reached target Reboot.')),
          line(s('rebooting the universe…', 'dim')),
        ]
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
    const trimmed = raw.trim()
    const echoed = [line(...promptSpans(raw))]
    if (trimmed) {
      histRef.current.push(trimmed)
      histIdxRef.current = histRef.current.length
    }
    const out = exec(raw)
    if (out === null) setLines([])
    else append([...echoed, ...out])
    setInput('')
    setSel(0)
  }

  // Boot: auto-type `wip` the first time the terminal scrolls into view, through
  // the same submit() a visitor uses.
  useEffect(() => {
    const root = rootRef.current
    if (!root || bootedRef.current) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let timers = []
    const boot = () => {
      if (bootedRef.current) return
      bootedRef.current = true
      const cmd = 'wip'
      if (reduced) {
        submit(cmd)
        return
      }
      cmd.split('').forEach((ch, i) => {
        timers.push(setTimeout(() => {
          setInput(cmd.slice(0, i + 1))
          setSel(i + 1)
        }, 260 + i * 150))
      })
      timers.push(setTimeout(() => submit(cmd), 260 + cmd.length * 150 + 420))
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

  // Keep the newest line in view.
  useEffect(() => {
    const body = bodyRef.current
    if (body) body.scrollTop = body.scrollHeight
  }, [lines, input])

  function completeInput() {
    const parts = input.split(/\s+/)
    const last = parts[parts.length - 1]
    if (last === '') return
    const pool =
      parts.length === 1 ? COMMANDS : parts[0] === 'cd' ? SECTIONS : parts[0] === 'cat' ? FILES : []
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
      append([line(...promptSpans(input + '^C'))])
      setInput('')
      setSel(0)
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault()
      setLines([])
    }
  }

  // Focus on click, but never at the cost of selecting output text.
  function onBodyClick() {
    if (window.getSelection()?.isCollapsed) inputRef.current?.focus({ preventScroll: true })
  }

  const syncSel = (e) => setSel(e.target.selectionStart ?? e.target.value.length)

  return (
    <div className="wip-terminal" ref={rootRef}>
      <div className="wt-chrome">
        <span className="wt-dot" /><span className="wt-dot" /><span className="wt-dot" />
        <span className="wt-title">bill@coolest_website: ~</span>
        <span className={`wt-hint${focused ? ' wt-hint--off' : ''}`}>click · try 'help'</span>
      </div>
      <div
        className="wt-body"
        ref={bodyRef}
        onClick={onBodyClick}
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
          {promptSpans('').map((sp, j) => (
            <span key={j} className={`wt-${sp.c}`}>{sp.t}</span>
          ))}
          <span className="wt-txt">{input.slice(0, sel)}</span>
          <span className={`wt-cursor${focused ? '' : ' wt-cursor--idle'}`}>{input[sel] ?? ' '}</span>
          <span className="wt-txt">{input.slice(sel + 1)}</span>
          <input
            ref={inputRef}
            className="wt-input"
            value={input}
            onChange={(e) => { setInput(e.target.value); syncSel(e) }}
            onSelect={syncSel}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Terminal command input — type 'help' for commands"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  )
}
