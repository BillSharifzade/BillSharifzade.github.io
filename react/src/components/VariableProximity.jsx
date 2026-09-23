import { forwardRef, useMemo, useRef, useEffect } from 'react';
import { useOnScreen } from '../hooks/useOnScreen.js';
import './VariableProximity.css';

// Runs `callback` per frame, but only while `active` — an always-on rAF loop
// keeps the main thread awake (and the laptop fan on) for an effect nobody can
// see when the element is scrolled away.
function useAnimationFrame(callback, active) {
    useEffect(() => {
        if (!active) return;
        let frameId;
        const loop = () => {
            callback();
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [callback, active]);
}

function useMousePositionRef(containerRef) {
    const positionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const updatePosition = (x, y) => {
            if (containerRef?.current) {
                const rect = containerRef.current.getBoundingClientRect();
                positionRef.current = { x: x - rect.left, y: y - rect.top };
            } else {
                positionRef.current = { x, y };
            }
        };

        const handleMouseMove = (ev) => updatePosition(ev.clientX, ev.clientY);
        const handleTouchMove = (ev) => {
            const touch = ev.touches[0];
            updatePosition(touch.clientX, touch.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [containerRef]);

    return positionRef;
}

const VariableProximity = forwardRef((props, ref) => {
    const {
        label,
        fromFontVariationSettings,
        toFontVariationSettings,
        containerRef,
        radius = 50,
        falloff = 'linear',
        className = '',
        onClick,
        style,
        ...restProps
    } = props;

    const letterRefs = useRef([]);
    const interpolatedSettingsRef = useRef([]);
    const mousePositionRef = useMousePositionRef(containerRef);
    const lastPositionRef = useRef({ x: null, y: null });

    const parsedSettings = useMemo(() => {
        const parseSettings = (settingsStr) =>
            new Map(
                settingsStr
                    .split(',')
                    .map(s => s.trim())
                    .map(s => {
                        const [name, value] = s.split(' ');
                        return [name.replace(/['"]/g, ''), parseFloat(value)];
                    })
            );

        const fromSettings = parseSettings(fromFontVariationSettings);
        const toSettings = parseSettings(toFontVariationSettings);

        return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
            axis,
            fromValue,
            toValue: toSettings.get(axis) ?? fromValue
        }));
    }, [fromFontVariationSettings, toFontVariationSettings]);

    const calculateDistance = (x1, y1, x2, y2) =>
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    const calculateFalloff = (distance) => {
        const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
        switch (falloff) {
            case 'exponential':
                return norm ** 2;
            case 'gaussian':
                return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
            case 'linear':
            default:
                return norm;
        }
    };

    // Letter centres only move when layout does, so they are measured once and
    // reused. Reading them back every frame forced a full layout flush per
    // letter on every mouse move — the single most expensive thing on the page.
    const centersRef = useRef(null);
    const staleRef = useRef(true);
    const restedRef = useRef(false);

    useEffect(() => {
        const invalidate = () => { staleRef.current = true; };
        window.addEventListener('resize', invalidate);
        window.addEventListener('scroll', invalidate, { passive: true });
        document.fonts?.ready.then(invalidate).catch(() => { });
        return () => {
            window.removeEventListener('resize', invalidate);
            window.removeEventListener('scroll', invalidate);
        };
    }, [label]);

    const active = useOnScreen(containerRef);

    useAnimationFrame(() => {
        if (!containerRef?.current) return;
        const { x, y } = mousePositionRef.current;
        if (lastPositionRef.current.x === x && lastPositionRef.current.y === y) {
            return;
        }
        lastPositionRef.current = { x, y };

        if (staleRef.current || !centersRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            centersRef.current = letterRefs.current.map((letterRef) => {
                if (!letterRef) return null;
                const rect = letterRef.getBoundingClientRect();
                return {
                    cx: rect.left + rect.width / 2 - containerRect.left,
                    cy: rect.top + rect.height / 2 - containerRect.top,
                };
            });
            staleRef.current = false;
        }

        const centers = centersRef.current;

        // Far from every letter: reset once, then stay idle until the pointer
        // comes back into range.
        const inRange = centers.some(
            (c) => c && calculateDistance(x, y, c.cx, c.cy) < radius
        );
        if (!inRange) {
            if (restedRef.current) return;
            restedRef.current = true;
            letterRefs.current.forEach((letterRef) => {
                if (letterRef) letterRef.style.fontVariationSettings = fromFontVariationSettings;
            });
            return;
        }
        restedRef.current = false;

        letterRefs.current.forEach((letterRef, index) => {
            const center = centers[index];
            if (!letterRef || !center) return;

            const distance = calculateDistance(x, y, center.cx, center.cy);

            if (distance >= radius) {
                letterRef.style.fontVariationSettings = fromFontVariationSettings;
                return;
            }

            const falloffValue = calculateFalloff(distance);
            const newSettings = parsedSettings
                .map(({ axis, fromValue, toValue }) => {
                    const interpolatedValue = fromValue + (toValue - fromValue) * falloffValue;
                    return `'${axis}' ${interpolatedValue}`;
                })
                .join(', ');

            interpolatedSettingsRef.current[index] = newSettings;
            letterRef.style.fontVariationSettings = newSettings;
        });
    }, active);

    const words = label.split(' ');
    let letterIndex = 0;

    return (
        <span
            ref={ref}
            className={`${className} variable-proximity`}
            onClick={onClick}
            style={{ display: 'inline', ...style }}
            {...restProps}
        >
            {words.map((word, wordIndex) => (
                <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {word.split('').map(letter => {
                        const currentLetterIndex = letterIndex++;
                        return (
                            <span
                                key={currentLetterIndex}
                                ref={el => {
                                    letterRefs.current[currentLetterIndex] = el;
                                }}
                                style={{
                                    display: 'inline-block',
                                    fontVariationSettings: interpolatedSettingsRef.current[currentLetterIndex]
                                }}
                                aria-hidden="true"
                            >
                                {letter}
                            </span>
                        );
                    })}
                    {wordIndex < words.length - 1 && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
                </span>
            ))}
            <span className="sr-only">{label}</span>
        </span>
    );
});

VariableProximity.displayName = 'VariableProximity';
export default VariableProximity;
