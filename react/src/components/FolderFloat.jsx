import { useId, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import './FolderFloat.css';

// A skills folder: press it and the skills rise out of it into pills above.
// Adapted from React Bits' FolderFloat without the physics (matter-js) or the
// drifting, so once the pills land they stay put and every bit of motion is a
// CSS transition. The look is fixed in FolderFloat.css.

// Half the widest a row of pills may be. The cloud is centred on the folder,
// so this keeps it inside a 360px phone screen.
const SPREAD = 160;
// Gap between the folder and the lowest row.
const LIFT = 26;
// Most a pill leans, in degrees.
const TILT = 8;
const GAP = 12;
const ROW = 52;
// A pill's width until it is measured: its padding and gap, plus 13px and
// 11px JetBrains Mono characters for the name and the level.
const PAD = 36;
const NAME_CHAR = 7.8;
const LEVEL_CHAR = 6.6;

const jitter = i => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

// Packs the pills into centred rows, the first just above the folder, each
// nudged off-centre the other way and leaning a little.
const layout = (items, widths) => {
  const rows = [];
  let row = [];
  let width = 0;
  items.forEach(([name, level], i) => {
    const pw = widths[i] ?? PAD + name.length * NAME_CHAR + level.length * LEVEL_CHAR;
    if (row.length && width + GAP + pw > SPREAD * 2) {
      rows.push({ items: row, width });
      row = [];
      width = 0;
    }
    row.push({ i, pw });
    width += (row.length > 1 ? GAP : 0) + pw;
  });
  if (row.length) rows.push({ items: row, width });
  const pos = [];
  rows.forEach((r, ri) => {
    let x = -r.width / 2;
    const shift = (ri % 2 ? 1 : -1) * Math.min(16, SPREAD * 0.1);
    r.items.forEach(({ i, pw }) => {
      const j = jitter(i);
      pos[i] = { x: x + pw / 2 + shift + (j - 0.5) * 6, y: -LIFT - ri * ROW - j * 6, r: TILT * (j * 2 - 1) };
      x += pw + GAP;
    });
  });
  return pos;
};

// `items` is a list of [name, level] pairs; keep the array stable between
// renders, since a new one means measuring the pills again.
export default function FolderFloat({ label, icon, items }) {
  const [open, setOpen] = useState(false);
  const [widths, setWidths] = useState([]);
  const pillRefs = useRef([]);
  const listId = useId();
  const n = items.length;
  const pos = layout(items, widths);

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

  return (
    <div
      className="folder-float"
      data-open={open ? '' : undefined}
      style={{ '--ff-n': n }}
      onKeyDown={e => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <ul id={listId} className="folder-float__items" aria-hidden={!open}>
        {items.map(([name, level], i) => (
          <li
            key={name}
            ref={el => {
              pillRefs.current[i] = el;
            }}
            className="folder-float__item"
            style={{
              '--i': i,
              '--x': `${pos[i].x.toFixed(1)}px`,
              '--y': `${pos[i].y.toFixed(1)}px`,
              '--r': `${pos[i].r.toFixed(2)}deg`
            }}
          >
            <span>{name}</span>
            <span className="folder-float__level">{level}</span>
          </li>
        ))}
      </ul>
      <div className="folder-float__folder">
        <span className="folder-float__back" aria-hidden="true" />
        <span className="folder-float__paper" aria-hidden="true" />
        <span className="folder-float__front" aria-hidden="true">
          <span className="folder-float__label">
            {icon && <Icon name={icon} />}
            {label}
          </span>
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
          onClick={() => setOpen(o => !o)}
        />
      </div>
    </div>
  );
}
