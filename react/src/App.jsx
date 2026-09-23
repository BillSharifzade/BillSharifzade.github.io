import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import DecryptedText from './components/DecryptedText.jsx'
import Icon from './components/Icon.jsx'
import ProfileCard from './components/ProfileCard.jsx'
import Folder from './components/Folder.jsx'
import ContactDevice from './components/ContactDevice.jsx'
import TargetCursor from './components/TargetCursor.jsx'
import mainAvatar from './assets/main_img.webp'
import BounceCards from './components/BounceCards.jsx'
import { techIcons } from './data/techIcons.js'
import { projects } from './data/cv.js'
import { projectCovers } from './data/projectCovers.js'
import { resolveIcons } from './data/projectIcons.js'
import AccordionGallery from './components/AccordionGallery.jsx'
import ExperienceJourney from './components/ExperienceJourney.jsx'
import SectionTitle from './components/SectionTitle.jsx'
import VariableProximity from './components/VariableProximity.jsx'
import './components/HobbyBackgrounds.css'
import DownloadCvButton from './components/DownloadCvButton.jsx'
import ScrollStack, { ScrollStackItem } from './components/ScrollStack.jsx'
import WipTerminal from './components/WipTerminal.jsx'
import VisitorCounter from './components/VisitorCounter.jsx'
import './index.css'

// Beams pulls in three.js (~240 kB gzipped) for a decorative backdrop. Holding
// the import until the browser is idle keeps it from competing with the hero
// image and first paint; the page reads identically on the solid black body
// background until it lands.
const Beams = lazy(() =>
  new Promise((resolve) => {
    const load = () => resolve(import('./components/Beams.jsx'))
    if (typeof requestIdleCallback === 'function') requestIdleCallback(load, { timeout: 2000 })
    else setTimeout(load, 200)
  })
)

const projectPanels = projects.map((p) => ({
  images: projectCovers[p.cover],
  alt: `${p.name} — project cover`,
  label: p.name,
  icons: resolveIcons(p.icons),
  blurb: p.blurb,
  repo: p.repo,
  link: p.href,
}))

function scrollToTarget(target) {
  if (!target) return
  const lenis = typeof window !== 'undefined' ? window.__appLenis : null
  if (lenis) {
    lenis.scrollTo(target, { offset: -90, duration: 1.2 })
  } else {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }
}

const NAV_LINKS = [
  ['#home', 'Profile'],
  ['#about', 'About'],
  ['#skills', 'Skills'],
  ['#projects', 'Projects'],
  ['#experience', 'Experience'],
  ['#hobbies', 'Hobbies'],
  ['#contact', 'Contact'],
]

const TYPING_TEXTS = [
  'Backend Architect',
  'AI Architecture Specialist',
  'Engineering Team Lead',
  'Full-Stack Developer',
  'Systems Engineer',
  'Tech Innovator',
]

function TypingSubtitle() {
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = TYPING_TEXTS[textIndex]
    let timeoutId

    if (!isDeleting && charIndex === currentText.length) {
      timeoutId = setTimeout(() => setIsDeleting(true), 1500)
    } else if (isDeleting && charIndex === 0) {
      timeoutId = setTimeout(() => {
        setIsDeleting(false)
        setTextIndex((idx) => (idx + 1) % TYPING_TEXTS.length)
      }, 300)
    } else {
      const delay = isDeleting ? 50 : 100
      timeoutId = setTimeout(() => {
        setCharIndex((i) => i + (isDeleting ? -1 : 1))
      }, delay)
    }

    return () => clearTimeout(timeoutId)
  }, [charIndex, isDeleting, textIndex])

  return <span className="typing-text">{TYPING_TEXTS[textIndex].substring(0, charIndex)}</span>
}

