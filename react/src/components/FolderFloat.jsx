import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import './FolderFloat.css';

// A skills folder holding one sheet per skill. Hover it (tap it on a touch
// screen) and each sheet lifts out as a pill with the skill's logos, settling
// into one of several arrangements above the folder. Adapted from React Bits'
// FolderFloat without the physics (matter-js) or the drifting: every bit of
// motion is a CSS transition. The look is fixed in FolderFloat.css.

const PILL_H = 36;
// Gap between the folder and the lowest pill.
const LIFT = 30;
const ROW = 52;
const GAP = 12;
// Closest two pills may come.
const SPACE = 2;
// Room each side of the folder's centre until it opens and measures the
// screen: what a centred folder has on a 360px phone.
const ROOM = 168;
// Widest the cloud spreads on a large screen, each side of the centre.
const MAX_ROOM = 280;
const EDGE = 12;
// A pill's width until it is measured: padding, 16px logos 4px apart, the gap
// after them, and 13px JetBrains Mono.
const PAD = 28;
const LOGO = 20;
const CHAR = 7.8;
const PAPER_TURN = [-2.4, 1.8, -1.2, 2.2, -1.6, 1.2];
const PAPER_SHADE = ['#cdcdcd', '#dcdcdc', '#eaeaea'];
const DEG = Math.PI / 180;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const jitter = i => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

const estimate = ({ name, logos }) => PAD + logos.length * LOGO + 4 + name.length * CHAR;

// How far a pill of this width may lean: its ends move at most 7px up or down,
// so pills on neighbouring rows never touch.
const maxLean = width => Math.min(12, Math.asin(Math.min(1, 14 / width)) / DEG);

const steps = (w, half, dir) => {
  const reach = Math.max(0, half - Math.max(...w) / 2);
  const step = w.length > 1 ? Math.min(70, (2 * reach) / (w.length - 1)) : 0;
  return w.map((_, i) => ({ x: dir * (i - (w.length - 1) / 2) * step, y: -LIFT - i * ROW, r: -dir * 7 }));
};

const SCATTER = [
  { x: -0.6, dy: 2, r: -10, s: 1.06 },
  { x: 0.55, dy: -4, r: 8, s: 0.94 },
  { x: -0.15, dy: 3, r: -5, s: 1 },
  { x: 0.4, dy: -2, r: 11, s: 0.92 }
];

// Each takes the pills' widths and the room either side of the centre, and
// returns where each pill sits: x of its centre and y of its top edge, both
// from the top middle of the folder, a lean in degrees and a scale. One that
// cannot work in the room returns null.
const ARRANGEMENTS = {
  // Side by side on a shallow arch, leaning down its sides.
  arch(w, half) {
    const total = w.reduce((sum, pw) => sum + pw, GAP * (w.length - 1));
    if (total > half * 2) return null;
    let left = -total / 2;
    return w.map(pw => {
      const x = left + pw / 2;
      left += pw + GAP;
      const t = x / (total / 2);
      return { x, y: -LIFT - 24 * (1 - t * t), r: 9 * t };
    });
  },
  // Rows packed up to the width of the original cloud, each nudged the other way.
  cloud(w, half) {
    const limit = Math.min(half, 170) * 2;
    const rows = [];
    w.forEach((pw, i) => {
      const row = rows.at(-1);
      if (row && row.width + GAP + pw <= limit) {
        row.items.push(i);
        row.width += GAP + pw;
      } else rows.push({ items: [i], width: pw });
    });
    const pos = [];
    rows.forEach((row, ri) => {
      let x = -row.width / 2 + (ri % 2 ? 16 : -16);
      row.items.forEach(i => {
        const j = jitter(i);
        pos[i] = { x: x + w[i] / 2, y: -LIFT - ri * ROW - j * 6, r: 8 * (j * 2 - 1) };
        x += w[i] + GAP;
      });
    });
    return pos;
  },
  // Two side by side, the rest stacked above the middle.
  pyramid(w, half) {
    if (w.length < 3) return null;
    const base = w[0] + GAP + w[1];
    if (base > half * 2) return null;
    return w.map((pw, i) => {
      if (i < 2) return { x: (i ? 1 : -1) * (base - pw) / 2, y: -LIFT, r: i ? 5 : -5 };
      return { x: 0, y: -LIFT - (i - 1) * ROW - 4, r: i % 2 ? 3 : -3 };
    });
  },
  // One pill a step, climbing to the right or to the left.
  stairs: (w, half) => steps(w, half, 1),
  'stairs-left': (w, half) => steps(w, half, -1),
  // One pill a row, swinging left and right.
  zigzag: (w, half) =>
    w.map((pw, i) => {
      const side = i % 2 ? 1 : -1;
      return { x: side * Math.min(56, Math.max(0, half - pw / 2)), y: -LIFT - i * ROW, r: -side * 8 };
    }),
  // One pill a row, at different sizes and angles.
  scatter: (w, half) =>
    w.map((pw, i) => {
      const p = SCATTER[i % SCATTER.length];
      const reach = Math.max(0, half - (pw * p.s) / 2);
      return { x: p.x * Math.min(reach, 110), y: -LIFT - i * ROW - p.dy, r: p.r, s: p.s };
    }),
  // A straight stack, each pill a little smaller as it rises.
  tower: w => w.map((_, i) => ({ x: (jitter(i) - 0.5) * 12, y: -LIFT - i * ROW, r: i % 2 ? 2 : -2, s: 1 - i * 0.05 })),
  flat: w => w.map((_, i) => ({ x: 0, y: -LIFT - i * ROW, r: 0 }))
};

