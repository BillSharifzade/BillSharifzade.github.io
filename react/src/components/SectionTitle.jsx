import StrokeText from './StrokeText.jsx'

// Single source of truth for every section heading. The outline draws itself in
// dimmed white as the section scrolls into view, then solid white (--primary,
// the colour .section-title used to paint directly) wipes in behind it.
// fontSize 48 == the 3rem the headings used before; the SVG scales down
// proportionally on narrow viewports, which covers the old 2rem mobile rule.
export default function SectionTitle({ text, className = '', style, ...strokeProps }) {
  return (
    <h2 className={`section-title ${className}`.trim()} style={style}>
      <StrokeText
        text={text}
        strokeColor="rgba(255, 255, 255, 0.45)"
        fillColor="#ffffff"
        strokeWidth={1}
        fontSize={48}
        fontWeight={700}
        letterSpacing={0}
        drawDuration={1.1}
        fillDelay={0.12}
        stagger={0.04}
        // Measured against JetBrains Mono 700: below 5x the dash is shorter than
        // the widest glyph outline and ink leaks before the draw starts.
        dashScale={5}
        // Near-linear so the outline is actually drawing for most of the
        // duration; power2.out front-loads it and then sits idle.
        ease="power1.inOut"
        trigger="scroll"
        fillMode="wipe"
        {...strokeProps}
      />
    </h2>
  )
}
