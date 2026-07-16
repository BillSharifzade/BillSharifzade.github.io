import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './BounceCards.css';

export default function BounceCards({
    className = '',
    images = [],
    // Monochrome icon cards: [{ title, path }] with 24x24 SVG path data.
    // When provided, takes precedence over `images`.
    items = [],
    containerWidth = 400,
    containerHeight = 400,
    animationDelay = 0.5,
    animationStagger = 0.06,
    easeType = 'elastic.out(1, 0.8)',
    transformStyles = [
        'rotate(10deg) translate(-170px)',
        'rotate(5deg) translate(-85px)',
        'rotate(-3deg)',
        'rotate(-10deg) translate(85px)',
        'rotate(2deg) translate(170px)'
    ],
    enableHover = true,
    pushOffset = 160
}) {
    const containerRef = useRef(null);
    const cards = items.length ? items : images;
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

        cards.forEach((_, i) => {
            const target = q(`.card-${i}`);
            gsap.killTweensOf(target);

            const baseTransform = transformStyles[i] || 'none';

            if (i === hoveredIdx) {
                const noRotationTransform = getNoRotationTransform(baseTransform);
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

        cards.forEach((_, i) => {
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
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className={`card card-${idx}${items.length ? ' card--icon' : ''}`}
                    style={{
                        transform: transformStyles[idx] ?? 'none'
                    }}
                    onMouseEnter={() => pushSiblings(idx)}
                    onMouseLeave={resetSiblings}
                >
                    {items.length ? (
                        <>
                            <svg
                                className="tech-icon"
                                viewBox="0 0 24 24"
                                role="img"
                                aria-label={card.title}
                            >
                                <path d={card.path} fill="#ffffff" />
                            </svg>
                            <span className="tech-icon-label">{card.title}</span>
                        </>
                    ) : (
                        <img className="image" src={card} alt={`card-${idx}`} />
                    )}
                </div>
            ))}
        </div>
    );
}
