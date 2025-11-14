import { useEffect, useRef, useState } from 'react'
import DecryptedText from './components/DecryptedText.jsx'
import ProfileCard from './components/ProfileCard.jsx'
import Folder from './components/Folder.jsx'
import signalLogo from './assets/signal_logo.svg'
import mainAvatar from './assets/main_img.png'
import './index.css'

function App() {
  const typingTexts = [
    'Software Engineer',
    'AI Specialist',
    'Full-Stack Developer',
    'Systems Programmer',
    'Tech Innovator'
  ]
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const heroContentRef = useRef(null)
  const hamburgerRef = useRef(null)
  const mobileNavRef = useRef(null)

  // Typing effect (single-timer logic)
  useEffect(() => {
    const currentText = typingTexts[textIndex]
    let timeoutId

    if (!isDeleting && charIndex === currentText.length) {
      // Pause at end, then start deleting
      timeoutId = setTimeout(() => setIsDeleting(true), 1500)
    } else if (isDeleting && charIndex === 0) {
      // Short pause at start, then move to next word
      timeoutId = setTimeout(() => {
        setIsDeleting(false)
        setTextIndex((idx) => (idx + 1) % typingTexts.length)
      }, 300)
    } else {
      const delay = isDeleting ? 50 : 100
      timeoutId = setTimeout(() => {
        setCharIndex((i) => i + (isDeleting ? -1 : 1))
      }, delay)
    }

    return () => clearTimeout(timeoutId)
  }, [charIndex, isDeleting, textIndex])

  // Create circuit board and particles
  useEffect(() => {
    const circuitBoard = document.getElementById('circuitBoard')
    const particlesContainer = document.getElementById('particles')
    if (!circuitBoard || !particlesContainer) return

    for (let i = 0; i < 15; i++) {
      const line = document.createElement('div')
      line.className = 'circuit-line horizontal'
      line.style.top = Math.random() * 100 + '%'
      line.style.left = Math.random() * 80 + '%'
      line.style.animationDelay = Math.random() * 3 + 's'
      line.style.animationDuration = (Math.random() * 2 + 3) + 's'
      circuitBoard.appendChild(line)
    }
    for (let i = 0; i < 15; i++) {
      const line = document.createElement('div')
      line.className = 'circuit-line vertical'
      line.style.left = Math.random() * 100 + '%'
      line.style.top = Math.random() * 80 + '%'
      line.style.animationDelay = Math.random() * 3 + 's'
      line.style.animationDuration = (Math.random() * 2 + 3) + 's'
      circuitBoard.appendChild(line)
    }
    for (let i = 0; i < 25; i++) {
      const node = document.createElement('div')
      node.className = 'circuit-node'
      node.style.left = Math.random() * 100 + '%'
      node.style.top = Math.random() * 100 + '%'
      node.style.animationDelay = Math.random() * 2 + 's'
      node.style.animationDuration = (Math.random() * 3 + 2) + 's'
      circuitBoard.appendChild(node)
    }
    for (let i = 0; i < 75; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.top = Math.random() * 100 + '%'
      particle.style.animationDelay = Math.random() * 12 + 's'
      particle.style.animationDuration = (Math.random() * 15 + 8) + 's'
      particlesContainer.appendChild(particle)
    }

    return () => {
      circuitBoard.innerHTML = ''
      particlesContainer.innerHTML = ''
    }
  }, [])

  // Scroll effects and indicator
  useEffect(() => {
    const nav = document.querySelector('nav')
    function updateScrollIndicator() {
      const scrolled = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0
      const indicator = document.getElementById('scrollIndicator')
      if (indicator) indicator.style.width = pct + '%'
    }
    function onScroll() {
      const scrolled = window.scrollY
      if (nav) {
        if (scrolled > 100) nav.classList.add('scrolled')
        else nav.classList.remove('scrolled')
      }
      const hero = heroContentRef.current
      const fadeOutDistance = 400
      if (hero) {
        const opacity = 1 - (scrolled / fadeOutDistance)
        hero.style.opacity = String(Math.max(0, opacity))
      }
      updateScrollIndicator()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Intersection observers
  useEffect(() => {
    const expObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.style.animationPlayState = 'running'
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' })
    document.querySelectorAll('.experience-item').forEach(item => expObserver.observe(item))

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { root: null, threshold: 0.15, rootMargin: '0px' })
    document.querySelectorAll('.fade-in-section').forEach(section => sectionObserver.observe(section))

    return () => { expObserver.disconnect(); sectionObserver.disconnect() }
  }, [])

  // Smooth anchor scroll
  useEffect(() => {
    const links = document.querySelectorAll('.nav-link, .cta-button')
    const onClick = (e) => {
      const anchor = e.currentTarget
      const href = anchor.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) target.scrollIntoView({ behavior: 'smooth' })
      }
    }
    links.forEach(link => link.addEventListener('click', onClick))
    return () => links.forEach(link => link.removeEventListener('click', onClick))
  }, [])

  function toggleMobileNav() {
    const mobileNav = mobileNavRef.current
    const btn = hamburgerRef.current
    if (!mobileNav || !btn) return
    mobileNav.classList.toggle('active')
    const icon = btn.querySelector('i')
    const expanded = mobileNav.classList.contains('active')
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    icon.classList.toggle('fa-bars', !expanded)
    icon.classList.toggle('fa-times', expanded)
  }

  function closeMobileNav() {
    const mobileNav = mobileNavRef.current
    const btn = hamburgerRef.current
    if (!mobileNav || !btn) return
    mobileNav.classList.remove('active')
    const icon = btn.querySelector('i')
    btn.setAttribute('aria-expanded', 'false')
    icon.classList.add('fa-bars')
    icon.classList.remove('fa-times')
  }
  return (
    <>
      <div className="bg-animation"></div>
      <div className="circuit-board" id="circuitBoard"></div>
      <div className="floating-particles" id="particles"></div>
      <div className="scroll-indicator" id="scrollIndicator"></div>

      <nav>
        <div className="nav-content">
          <div className="logo">qwantum</div>
          <div className="nav-links">
            <a href="#home" className="nav-link">Home</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#skills" className="nav-link">Skills</a>
            <a href="#experience" className="nav-link">Experience</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
          <button className="hamburger-menu" id="hamburgerMenu" aria-label="Toggle menu" aria-controls="mobileNavLinks" aria-expanded="false" ref={hamburgerRef} onClick={toggleMobileNav}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
        <div className="mobile-nav-links" id="mobileNavLinks" ref={mobileNavRef}>
          <a href="#home" className="nav-link" onClick={closeMobileNav}>Home</a>
          <a href="#about" className="nav-link" onClick={closeMobileNav}>About</a>
          <a href="#skills" className="nav-link" onClick={closeMobileNav}>Skills</a>
          <a href="#experience" className="nav-link" onClick={closeMobileNav}>Experience</a>
          <a href="#contact" className="nav-link" onClick={closeMobileNav}>Contact</a>
        </div>
      </nav>

      <section id="home" className="hero">
        <div className="hero-content" ref={heroContentRef}>
          
          <div style={{ maxWidth: 420, margin: '20px auto 30px' }}>
            <ProfileCard
              name="Sharifzoda Bilol"
              title="Software Engineer"
              handle="qwantum"
              status="Online"
              contactText="Contact Me"
              avatarUrl={mainAvatar}
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={true}
              onContactClick={() => {
                const el = document.querySelector('#contact')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          </div>
          <div className="hero-subtitle">
            <span className="typing-text">{typingTexts[textIndex].substring(0, charIndex)}</span>
          </div>
          <p style={{ marginBottom: '30px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
            Passionate about creating cutting-edge solutions with AI, blockchain, and modern web technologies.
            Certified by NASA, CISCO, and TechnoHub.
          </p>
        </div>
      </section>

      <section id="about" className="section fade-in-section">
        <div className="container">
          <h2 className="section-title">
            <DecryptedText text="About Me" intervalMs={8} step={1} />
          </h2>
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '30px' }}>
              <DecryptedText text="I'm a middle-level software engineer with deep expertise in full-stack development, AI architectures, and system administration. Currently working on cutting-edge projects in fintech, AI, and mobile development." intervalMs={8} step={1} />
            </p>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              <DecryptedText
                text="My passion lies in creating scalable, efficient solutions using modern technologies and architectural patterns. I'm particularly interested in AI/ML, cryptography, and low-level programming."
                intervalMs={8}
                step={1}
              />
            </p>
          </div>
        </div>
      </section>

      <section id="skills" className="section fade-in-section" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <h2 className="section-title">Technical Arsenal</h2>
          <div className="folders-grid">
            <Folder
              size={1.35}
              color="#7c3aed"
              label="Python"
              iconClass="fab fa-python"
              items={[
                <div className="skill-item" key="p1"><span>NumPy & PyTorch</span><span>Advanced</span></div>,
                <div className="skill-item" key="p2"><span>Django & FastAPI</span><span>Advanced</span></div>,
                <div className="skill-item" key="p3"><span>AI/ML Development</span><span>Advanced</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#7c3aed"
              label="Web"
              iconClass="fab fa-js-square"
              items={[
                <div className="skill-item" key="w1"><span>React & React Native</span><span>Expert</span></div>,
                <div className="skill-item" key="w2"><span>TS/JS</span><span>Advanced</span></div>,
                <div className="skill-item" key="w3"><span>50+ JS Libraries</span><span>Proficient</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#7c3aed"
              label="C,Rust,ASM"
              iconClass="fas fa-microchip"
              items={[
                <div className="skill-item" key="s1"><span>C (OpenGL, Vulkan)</span><span>Advanced</span></div>,
                <div className="skill-item" key="s2"><span>Rust (Rocket, Burn)</span><span>Intermediate</span></div>,
                <div className="skill-item" key="s3"><span>Assembly Language</span><span>Basic</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#7c3aed"
              label="Linux"
              iconClass="fab fa-linux"
              items={[
                <div className="skill-item" key="l1"><span>Arch, Gentoo, Kali</span><span>Expert</span></div>,
                <div className="skill-item" key="l2"><span>Kernel Knowledge</span><span>Advanced</span></div>,
                <div className="skill-item" key="l3"><span>Microservices</span><span>Advanced</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#7c3aed"
              label="AI & Neural Networks"
              iconClass="fas fa-robot"
              items={[
                <div className="skill-item" key="a1"><span>Neural Architecture Design</span><span>Expert</span></div>,
                <div className="skill-item" key="a2"><span>LLMs & AI Engines</span><span>Advanced</span></div>,
                <div className="skill-item" key="a3"><span>Softmax, ReLU, etc.</span><span>Expert</span></div>,
              ]}
            />
            <Folder
              size={1.35}
              color="#7c3aed"
              label="Security & Crypto"
              iconClass="fas fa-shield-alt"
              items={[
                <div className="skill-item" key="c1"><span>Cybersecurity & AppSec</span><span>Intermediate</span></div>,
                <div className="skill-item" key="c2"><span>Cryptography</span><span>Advanced</span></div>,
                <div className="skill-item" key="c3"><span>SSH Tunneling</span><span>Advanced</span></div>,
              ]}
            />
          </div>
        </div>
      </section>

      <section id="experience" className="section fade-in-section">
        <div className="container">
          <h2 className="section-title">Professional Journey</h2>
          <div className="experience-timeline">
            <div className="experience-item">
              <div className="experience-content">
                <div className="experience-date">October 2025 - Present</div>
                <div className="experience-title">Full-Stack Software Engineer</div>
                <div className="experience-company">Koinoti Nav</div>
                <p>Creating performant, secure, optimized, and scalable software with Rust and NextJS. Planning enormous, high-load architectures for modern systems.</p>
                <ul className="experience-achievements">
                  <li><span className="achievement-label">HR automation:</span> Led end-to-end optimization of the hiring platform, automating pipelines with AI-driven screening and onboarding flows.</li>
                  <li><span className="achievement-label">Secure platforms:</span> Engineered a closed, security-first Linux distribution with a custom kernel tailored for enterprise partners.</li>
                  <li><span className="achievement-label">Team culture:</span> Thrived within a highly professional, collaborative engineering team focused on excellence and knowledge sharing.</li>
                </ul>
              </div>
            </div>
            <div className="experience-item">
              <div className="experience-content">
                <div className="experience-date">June 2025 - Present</div>
                <div className="experience-title">Software Engineer</div>
                <div className="experience-company">ZOOD Organization</div>
                <p>Created cross-platform mobile delivery app with 3-sided architecture. Optimized performance and implemented scalable solutions.</p>
                <ul className="experience-achievements">
                  <li><span className="achievement-label">High-load design:</span> Delivered a secure, high-performance architecture that improved delivery speeds by over 70% versus the prior system.</li>
                  <li><span className="achievement-label">Realtime stack:</span> Implemented GPS tracking and real-time update services with first-class native support on iOS and Android.</li>
                </ul>
              </div>
            </div>
            <div className="experience-item">
              <div className="experience-content">
                <div className="experience-date">January 2025 - Present</div>
                <div className="experience-title">Technical Instructor</div>
                <div className="experience-company">TechnoHub</div>
                <p>Teaching programming concepts, training corporate teams, and developing software projects for enterprise clients.</p>
                <ul className="experience-achievements">
                  <li><span className="achievement-label">Curriculum leadership:</span> Mentored cohorts across Python, JavaScript, C, Ruby, and Assembly for beginner through advanced levels.</li>
                  <li><span className="achievement-label">Enterprise enablement:</span> Trained 55 Group, TGEM, Avesto, Koinoti Nav, and others to embed AI tooling into daily operations.</li>
                  <li><span className="achievement-label">Community impact:</span> Delivered numerous presentations and events covering cybersecurity, AI, engineering, and IT essentials.</li>
                </ul>
              </div>
            </div>
            <div className="experience-item">
              <div className="experience-content">
                <div className="experience-date">February - March 2025</div>
                <div className="experience-title">AI Specialist</div>
                <div className="experience-company">TAG Marketeer Agency</div>
                <p>Implemented AI solutions and automated marketing workflows, optimizing business processes through intelligent automation.</p>
                <ul className="experience-achievements">
                  <li><span className="achievement-label">Data intelligence:</span> Built an AI product that analyzes big data and surfaces statistical, analytical, and predictive dashboards.</li>
                  <li><span className="achievement-label">Throughput gains:</span> Reduced workflows that previously took months down to a single day with targeted automation.</li>
                </ul>
              </div>
            </div>
            <div className="experience-item">
              <div className="experience-content">
                <div className="experience-date">Autumn - Winter 2024</div>
                <div className="experience-title">Founder</div>
                <div className="experience-company">Founders School Bootcamp</div>
                <p>Developed startup concept, networked with industry experts, and gained entrepreneurial experience in tech innovation.</p>
                <ul className="experience-achievements">
                  <li><span className="achievement-label">Resilience:</span> Although the product never launched, transformed the journey into deep lessons across social engineering, marketing, and business management.</li>
                  <li><span className="achievement-label">Leadership growth:</span> Strengthened leadership, negotiation, and networking skills while collaborating with influential mentors.</li>
                </ul>
              </div>
            </div>
            <div className="experience-item">
              <div className="experience-content">
                <div className="experience-date">Summer 2023</div>
                <div className="experience-title">Crypto Analyst</div>
                <div className="experience-company">International Transactions</div>
                <p>Processed and analyzed cryptocurrency transactions between various countries and Tajikistan, identifying financial patterns.</p>
                <ul className="experience-achievements">
                  <li><span className="achievement-label">Blockchain insight:</span> Developed a nuanced understanding of blockchain architecture and trading ecosystems.</li>
                  <li><span className="achievement-label">Pattern discovery:</span> Identified actionable trading patterns to guide cross-border transaction strategies.</li>
                </ul>
              </div>
            </div>
            <div className="experience-item">
              <div className="experience-content">
                <div className="experience-date">Summer 2020 - Present</div>
                <div className="experience-title">Financial Automation Developer</div>
                <div className="experience-company">Micro-Credit Organization</div>
                <p>Developed financial workflow automation systems, maintained existing infrastructure, and optimized operational processes.</p>
                <ul className="experience-achievements">
                  <li><span className="achievement-label">Scoring models:</span> Authored 15+ mathematical formulas powering a robust, secure microcredit evaluation engine.</li>
                  <li><span className="achievement-label">Regulatory reporting:</span> Delivered automated reporting and analytics that satisfy stringent audit requirements.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section fade-in-section">
        <div className="container">
          <h2 className="section-title">Let's Connect</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon"><i className="fas fa-phone"></i></div>
              <h3>Phone</h3>
              <p>+992985447072</p>
            </div>

            <a href="https://signal.me/#eu/Rrvk7a7IZAngzf-XhPOkYe8_X-oy1pc9BSutK9idldmInEXjy8BPEJDELEKtQQlN" target="_blank" rel="noopener noreferrer">
              <div className="contact-item">
                <div className="contact-icon signal-icon-wrap">
                  <img src={signalLogo} alt="Signal" className="signal-icon" />
                </div>
                <h3>Signal</h3>
                <p>qwantum.01</p>
              </div>
            </a>

            <a href="https://github.com/BillSharifzade" target="_blank" rel="noopener noreferrer">
              <div className="contact-item">
                <div className="contact-icon"><i className="fab fa-github"></i></div>
                <h3>GitHub</h3>
                <p>BillSharifzade</p>
              </div>
        </a>
      </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Sharifzoda Bilol. Crafted with cutting-edge web technologies.</p>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
            NASA Certified • CISCO Instructor • TechnoHub Certified
        </p>
      </div>
      </footer>
    </>
  )
}

export default App

