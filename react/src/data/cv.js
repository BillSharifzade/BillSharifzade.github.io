// Single source of truth for CV content — consumed by the PDF document,
// the multi-format exporters, and the Professional Journey section.

export const profile = {
  name: 'Sharifzoda Bilol',
  role: 'Backend Architect · AI Architecture Specialist · Full-Stack Developer',
  summary:
    'Backend architect with deep expertise across full-range systems engineering — fintech, high-load systems, ' +
    'and AI creation and integration. I build robust, high-quality, long-term, and efficient solutions, with a ' +
    'focus on low-level programming, ML, blockchain, and architecting enormous systems from scratch.',
  contacts: [
    { label: 'CV in website format', value: 'https://billsharifzade.github.io/', href: 'https://billsharifzade.github.io/' },
    { label: 'Phone', value: '+992 985 447 072' },
    { label: 'Signal', value: 'qwantum.01' },
    { label: 'Telegram', value: '@knight_of_bonnie' },
    { label: 'Steam', value: 'QuaZZZar2005' },
    { label: 'GitHub', value: 'github.com/BillSharifzade', href: 'https://github.com/BillSharifzade' },
  ],
}

export const skills = [
  { cat: 'Python', list: 'NumPy/Pandas, Django & FastAPI, TensorFlow' },
  { cat: 'Web', list: 'React & React Native, TypeScript, Next.js' },
  { cat: 'Low-level', list: 'C (OpenGL, Vulkan), Zig, Assembly' },
  { cat: 'Linux', list: 'Arch/Gentoo/Kali, Kernel/Systemd/Syscalls, Unix Philosophy' },
  { cat: 'Rust', list: 'Axum, Actix, Tauri, Ratatui, Tokio' },
  { cat: 'Security & Crypto', list: 'AppSec, Cryptography, Network Security' },
]

export const experience = [
  {
    title: 'Head of Software Department',
    company: 'Azal Telecommunications',
    date: 'January 2026 - Present',
    desc: 'Leading technical enablement and architecture for enterprise and government-scale systems, from corporate training to designing enormous software from the ground up.',
    bullets: [
      ['Corporate training:', 'Delivered corporate trainings on Unix philosophy, cybersecurity, and IT fundamentals across internal teams.'],
      ['Architecture:', 'Designed and architected enormous software systems, authored technical specifications, and audited closed, mission-critical software.'],
      ['International reach:', 'Led international meetings for B2G and B2B systems, aligning stakeholders across organizations.'],
    ],
  },
  {
    title: 'Co-Founder, CEO & Team Lead',
    company: '4Byte',
    date: 'December 2025 - Present',
    desc: 'Founded and lead a software company that builds efficient, reliable, and secure solutions with polished UI/UX for B2C, B2B, and B2G — across any platform, system, and SaaS.',
    bullets: [
      ['Leadership:', 'Grew as a leader — learning to communicate with people, business, and government, and to manage and divide work across the team.'],
      ['Team building:', 'Raised the level of everyone on the team while nurturing genuine friendship and lasting relationships.'],
      ['Product breadth:', 'Delivered end-to-end software solutions spanning platforms, systems, and SaaS products for State-Owned Enterprise Smart City refactoring their software and improving performance up to 50-70 times.'],
    ],
  },
  {
    title: 'Middle Software Engineer & Backend Architect',
    company: 'Koinoti Nav',
    date: 'October 2025 - Present',
    desc: 'Creating performant, secure, optimized, and scalable software with Rust and NextJS. Planning enormous, high-load architectures for modern systems.',
    bullets: [
      ['Business automation:', 'Built 10+ large-scale systems that automate core business processes for major companies. That improved efficiency and reduced manual work up to 80%.'],
      ['HR automation:', 'Led end-to-end optimization of the hiring platform, automating pipelines with AI-driven screening and onboarding flows that reduced hiring time from days to hours.'],
      ['Secure platforms:', 'Engineered a closed, security-first Linux distribution with a custom kernel tailored for enterprise partners. Which grants unparalleled security and control.'],
      ['Team culture:', 'Thrived within a highly professional, collaborative engineering team focused on excellence and knowledge sharing.'],
    ],
  },
  {
    title: 'Software Engineer',
    company: 'Milli Eats',
    date: 'June 2025 - January 2026',
    desc: 'Created cross-platform mobile delivery app with 3-sided architecture. Optimized performance and implemented scalable solutions.',
    bullets: [
      ['High-load design:', 'Delivered a secure, high-performance architecture that improved delivery speeds by over 70% versus the prior system.'],
      ['Realtime stack:', 'Implemented GPS tracking and real-time update services with first-class native support on iOS and Android.'],
    ],
  },
  {
    title: 'Technical Instructor',
    company: 'TechnoHub',
    date: 'January 2025 - February 2025',
    desc: 'Teaching programming concepts, training corporate teams, and developing software projects for enterprise clients.',
    bullets: [
      ['Curriculum leadership:', 'Mentored cohorts across Python, JavaScript, C, Ruby, and Assembly for beginner through advanced levels.'],
      ['Enterprise enablement:', 'Trained 55 Group, TGEM, Avesto, Koinoti Nav, and others to embed AI tooling into daily operations.'],
      ['Community impact:', 'Delivered numerous presentations and events covering cybersecurity, AI, engineering, and IT essentials.'],
    ],
  },
  {
    title: 'AI Specialist',
    company: 'TAG Marketeer Agency',
    date: 'February 2025 - March 2025',
    desc: 'Implemented AI solutions and automated marketing workflows, optimizing business processes through intelligent automation.',
    bullets: [
      ['Data intelligence:', 'Built an AI product that analyzes big data and surfaces statistical, analytical, and predictive dashboards. That optimized and speeded up decision-making processes by 100x.'],
      ['Throughput gains:', 'Reduced workflows that previously took months down to a single day with targeted automation.'],
    ],
  },
  {
    title: 'Founder',
    company: 'Founders School Bootcamp',
    date: 'Autumn 2024 - Winter 2024',
    desc: 'Developed startup concept, networked with industry experts, and gained entrepreneurial experience in tech innovation.',
    bullets: [
      ['Resilience:', 'Although the product never launched, transformed the journey into deep lessons across social engineering, marketing, and business management.'],
      ['Leadership growth:', 'Strengthened leadership, negotiation, and networking skills while collaborating with influential mentors.'],
    ],
  },
  {
    title: 'Crypto Analyst',
    company: 'International Transactions',
    date: 'Summer 2023',
    desc: 'Processed and analyzed cryptocurrency transactions between various countries and Tajikistan, identifying financial patterns.',
    bullets: [
      ['Blockchain insight:', 'Developed a nuanced understanding of blockchain architecture and trading ecosystems.'],
      ['Pattern discovery:', 'Identified actionable trading patterns to guide cross-border transaction strategies.'],
    ],
  },
  {
    title: 'Financial Automation Developer',
    company: 'Micro-Credit Organization',
    date: 'Summer 2020 - Present',
    desc: 'Developed financial workflow automation systems, maintained existing infrastructure, and optimized operational processes.',
    bullets: [
      ['Scoring models:', 'Authored 15+ mathematical formulas powering a robust, secure microcredit evaluation engine.'],
      ['Regulatory reporting:', 'Delivered automated reporting and analytics that satisfy stringent audit requirements. Reduced reporting time by 1000x.'],
    ],
  },
]

export const interests =
  'Astrophysics · Mathematics · Chess · Counter Strike 2 · Guitar · Knitting · Poems · Philosophy'

export const certifications = 'NASA Certification · CISCO Instructor Certification · TechnoHub Instructor Certification'
