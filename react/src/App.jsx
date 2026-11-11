import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import BlurHighlight from './components/BlurHighlight.jsx'
import Icon from './components/Icon.jsx'
import Hero from './components/hero/Hero.jsx'
import FolderFloat from './components/FolderFloat.jsx'
import Connect from './components/Connect.jsx'
import TargetCursor from './components/TargetCursor.jsx'
import BounceCards from './components/BounceCards.jsx'
import { techIcons } from './data/techIcons.js'
import { projects } from './data/cv.js'
import { SKILL_FOLDERS } from './data/skillFolders.js'
import { projectCovers } from './data/projectCovers.js'
import { resolveIcons } from './data/projectIcons.js'
import ProjectShowcase from './components/ProjectShowcase.jsx'
import ExperienceJourney from './components/ExperienceJourney.jsx'
import SectionTitle from './components/SectionTitle.jsx'
import NavLogo from './components/NavLogo.jsx'
import './components/HobbyBackgrounds.css'
import { CosmosArt, CraftArt, StrategyArt, WordsArt } from './components/HobbyArt.jsx'
import DownloadCvButton from './components/DownloadCvButton.jsx'
import ScrollStack, { ScrollStackItem } from './components/ScrollStack.jsx'
import WipTerminal from './components/WipTerminal.jsx'
import VisitorCounter from './components/VisitorCounter.jsx'
import { useHydrated } from './utils/useHydrated.js'
import { usePauseOffscreen } from './utils/usePauseOffscreen.js'
import './index.css'

// The ASCII backdrop is decorative, so it waits until the browser is idle: its
// shaders then compile without competing with the hero image and first paint,
// and the page reads identically on the solid black body background until it
// lands. It is never part of the pre-rendered HTML: it mounts only once React
// has taken the page over.
const GradientASCII = lazy(() =>
  new Promise((resolve) => {
    const load = () => resolve(import('./components/GradientASCII.jsx'))
    if (typeof requestIdleCallback === 'function') requestIdleCallback(load, { timeout: 2000 })
    else setTimeout(load, 200)
  })
)

