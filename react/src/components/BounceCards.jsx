import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AnimatedTechIcon from './AnimatedTechIcon.jsx';
import './BounceCards.css';

// How long a card has to be held (hovered, focused or tapped) before its logo
// turns into what the technology is about. Its border fills over this time.
const HOLD_MS = 2000;

// The border, drawn as a path so it can fill like a timer: from the middle of
// the top edge, clockwise, matching the card's 160px box and 25px corners.
const RING =
    'M 80 2.5 H 135 A 22.5 22.5 0 0 1 157.5 25 V 135 A 22.5 22.5 0 0 1 135 157.5 H 25 ' +
    'A 22.5 22.5 0 0 1 2.5 135 V 25 A 22.5 22.5 0 0 1 25 2.5 Z';

function TechCard({ item, index, total, transform, onEnter, onLeave }) {
    // idle → charging (border filling) → revealed (headline and detail)
    const [phase, setPhase] = useState('idle');
    const timer = useRef(0);
    const pointer = useRef('');
    const source = useRef('');

    const start = from => {
        clearTimeout(timer.current);
        source.current = from;
        setPhase('charging');
        timer.current = setTimeout(() => setPhase('revealed'), HOLD_MS);
    };

    const stop = () => {
        clearTimeout(timer.current);
        source.current = '';
        setPhase('idle');
    };

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <div
            className={`card card--icon card-${index}`}
            data-phase={phase}
            style={{ transform, '--z': total - index }}
            tabIndex={0}
            role="group"
            aria-label={item.title}
            onPointerDown={e => {
                pointer.current = e.pointerType;
            }}
            onPointerEnter={e => {
                if (e.pointerType !== 'mouse') return;
                onEnter(index);
                start('mouse');
            }}
            onPointerLeave={e => {
                if (e.pointerType !== 'mouse') return;
                onLeave();
                stop();
            }}
            onClick={() => {
                // Touch and pen have no hover: a tap starts the timer, another puts the logo back.
                if (pointer.current === 'mouse') return;
                if (phase === 'idle') {
                    onEnter(index);
                    start('tap');
                } else {
                    onLeave();
                    stop();
                }
            }}
            onFocus={e => {
                if (phase === 'idle' && e.target.matches(':focus-visible')) start('focus');
            }}
            onBlur={() => {
                if (source.current !== 'mouse') stop();
            }}
        >
            <svg className="card-ring" viewBox="0 0 160 160" aria-hidden="true">
                <path className="card-ring__track" d={RING} />
                <path className="card-ring__fill" d={RING} pathLength="100" />
            </svg>
            <div className="card-face card-face--logo">
                <AnimatedTechIcon title={item.title} slug={item.slug} path={item.path} />
                <span className="tech-icon-label">{item.title}</span>
            </div>
            <div className="card-face card-face--info">
                <span className="card-info__tech">{item.title}</span>
                <strong className="card-info__headline">{item.headline}</strong>
                <span className="card-info__detail">{item.detail}</span>
            </div>
        </div>
    );
}

export default function BounceCards({
    className = '',
    items = [],
    containerWidth = 400,
    containerHeight = 400,
    animationDelay = 0.5,
    animationStagger = 0.06,
    easeType = 'elastic.out(1, 0.8)',
    transformStyles = [],
    enableHover = true,
    pushOffset = 160
}) {
    const containerRef = useRef(null);
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.card',
                { scale: 0 },
                {
                    scale: 1,
                    stagger: animationStagger,
                    ease: easeType,
                    delay: animationDelay
                }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [animationStagger, easeType, animationDelay]);

    const getNoRotationTransform = transformStr => {
        const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
        if (hasRotate) {
            return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
        } else if (transformStr === 'none') {
            return 'rotate(0deg)';
        } else {
            return `${transformStr} rotate(0deg)`;
        }
    };

    const getPushedTransform = (baseTransform, offsetX) => {
        const translateRegex = /translate\(([-0-9.]+)px\)/;
        const match = baseTransform.match(translateRegex);
        if (match) {
            const currentX = parseFloat(match[1]);
            const newX = currentX + offsetX;
            return baseTransform.replace(translateRegex, `translate(${newX}px)`);
        } else {
            return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
        }
    };

    const pushSiblings = hoveredIdx => {
        if (!enableHover || !containerRef.current) return;

        const q = gsap.utils.selector(containerRef);
        const zoom = window.matchMedia('(max-width: 700px)').matches;

        items.forEach((_, i) => {
            const target = q(`.card-${i}`);
            gsap.killTweensOf(target);

            const baseTransform = transformStyles[i] || 'none';

            if (i === hoveredIdx) {
                // On a phone the whole stack is drawn at half size or less, too
                // small to read a revealed card, so the card in hand comes to
                // the middle at full size.
                const noRotationTransform = zoom ? 'rotate(0deg) translate(0px) scale(1.8)' : getNoRotationTransform(baseTransform);
                gsap.to(target, {
                    transform: noRotationTransform,
                    duration: 0.4,
                    ease: 'back.out(1.4)',
                    overwrite: 'auto'
                });
            } else {
                const offsetX = i < hoveredIdx ? -pushOffset : pushOffset;
                const pushedTransform = getPushedTransform(baseTransform, offsetX);

                const distance = Math.abs(hoveredIdx - i);
                const delay = distance * 0.05;

                gsap.to(target, {
                    transform: pushedTransform,
                    duration: 0.4,
                    ease: 'back.out(1.4)',
                    delay,
                    overwrite: 'auto'
                });
            }
        });
    };

    const resetSiblings = () => {
        if (!enableHover || !containerRef.current) return;

        const q = gsap.utils.selector(containerRef);

        items.forEach((_, i) => {
            const target = q(`.card-${i}`);
            gsap.killTweensOf(target);
            const baseTransform = transformStyles[i] || 'none';
            gsap.to(target, {
                transform: baseTransform,
                duration: 0.4,
                ease: 'back.out(1.4)',
                overwrite: 'auto'
            });
        });
    };

    return (
        <div
            className={`bounceCardsContainer ${className}`}
            ref={containerRef}
            style={{
                position: 'relative',
                width: containerWidth,
                height: containerHeight
            }}
        >
            {items.map((item, idx) => (
                <TechCard
                    key={item.slug}
                    item={item}
                    index={idx}
                    total={items.length}
                    transform={transformStyles[idx] ?? 'none'}
                    onEnter={pushSiblings}
                    onLeave={resetSiblings}
                />
            ))}
        </div>
    );
}