// The rectangles a and b, each turned about its centre, come closer than SPACE.
const overlap = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.cy - a.cy;
  const reach = (p, ax, ay) => {
    const c = Math.cos(p.r * DEG);
    const s = Math.sin(p.r * DEG);
    return (Math.abs(c * ax + s * ay) * p.w + Math.abs(-s * ax + c * ay) * p.h) / 2;
  };
  return [a.r, b.r].every(deg => {
    const c = Math.cos(deg * DEG);
    const s = Math.sin(deg * DEG);
    return [
      [c, s],
      [-s, c]
    ].every(([ax, ay]) => Math.abs(dx * ax + dy * ay) < reach(a, ax, ay) + reach(b, ax, ay) + SPACE);
  });
};

// Fits an arrangement into the room: leans clamped, the whole cloud slid as
// little as possible to stay on screen. Null if it doesn't fit or pills touch,
// unless forced.
const settle = (raw, w, room, force) => {
  const pills = raw.map((p, i) => {
    const s = p.s ?? 1;
    const width = w[i] * s;
    const height = PILL_H * s;
    const lean = maxLean(width);
    const r = clamp(p.r, -lean, lean);
    const c = Math.abs(Math.cos(r * DEG));
    const sn = Math.abs(Math.sin(r * DEG));
    return { x: p.x, y: p.y, cy: p.y + PILL_H / 2, r, s, w: width, h: height, hw: (c * width + sn * height) / 2, hh: (sn * width + c * height) / 2 };
  });
  const low = -room.left - Math.min(...pills.map(p => p.x - p.hw));
  const high = room.right - Math.max(...pills.map(p => p.x + p.hw));
  if (low > high && !force) return null;
  const dx = low > high ? (low + high) / 2 : clamp(0, low, high);
  pills.forEach(p => {
    p.x += dx;
  });
  if (!force && pills.some((a, i) => pills.slice(i + 1).some(b => overlap(a, b)))) return null;
  return pills;
};

const arrange = (items, widths, room, preferred) => {
  const w = items.map((item, i) => widths[i] ?? estimate(item));
  const half = (room.left + room.right) / 2;
  for (const name of [...preferred, 'tower', 'flat']) {
    const raw = ARRANGEMENTS[name](w, half);
    const pills = raw && settle(raw, w, room, false);
    if (pills) return pills;
  }
  return settle(ARRANGEMENTS.flat(w, half), w, room, true);
};

// The logos are ~11 kB of SVG paths, more than the folders themselves, and
// stay hidden until a folder opens. They load in their own chunk once the
// browser is idle; a pill keeps the space for its logos until they land.
let logoRequest = null;
const loadLogos = () => {
  logoRequest ??= import('../data/skillLogos.js')
    .then(m => m.SKILL_LOGOS)
    .catch(() => {
      logoRequest = null;
      return null;
    });
  return logoRequest;
};

function useLogos() {
  const [logos, setLogos] = useState(null);
  useEffect(() => {
    let active = true;
    const load = () => loadLogos().then(l => active && setLogos(l));
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(load, { timeout: 3000 });
      return () => {
        active = false;
        cancelIdleCallback(id);
      };
    }
    const id = setTimeout(load, 300);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, []);
  return logos;
}