const showcaseProjects = projects.map((p) => ({
  name: p.name,
  repo: p.repo,
  href: p.href,
  site: p.site,
  stack: p.stack,
  blurb: p.blurb,
  images: projectCovers[p.cover].map((img) => (typeof img === 'string' ? { src: img } : img)),
  icons: resolveIcons(p.icons),
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

// The parts that only make sense live: rendered once React has taken the page
// over, so they never reach the pre-rendered HTML. A component of their own,
// so that moment re-renders them and not the whole page.
function ClientOnly({ children }) {
  return useHydrated() ? children : null
}

// The header and the phone drawer. The drawer's state lives here, so opening
// it re-renders the header alone.
function SiteNav({ navRef }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
    <nav ref={navRef}>
      <div className="nav-content">
        <NavLogo onClick={onNavClick} />
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
  )
}

function App() {
  const heroContentRef = useRef(null)
  const navRef = useRef(null)
  const indicatorRef = useRef(null)
  usePauseOffscreen('section, footer')

  // Scroll drives three purely visual properties. Writing them straight from
  // the scroll event interleaves style writes with the browser's own layout
  // work; batching into one rAF keeps it to a single write per frame.
  //
  // The hero fades over 400px of scroll from the moment its bottom is on
  // screen. Where it fits the window (desktop) that is from the top; on a
  // phone, where it runs well below the fold, not before it has been read.
  useEffect(() => {
    let frame = 0
    let heroBottom = 0
    let pageHeight = 0
    const hero = heroContentRef.current
    // Sizes are read when they change, not on every scroll frame, so a frame
    // only writes.
    const measure = () => {
      if (hero) heroBottom = hero.getBoundingClientRect().bottom + window.scrollY
      pageHeight = document.documentElement.scrollHeight
    }
    const paint = () => {
      frame = 0
      const scrolled = window.scrollY
      const nav = navRef.current
      if (nav) nav.classList.toggle('scrolled', scrolled > 100)

      if (hero) {
        const from = Math.max(0, heroBottom - window.innerHeight)
        hero.style.opacity = String(Math.max(0, Math.min(1, 1 - (scrolled - from) / 400)))
      }

      const indicator = indicatorRef.current
      if (indicator) {
        const maxScroll = pageHeight - window.innerHeight
        indicator.style.width = `${maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0}%`
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const onResize = () => {
      measure()
      onScroll()
    }
    const sizes = new ResizeObserver(onResize)
    if (hero) sizes.observe(hero)
    sizes.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    measure()
    paint()
    return () => {
      sizes.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
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

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
        <ClientOnly>
          <Suspense fallback={null}>
            <GradientASCII />
          </Suspense>
        </ClientOnly>
      </div>
      <div className="scroll-indicator" ref={indicatorRef}></div>

      {/* Follows the pointer, so it has nothing to show in the pre-rendered
          HTML — and on touch devices it renders nothing at all. */}
      <ClientOnly>
        <TargetCursor spinDuration={2} hideDefaultCursor={false} parallaxOn={true} scopeSelector="nav, #home" />
      </ClientOnly>

      <SiteNav navRef={navRef} />

      <Hero contentRef={heroContentRef} onContact={() => scrollToTarget(document.querySelector('#contact'))} />

      <section id="about" className="section fade-in-section">
        <div className="container">
          <SectionTitle text="About Me" />
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ fontSize: '1.35rem', lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: '30px' }}>
              <BlurHighlight text="I'm a middle [[backend architect]] with deep expertise in wide areas of engineering all-range systems. Currently working on cutting-edge projects in [[fintech, high-load systems]], [[AI]] creation and integration into systems. Controlling and monitoring the [[quality of the code]] and the team's work." />
            </p>
            <p style={{ fontSize: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
              <BlurHighlight text="My passion lies in creating [[robust, high-quality, long-term]], efficient solutions. I'm particularly interested in [[low-level programming]], ML, blockchain, architecturing [[enormous systems from scratch]]. Also have passion in maths, non-euclidean geometry, astrophysics and philosophy." />
            </p>
          </div>
        </div>
      </section>

      <section id="skills" className="section fade-in-section" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <SectionTitle text="My skills" />
          <div className="folders-grid">
            {SKILL_FOLDERS.map((folder) => (
              <FolderFloat key={folder.label} {...folder} />
            ))}
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
          <ProjectShowcase projects={showcaseProjects} />
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
            <ScrollStackItem itemClassName="hobby-card">
              <span className="hobby-word" aria-hidden="true">Cosmos</span>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Cosmos &amp; Numbers</h3>
                <p className="hobby-card-desc">The analytical side — decoding the universe and the mathematics beneath it, from relativity to non-Euclidean geometry.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="meteor" /> Astrophysics</span>
                  <span className="hobby-chip"><Icon name="infinity" /> Mathematics</span>
                </div>
              </div>
              <figure className="hobby-plate" aria-hidden="true">
                <CosmosArt />
              </figure>
            </ScrollStackItem>
            <ScrollStackItem itemClassName="hobby-card">
              <span className="hobby-word" aria-hidden="true">Strategy</span>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Strategy &amp; Play</h3>
                <p className="hobby-card-desc">Competition and calculation — long-term planning on the board and split-second tactics on the server.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="chess-knight" /> Chess</span>
                  <span className="hobby-chip"><Icon name="crosshairs" /> Counter Strike 2</span>
                </div>
              </div>
              <figure className="hobby-plate" aria-hidden="true">
                <StrategyArt />
              </figure>
            </ScrollStackItem>
            <ScrollStackItem itemClassName="hobby-card">
              <span className="hobby-word" aria-hidden="true">Craft</span>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Craft &amp; Sound</h3>
                <p className="hobby-card-desc">Hands-on creativity — building something tangible row by row and unwinding through strings and melody.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="guitar" /> Guitar</span>
                  <span className="hobby-chip"><Icon name="mitten" /> Knitting</span>
                </div>
              </div>
              <figure className="hobby-plate" aria-hidden="true">
                <CraftArt />
              </figure>
            </ScrollStackItem>
            <ScrollStackItem itemClassName="hobby-card">
              <span className="hobby-word" aria-hidden="true">Words</span>
              <div className="hobby-content">
                <h3 className="hobby-card-title">Words &amp; Thought</h3>
                <p className="hobby-card-desc">Reflection and expression — questioning first principles and compressing ideas into rhythm and imagery.</p>
                <div className="hobby-chips">
                  <span className="hobby-chip"><Icon name="feather-pointed" /> Poems</span>
                  <span className="hobby-chip"><Icon name="yin-yang" /> Philosophy</span>
                </div>
              </div>
              <figure className="hobby-plate" aria-hidden="true">
                <WordsArt />
              </figure>
            </ScrollStackItem>
          </ScrollStack>
        </div>
      </section>

      <section id="contact" className="section fade-in-section">
        <div className="container">
          <h2 className="section-title">Let's Connect</h2>
          <Connect />
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

