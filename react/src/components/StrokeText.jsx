import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

import './StrokeText.css';

// Titles drawn on scroll start once their top reaches this far down the
// window. This used to be a ScrollTrigger ('top 82%', once); one shared
// listener does the same without keeping ScrollTrigger's loops alive for the
// whole visit. Positions are measured when ScrollTrigger measured them: the
// frame after a title arms, at window load, and 0.2 s after a resize that is
// more than a phone's address bar showing or hiding.
const SCROLL_START = 0.82;
const waiting = new Map();
let viewport = 0;
let resizeTimer = 0;
let baseSize = [0, 0];

const checkWaiting = () => {
  const y = window.scrollY;
  waiting.forEach((title, el) => {
    if (title.top === null || y < title.top - SCROLL_START * viewport) return;
    waiting.delete(el);
    title.play();
  });
  if (!waiting.size) stopWatching();
};

// The window's height as 100vh gives it, which the address bar doesn't move.
const measureWaiting = () => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;width:1px;height:100vh;visibility:hidden';
  document.body.appendChild(probe);
  viewport = probe.offsetHeight || window.innerHeight;
  probe.remove();
  baseSize = [window.innerWidth, window.innerHeight];
  waiting.forEach((title, el) => {
    title.top = el.getBoundingClientRect().top + window.scrollY;
  });
  checkWaiting();
};

const onResize = () => {
  const touch = window.matchMedia?.('(hover: none), (pointer: coarse)').matches;
  const [w, h] = baseSize;
  if (touch && w === window.innerWidth && Math.abs(window.innerHeight - h) <= window.innerHeight * 0.25) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(measureWaiting, 200);
};

const onLoad = () => measureWaiting();

function startWatching() {
  window.addEventListener('scroll', checkWaiting, { passive: true });
  window.addEventListener('resize', onResize);
  if (document.readyState !== 'complete') window.addEventListener('load', onLoad, { once: true });
}

function stopWatching() {
  window.removeEventListener('scroll', checkWaiting);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('load', onLoad);
  clearTimeout(resizeTimer);
}

/** Plays `play` once `el` is scrolled up to SCROLL_START. Returns a cancel. */
function playOnScroll(el, play) {
  if (!waiting.size) startWatching();
  waiting.set(el, { play, top: null });
  const frame = requestAnimationFrame(measureWaiting);
  return () => {
    cancelAnimationFrame(frame);
    if (waiting.delete(el) && !waiting.size) stopWatching();
  };
}

const DEFAULT_TEXT = 'Draw Attention';

const StrokeText = ({
  text = DEFAULT_TEXT,
  strokeColor = '#A78BFA',
  fillColor = '#F8FAFC',
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = 'power2.out',
  trigger = 'mount',
  fillMode = 'wipe',
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = -4,
  reverse = false,
  dashScale = 7,
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);
  const strokeTextRef = useRef(null);
  const wipeRectRef = useRef(null);

  const [box, setBox] = useState(null);

  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const characters = useMemo(() => Array.from(String(text ?? '')), [text]);
  const charCount = characters.length;

  const dash = Math.max(fontSize * dashScale, 200);

  const fontStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`
    }),
    [fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const node = strokeTextRef.current;
    if (!node) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;
      let bbox;
      try {
        bbox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.1);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };

      setBox(prev =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5
          ? prev
          : next
      );
    };

    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [characters, fontSize, fontWeight, letterSpacing, strokeWidth]);

  useEffect(() => {
    const root = rootRef.current;
    if (typeof window === 'undefined' || !root || !box) return undefined;

    const strokes = gsap.utils.toArray(root.querySelectorAll('[data-stroke-char]'));
    const fills = gsap.utils.toArray(root.querySelectorAll('[data-fill-char]'));
    const wipe = wipeRectRef.current;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig = reverse ? { each: stagger, from: 'end' } : stagger;
    const targets = [...strokes, ...fills, wipe].filter(Boolean);
    const drawSpan = drawDuration + stagger * Math.max(0, charCount - 1);

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: fillEnabled ? box.width : 0 } });
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setEnd();
      return () => gsap.killTweensOf(targets);
    }

    const build = () => {
      setStart();
      const tl = gsap.timeline({
        paused: true,
        repeat: trigger === 'loop' ? -1 : 0,
        repeatDelay: trigger === 'loop' ? 0.9 : 0,
        defaults: { overwrite: 'auto' }
      });

      tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig }, 0);

      if (useWipe && wipe) {
        tl.to(
          wipe,
          { attr: { width: box.width }, duration: fillDuration, ease: 'power2.inOut' },
          drawSpan + fillDelay
        );
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
          drawSpan + fillDelay
        );
      }

      return tl;
    };

    let timeline = null;
    let cancelScroll = null;
    let removeHover = null;

    if (trigger === 'hover') {
      setEnd();
      const play = () => {
        timeline?.kill();
        timeline = build();
        timeline.play(0);
      };
      root.addEventListener('pointerenter', play);
      removeHover = () => root.removeEventListener('pointerenter', play);
    } else {
      timeline = build();
      if (trigger === 'scroll') {
        cancelScroll = playOnScroll(root, () => timeline?.play(0));
      } else {
        timeline.play(0);
      }
    }

    return () => {
      removeHover?.();
      cancelScroll?.();
      timeline?.kill();
      gsap.killTweensOf(targets);
    };
  }, [box, charCount, dash, drawDuration, fillDelay, stagger, ease, trigger, fillMode, reverse]);

  const viewBox = box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 ${-fontSize} 600 ${fontSize * 1.3}`;
  const boxWidth = box ? box.width : 600;
  const boxHeight = box ? box.height : fontSize * 1.3;

  return (
    <span
      ref={rootRef}
      className={`stroke-text ${trigger === 'hover' ? 'stroke-text--hover' : ''} ${className}`.trim()}
      style={{
        ...style,
        '--stroke-text-width': `${Math.round(boxWidth)}px`,
        '--stroke-text-ratio': `${boxWidth} / ${boxHeight}`
      }}
      role="img"
      aria-label={String(text ?? '')}
    >
      <svg className="stroke-text__svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {fillMode === 'wipe' && box && (
          <defs>
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect ref={wipeRectRef} x={box.x} y={box.y} width="0" height={box.height} />
            </clipPath>
          </defs>
        )}

        <text
          ref={strokeTextRef}
          className="stroke-text__stroke"
          x="0"
          y="0"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {characters.map((char, index) => (
            <tspan data-stroke-char key={`s-${index}`}>
              {char}
            </tspan>
          ))}
        </text>

        {/* The wipe clips a group around the fill, not the text itself: WebKit
            (Safari, every iPhone browser) ignores a clip on <text> that covers
            none of it, so the fill showed in full before the wipe began. */}
        <g clipPath={fillMode === 'wipe' && box ? `url(#${wipeId})` : undefined}>
          <text className="stroke-text__fill" x="0" y="0" fill={fillColor} stroke="none" style={fontStyle}>
            {characters.map((char, index) => (
              <tspan data-fill-char key={`f-${index}`}>
                {char}
              </tspan>
            ))}
          </text>
        </g>
      </svg>
    </span>
  );
};

export default StrokeText;
