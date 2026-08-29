import StrokeText from './StrokeText.jsx'

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
        dashScale={5}
        ease="power1.inOut"
        trigger="scroll"
        fillMode="wipe"
        {...strokeProps}
      />
    </h2>
  )
}