function App() {
  const heroContentRef = useRef(null)
  const navRef = useRef(null)
  const indicatorRef = useRef(null)
  const navContainerRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Scroll drives three purely visual properties. Writing them straight from
  // the scroll event interleaves style writes with the browser's own layout
  // work; batching into one rAF keeps it to a single write per frame.
  useEffect(() => {
    let frame = 0
    const paint = () => {
      frame = 0
      const scrolled = window.scrollY
      const nav = navRef.current
      if (nav) nav.classList.toggle('scrolled', scrolled > 100)

      const hero = heroContentRef.current
      if (hero) hero.style.opacity = String(Math.max(0, 1 - scrolled / 400))

      const indicator = indicatorRef.current
      if (indicator) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        indicator.style.width = `${maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0}%`
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    paint()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { root: null, threshold: 0.05, rootMargin: '0px' })
    document.querySelectorAll('.fade-in-section').forEach(section => sectionObserver.observe(section))

    return () => { sectionObserver.disconnect() }
  }, [])

  // Escape closes the drawer, matching what a dialog-like overlay is expected
  // to do once it has covered the page.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const onNavClick = (e) => {
    const href = e.currentTarget.getAttribute('href')
    if (!href?.startsWith('#')) return
    e.preventDefault()
    setMenuOpen(false)
    scrollToTarget(document.querySelector(href))
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
        <Suspense fallback={null}>
          <Beams
            beamWidth={2}
            beamHeight={20}
            beamNumber={20}
            speed={1.5}
            noiseIntensity={1.5}
            scale={0.2}
            rotation={30}
          />
        </Suspense>
      </div>
      <div className="scroll-indicator" ref={indicatorRef}></div>

      <TargetCursor spinDuration={2} hideDefaultCursor={false} parallaxOn={true} scopeSelector="nav" />

      <nav ref={(el) => { navRef.current = el; navContainerRef.current = el }}>
        <div className="nav-content">
          <div className="logo">
            <VariableProximity
              label={'qwantum'}
              fromFontVariationSettings="'wght' 150"
              toFontVariationSettings="'wght' 800"
              containerRef={navContainerRef}
              radius={110}
              falloff='linear'
            />
          </div>
          <div className="nav-links">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} className="nav-link cursor-target" onClick={onNavClick}>
                <span className="nav-link-roll" data-text={label}>{label}</span>
              </a>
            ))}
            <DownloadCvButton />
          </div>
          <button
            className="hamburger-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-controls="mobileNavLinks"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'times' : 'bars'} />
          </button>
        </div>
        {/* inert keeps the off-canvas drawer out of the tab order and out of the
            accessibility tree while it is translated off-screen. */}
        <div
          className={`mobile-nav-links${menuOpen ? ' active' : ''}`}
          id="mobileNavLinks"
          inert={!menuOpen}
        >
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} className="nav-link" onClick={onNavClick}>{label}</a>
          ))}
          <DownloadCvButton
            className="download-cv-btn--mobile"
            onDownloaded={() => setMenuOpen(false)}
          />
        </div>
      </nav>

      <section id="home" className="hero">
        <div className="hero-content" ref={heroContentRef}>
          {/* The name is shown as art inside the profile card, so the document
              still needs a real <h1> for search engines and screen readers.
              Visually hidden rather than restyled, to leave the design alone. */}
          <h1 className="sr-only">Sharifzoda Bilol — Backend Architect</h1>

          <div style={{ maxWidth: 420, margin: '20px auto 30px' }}>
            <ProfileCard
              name="Sharifzoda Bilol"
              title=""
              handle="qwantum"
              status="Online"
              contactText="Contact Me"
              avatarUrl={mainAvatar}
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={true}
              onContactClick={() => scrollToTarget(document.querySelector('#contact'))}
            />
          </div>
          <div className="hero-subtitle">
            <TypingSubtitle />
          </div>
          <p style={{ marginBottom: '30px', color: 'var(--text-secondary)', maxWidth: '660px', fontSize: '1.18rem', lineHeight: 1.75 }}>
            I create high-performance, scalable and secure software solutions. Using modern technologies, optimized algorithms and structures in terms of system design, paralelisms and architecting down to the smallest details. And making sure that my team does the same.
          </p>
        </div>
      </section>

      <section id="about" className="section fade-in-section">
        <div className="container">
          <SectionTitle text="About Me" />
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ fontSize: '1.35rem', lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: '30px' }}>
              <DecryptedText text="I'm a middle backend architect with deep expertise in wide areas of engineering all-range systems. Currently working on cutting-edge projects in fintech, high-load systems, AI creation and integration into systems. Controlling and monitoring the quality of the code and the team's work." intervalMs={8} step={1} />
            </p>
            <p style={{ fontSize: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
              <DecryptedText
                text="My passion lies in creating robust, high-quality, long-term, efficient solutions. I'm particularly interested in low-level programming, ML, blockchain, architecturing enourmous systems from scratch. Also have passion in maths, non-euclidean geometry, astrophysics and philosophy."
                intervalMs={8}
                step={1}
              />
            </p>
          </div>
        </div>
      </section>

      <section id="skills" className="section fade-in-section" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <SectionTitle text="My skills" />
          <div className="folders-grid">
            <Folder
              size={1.35}
              color="#2d2d2d"
              label="Rust"
              icon="rust"
              items={[
                <div className="skill-item" key="a1"><span>Axum, Actix</span><span>Expert</span></div>,
                <div className="skill-item" key="a2"><span>Tauri, Ratatui</span><span>Expert</span></div>,
                <div className="skill-item" key="a3"><span>Tokio</span><span>Expert</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#2d2d2d"
              label="Web"
              icon="js-square"
              items={[
                <div className="skill-item" key="w1"><span>React & React Native</span><span>Expert</span></div>,
                <div className="skill-item" key="w2"><span>Typescript</span><span>Advanced</span></div>,
                <div className="skill-item" key="w3"><span>NextJS</span><span>Advanced</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#2d2d2d"
              label="Linux"
              icon="linux"
              items={[
                <div className="skill-item" key="l1"><span>Arch, Gentoo, Kali</span><span>Expert</span></div>,
                <div className="skill-item" key="l2"><span>Kernel, Systemd, Syscalls</span><span>Expert</span></div>,
                <div className="skill-item" key="l3"><span>Unix Philosophy</span><span>Expert</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#2d2d2d"
              label="Python"
              icon="python"
              items={[
                <div className="skill-item" key="p1"><span>NumPy/Pandas</span><span>Advanced</span></div>,
                <div className="skill-item" key="p2"><span>Django & FastAPI</span><span>Advanced</span></div>,
                <div className="skill-item" key="p3"><span>TensorFlow</span><span>Advanced</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#2d2d2d"
              label="Security & Crypto"
              icon="shield-alt"
              items={[
                <div className="skill-item" key="c1"><span>Cybersecurity, AppSec</span><span>Intermediate</span></div>,
                <div className="skill-item" key="c2"><span>Cryptography</span><span>Intermediate</span></div>,
                <div className="skill-item" key="c3"><span>Network Security</span><span>Intermediate</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#2d2d2d"
              label="Low-level"
              icon="microchip"
              items={[
                <div className="skill-item" key="s1"><span>C (OpenGL, Vulkan)</span><span>Advanced</span></div>,
                <div className="skill-item" key="s2"><span>Zig</span><span>Intermediate</span></div>,
                <div className="skill-item" key="s3"><span>Assembly</span><span>Basic</span></div>,
              ]}
            />
          </div>

          <div className="current-stack-wrapper" style={{ marginTop: '40px', textAlign: 'center' }}>
            <SectionTitle text="Current Stack" style={{ marginBottom: '40px' }} />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: '60px' }}>
              <BounceCards
                className="custom-bounceCards bounceCardsContainer--fluid"
                items={techIcons}
                containerWidth={'min(760px, 95vw)'}
                containerHeight={'clamp(240px, 70vw, 400px)'}
                enableHover={true}
                pushOffset={100}
                transformStyles={[
                  "rotate(6deg) translate(-245px)",
                  "rotate(-4deg) translate(-175px)",
                  "rotate(3deg) translate(-105px)",
                  "rotate(-2deg) translate(-35px)",
                  "rotate(2deg) translate(35px)",
                  "rotate(-3deg) translate(105px)",
                  "rotate(4deg) translate(175px)",
                  "rotate(-6deg) translate(245px)"
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="section fade-in-section">
        <div className="container">
          <SectionTitle text="Selected Projects" />
          <AccordionGallery items={projectPanels} defaultIndex={0} trigger="hover" height={600} mobileHeight={1120} />
        </div>
      </section>

      <section id="in-progress" className="section fade-in-section">
        <div className="container">
          <SectionTitle text="Projects in Progress" />
          <WipTerminal />
        </div>
      </section>

      <section id="experience" className="section fade-in-section">
        <div className="container">
          <SectionTitle text="Professional Journey" />
          <ExperienceJourney />
        </div>
      </section>

      <section id="hobbies" className="section">
        <div className="container">
          <SectionTitle text="Beyond the Code" />
          <ScrollStack className="hobbies-stack" useWindowScroll={true}>
            <ScrollStackItem>
              <div className="hobby-bg hobby-bg--cosmos" aria-hidden="true">
                <svg className="galaxy" viewBox="0 0 300 300">
                  <defs>
                    <radialGradient id="galaxyCore">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                      <stop offset="45%" stopColor="rgba(255,255,255,0.28)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                  </defs>
                  <circle cx="150" cy="150" r="36" fill="url(#galaxyCore)" />
                  {}
                  <path className="galaxy-arm-glow" d="M 157.4 154.7 L 156.9 155.9 L 156.1 157.1 L 155.1 158.2 L 153.9 159.2 L 152.5 160.1 L 150.8 160.8 L 149.0 161.3 L 147.1 161.5 L 145.0 161.5 L 142.9 161.2 L 140.7 160.5 L 138.6 159.6 L 136.6 158.3 L 134.8 156.6 L 133.1 154.7 L 131.7 152.4 L 130.7 149.9 L 130.1 147.1 L 129.9 144.1 L 130.2 141.0 L 131.0 137.9 L 132.5 134.7 L 134.5 131.7 L 137.0 128.8 L 140.2 126.2 L 143.9 124.0 L 148.1 122.2 L 152.8 121.0 L 157.8 120.4 L 163.1 120.5 L 168.6 121.4 L 174.1 123.1 L 179.5 125.6 L 184.6 129.0 L 189.4 133.2 L 193.6 138.3 L 197.0 144.2 L 199.6 150.8 L 201.2 157.9 L 201.6 165.6 L 200.7 173.5 L 198.5 181.6 L 194.8 189.7 L 189.6 197.5 L 182.9 204.8 L 174.7 211.4 L 165.1 217.1 L 154.2 221.5 L 142.2 224.6 L 129.3 226.0" />
                  <path className="galaxy-arm-line" d="M 157.4 154.7 L 156.9 155.9 L 156.1 157.1 L 155.1 158.2 L 153.9 159.2 L 152.5 160.1 L 150.8 160.8 L 149.0 161.3 L 147.1 161.5 L 145.0 161.5 L 142.9 161.2 L 140.7 160.5 L 138.6 159.6 L 136.6 158.3 L 134.8 156.6 L 133.1 154.7 L 131.7 152.4 L 130.7 149.9 L 130.1 147.1 L 129.9 144.1 L 130.2 141.0 L 131.0 137.9 L 132.5 134.7 L 134.5 131.7 L 137.0 128.8 L 140.2 126.2 L 143.9 124.0 L 148.1 122.2 L 152.8 121.0 L 157.8 120.4 L 163.1 120.5 L 168.6 121.4 L 174.1 123.1 L 179.5 125.6 L 184.6 129.0 L 189.4 133.2 L 193.6 138.3 L 197.0 144.2 L 199.6 150.8 L 201.2 157.9 L 201.6 165.6 L 200.7 173.5 L 198.5 181.6 L 194.8 189.7 L 189.6 197.5 L 182.9 204.8 L 174.7 211.4 L 165.1 217.1 L 154.2 221.5 L 142.2 224.6 L 129.3 226.0" />
                  <path className="galaxy-arm-glow" d="M 142.6 145.3 L 143.1 144.1 L 143.9 142.9 L 144.9 141.8 L 146.1 140.8 L 147.5 139.9 L 149.2 139.2 L 151.0 138.7 L 152.9 138.5 L 155.0 138.5 L 157.1 138.8 L 159.3 139.5 L 161.4 140.4 L 163.4 141.7 L 165.2 143.4 L 166.9 145.3 L 168.3 147.6 L 169.3 150.1 L 169.9 152.9 L 170.1 155.9 L 169.8 159.0 L 169.0 162.1 L 167.5 165.3 L 165.5 168.3 L 163.0 171.2 L 159.8 173.8 L 156.1 176.0 L 151.9 177.8 L 147.2 179.0 L 142.2 179.6 L 136.9 179.5 L 131.4 178.6 L 125.9 176.9 L 120.5 174.4 L 115.4 171.0 L 110.6 166.8 L 106.4 161.7 L 103.0 155.8 L 100.4 149.2 L 98.8 142.1 L 98.4 134.4 L 99.3 126.5 L 101.5 118.4 L 105.2 110.3 L 110.4 102.5 L 117.1 95.2 L 125.3 88.6 L 134.9 82.9 L 145.8 78.5 L 157.8 75.4 L 170.7 74.0" />
                  <path className="galaxy-arm-line" d="M 142.6 145.3 L 143.1 144.1 L 143.9 142.9 L 144.9 141.8 L 146.1 140.8 L 147.5 139.9 L 149.2 139.2 L 151.0 138.7 L 152.9 138.5 L 155.0 138.5 L 157.1 138.8 L 159.3 139.5 L 161.4 140.4 L 163.4 141.7 L 165.2 143.4 L 166.9 145.3 L 168.3 147.6 L 169.3 150.1 L 169.9 152.9 L 170.1 155.9 L 169.8 159.0 L 169.0 162.1 L 167.5 165.3 L 165.5 168.3 L 163.0 171.2 L 159.8 173.8 L 156.1 176.0 L 151.9 177.8 L 147.2 179.0 L 142.2 179.6 L 136.9 179.5 L 131.4 178.6 L 125.9 176.9 L 120.5 174.4 L 115.4 171.0 L 110.6 166.8 L 106.4 161.7 L 103.0 155.8 L 100.4 149.2 L 98.8 142.1 L 98.4 134.4 L 99.3 126.5 L 101.5 118.4 L 105.2 110.3 L 110.4 102.5 L 117.1 95.2 L 125.3 88.6 L 134.9 82.9 L 145.8 78.5 L 157.8 75.4 L 170.7 74.0" />
                  {}
                  <g className="galaxy-stars">
                    <circle cx="125.8" cy="143.0" r="1.8" />
                    <circle cx="138.2" cy="127.1" r="1.9" className="tw" />
                    <circle cx="168.4" cy="117.0" r="1.1" />
                    <circle cx="198.7" cy="133.2" r="1.4" className="tw" />
                    <circle cx="203.8" cy="163.6" r="1.4" />
                    <circle cx="182.6" cy="190.5" r="1.0" className="tw" />
                    <circle cx="157.1" cy="220.3" r="1.1" />
                    <circle cx="154.1" cy="138.9" r="1.8" />
                    <circle cx="165.1" cy="137.0" r="1.9" className="tw" />
                    <circle cx="165.7" cy="175.4" r="1.4" />
                    <circle cx="127.4" cy="178.2" r="1.3" className="tw" />
                    <circle cx="111.8" cy="168.8" r="1.3" />
                    <circle cx="101.0" cy="127.4" r="1.6" className="tw" />
                    <circle cx="112.8" cy="110.4" r="1.7" />
                    <circle cx="142.4" cy="76.7" r="1.5" className="tw" />
                  </g>
                </svg>
                <div className="gr-formula">
                  R<sub>μν</sub> − ½Rg<sub>μν</sub> + Λg<sub>μν</sub> = <span className="gr-frac">8πG⁄c⁴</span>T<sub>μν</sub>
                </div>
              </div>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Cosmos &amp; Numbers</h3>
                <p className="hobby-card-desc">The analytical side — decoding the universe and the mathematics beneath it, from relativity to non-Euclidean geometry.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="meteor" /> Astrophysics</span>
                  <span className="hobby-chip"><Icon name="infinity" /> Mathematics</span>
                </div>
              </div>
            </ScrollStackItem>
            <ScrollStackItem>
              <div className="hobby-bg hobby-bg--strategy" aria-hidden="true">
                <svg className="fps-crosshair" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="26" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="40" cy="40" r="2.5" fill="currentColor" />
                  <line x1="40" y1="2" x2="40" y2="22" stroke="currentColor" strokeWidth="2" />
                  <line x1="40" y1="58" x2="40" y2="78" stroke="currentColor" strokeWidth="2" />
                  <line x1="2" y1="40" x2="22" y2="40" stroke="currentColor" strokeWidth="2" />
                  <line x1="58" y1="40" x2="78" y2="40" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div className="knight-scene">
                  <Icon name="chess-knight" className="knight-piece" />
                  <span className="knight-board"></span>
                </div>
              </div>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Strategy &amp; Play</h3>
                <p className="hobby-card-desc">Competition and calculation — long-term planning on the board and split-second tactics on the server.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="chess-knight" /> Chess</span>
                  <span className="hobby-chip"><Icon name="crosshairs" /> Counter Strike 2</span>
                </div>
              </div>
            </ScrollStackItem>
            <ScrollStackItem>
              <div className="hobby-bg hobby-bg--craft" aria-hidden="true">
                <div className="scarf">
                  <span className="scarf-strip"></span>
                  <span className="scarf-needle"></span>
                  <span className="scarf-needle scarf-needle--2"></span>
                </div>
                <span className="float-note float-note--1">♪</span>
                <span className="float-note float-note--2">♫</span>
                <span className="float-note float-note--3">♩</span>
                <span className="float-note float-note--4">♬</span>
                <span className="float-note float-note--5">♪</span>
              </div>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Craft &amp; Sound</h3>
                <p className="hobby-card-desc">Hands-on creativity — building something tangible row by row and unwinding through strings and melody.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="guitar" /> Guitar</span>
                  <span className="hobby-chip"><Icon name="mitten" /> Knitting</span>
                </div>
              </div>
            </ScrollStackItem>
            <ScrollStackItem>
              <div className="hobby-bg hobby-bg--words" aria-hidden="true">
                <div className="book">
                  <span className="book-page book-page--left"></span>
                  <span className="book-page book-page--right"></span>
                  <span className="book-flip book-flip--1"></span>
                  <span className="book-flip book-flip--2"></span>
                  <span className="book-flip book-flip--3"></span>
                  <span className="book-spine"></span>
                </div>
              </div>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Words &amp; Thought</h3>
                <p className="hobby-card-desc">Reflection and expression — questioning first principles and compressing ideas into rhythm and imagery.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="feather-pointed" /> Poems</span>
                  <span className="hobby-chip"><Icon name="yin-yang" /> Philosophy</span>
                </div>
              </div>
            </ScrollStackItem>
          </ScrollStack>
        </div>
      </section>

      <section id="contact" className="section fade-in-section">
        <div className="container">
          <h2 className="section-title">Let's Connect</h2>
          <ContactDevice onNavigate={(hash) => scrollToTarget(document.querySelector(hash))} />
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Sharifzoda Bilol. Crafted with cutting-edge web technologies.</p>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
            Cisco CCNA • Cisco Certified Instructor • Microsoft AZ-900 / AI-900 • NASA Space Apps
          </p>
          <div className="footer-tags">
            <a
              className="secret-job"
              href="https://bonnnieeee.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="I also work as solar knight for my Bonnie"
            >
              <Icon name="heart" /> Secret job
              <span className="secret-job-tooltip">I also work as solar knight for my Bonnie</span>
            </a>
          </div>
          <VisitorCounter />
        </div>
      </footer>
    </>
  )
}

export default App