// `items` are { name, logos } with logos named as in skillLogos.js. Keep the
// array stable between renders: a new one means measuring the pills again.
export default function FolderFloat({ label, icon, items, arrangements = [] }) {
  const [open, setOpen] = useState(false);
  const [widths, setWidths] = useState([]);
  const [room, setRoom] = useState({ left: ROOM, right: ROOM });
  const logos = useLogos();
  const rootRef = useRef(null);
  const pillRefs = useRef([]);
  const pointer = useRef('');
  const listId = useId();
  const n = items.length;
  const pills = arrange(items, widths, room, arrangements);

  // While open, the area the pills cover belongs to the folder, so the mouse
  // can move up to them without closing it.
  const cloudLeft = Math.min(...pills.map(p => p.x - p.hw)) - GAP;
  const cloudTop = Math.min(...pills.map(p => p.cy - p.hh)) - GAP;
  const cloudRight = Math.max(...pills.map(p => p.x + p.hw)) + GAP;
  const cloudBottom = Math.max(0, ...pills.map(p => p.cy + p.hh));

  // The first render (and the pre-rendered HTML) places the pills by the
  // estimate above; the real widths replace it before the folder can open.
  useLayoutEffect(() => {
    let active = true;
    const measure = () => {
      const next = pillRefs.current.slice(0, items.length).map(el => el?.offsetWidth);
      if (!active || next.some(w => w === undefined)) return;
      setWidths(prev => (prev.length === next.length && prev.every((w, i) => w === next[i]) ? prev : next));
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      active = false;
    };
  }, [items]);

  // A tap outside closes a folder a tap opened; the mouse closes it by leaving.
  useEffect(() => {
    if (!open) return undefined;
    const away = e => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const show = () => {
    const box = rootRef.current.getBoundingClientRect();
    const centre = box.left + box.width / 2;
    const left = clamp(centre - EDGE, 0, MAX_ROOM);
    const right = clamp(document.documentElement.clientWidth - centre - EDGE, 0, MAX_ROOM);
    setRoom(prev => (prev.left === left && prev.right === right ? prev : { left, right }));
    setOpen(true);
  };

  return (
    <div
      ref={rootRef}
      className="folder-float"
      data-open={open ? '' : undefined}
      style={{
        '--ff-n': n,
        '--ff-cloud-x': `${cloudLeft.toFixed(1)}px`,
        '--ff-cloud-y': `${cloudTop.toFixed(1)}px`,
        '--ff-cloud-w': `${(cloudRight - cloudLeft).toFixed(1)}px`,
        '--ff-cloud-h': `${(cloudBottom - cloudTop).toFixed(1)}px`
      }}
      onPointerDown={e => {
        pointer.current = e.pointerType;
      }}
      onPointerEnter={e => {
        if (e.pointerType === 'mouse') show();
      }}
      onPointerLeave={e => {
        if (e.pointerType === 'mouse') setOpen(false);
      }}
      onKeyDown={e => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <ul id={listId} className="folder-float__items" aria-hidden={!open}>
        {items.map((item, i) => (
          <li
            key={item.name}
            ref={el => {
              pillRefs.current[i] = el;
            }}
            className="folder-float__item"
            style={{
              '--i': i,
              '--x': `${pills[i].x.toFixed(1)}px`,
              '--y': `${pills[i].y.toFixed(1)}px`,
              '--r': `${pills[i].r.toFixed(2)}deg`,
              '--s': pills[i].s.toFixed(3)
            }}
          >
            <span className="folder-float__logos">
              {item.logos.map(slug => (
                <svg key={slug} viewBox="0 0 24 24" aria-hidden="true">
                  {logos?.[slug] && <path d={logos[slug]} />}
                </svg>
              ))}
            </span>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
      <div className="folder-float__folder">
        <span className="folder-float__back" aria-hidden="true" />
        {items.map((item, i) => (
          <span
            key={item.name}
            className="folder-float__paper"
            aria-hidden="true"
            style={{
              '--i': i,
              '--turn': `${PAPER_TURN[i % PAPER_TURN.length]}deg`,
              '--shade': PAPER_SHADE[i % PAPER_SHADE.length]
            }}
          />
        ))}
        <span className="folder-float__front" aria-hidden="true">
          {icon && <Icon name={icon} className="folder-float__icon" />}
          <span className="folder-float__label">{label}</span>
          <span className="folder-float__sub">
            {n} {n === 1 ? 'skill' : 'skills'}
          </span>
        </span>
        <button
          type="button"
          className="folder-float__trigger"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${label} skills`}
          onClick={e => {
            // A mouse opens the folder by hovering it, so its click only
            // reopens one closed with Escape. Taps and keys toggle it.
            if (e.detail !== 0 && pointer.current === 'mouse') {
              if (!open) show();
            } else if (open) setOpen(false);
            else show();
          }}
        />
      </div>
    </div>
  );
}
