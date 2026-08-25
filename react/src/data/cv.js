export const profile = {
  name: 'Sharifzoda Bilol',
  role: 'Backend Architect · AI Architecture Specialist · Full-Stack Developer',
  summary:
    'Backend architect with deep expertise in systems engineering across fintech, high-load platforms, ' +
    'and applied AI. I build robust, maintainable, and efficient solutions, with a focus on low-level ' +
    'programming, ML, blockchain, and architecting large-scale systems from scratch.',
  contacts: [
    { label: 'Location', value: 'Dushanbe, Tajikistan', bare: true },
    { label: 'Email', value: 'sharifzadebilal@gmail.com', href: 'mailto:sharifzadebilal@gmail.com' },
    { label: 'Telegram', value: '@knight_of_bonnie' },
    { label: 'Signal', value: 'qwantum.01' },
    { label: 'GitHub', value: 'github.com/BillSharifzade', href: 'https://github.com/BillSharifzade' },
    { label: 'LinkedIn', value: 'linkedin.com/in/bilal-sharifzade-555bba35a', href: 'https://www.linkedin.com/in/bilal-sharifzade-555bba35a/' },
    { label: 'Website', value: 'billsharifzade.github.io', href: 'https://billsharifzade.github.io/' },
  ],
}

export function contactLine(c) {
  return c.bare ? c.value : `${c.label}: ${c.value}`
}

export const skills = [
  { cat: 'Python', list: 'NumPy/Pandas, Django & FastAPI, TensorFlow' },
  { cat: 'Web', list: 'React & React Native, TypeScript, Next.js' },
  { cat: 'Low-level', list: 'C (OpenGL, Vulkan), Zig, Assembly' },
  { cat: 'Linux', list: 'Arch/Gentoo/Kali, Kernel/Systemd/Syscalls, Unix Philosophy' },
  { cat: 'Rust', list: 'Axum, Actix, Tauri, Ratatui, Tokio' },
  { cat: 'Go', list: 'Chi, pgx, service APIs' },
  { cat: 'Security & Crypto', list: 'AppSec, Cryptography, Network Security' },
  { cat: 'Performance', list: 'Grafana k6, load testing, production benchmarking' },
]

export const experience = [
  {
    title: 'Head of Software Department',
    company: 'Azal Telecommunications',
    date: 'January 2026 - Present',
    type: 'Leadership',
    desc: 'Leading technical enablement and architecture for enterprise and government-scale systems, from corporate training to designing large-scale software from the ground up.',
    bullets: [
      ['Corporate training:', 'Deliver corporate training on Unix philosophy, cybersecurity, and IT fundamentals across internal teams.'],
      ['Architecture:', 'Design and architect large-scale software systems, author technical specifications, and audit closed, mission-critical software.'],
      ['International reach:', 'Lead international meetings for B2G and B2B systems, aligning stakeholders across organizations.'],
    ],
  },
  {
    title: 'Co-Founder, CEO & Team Lead',
    company: '4Byte',
    date: 'December 2025 - Present',
    type: 'Founder',
    desc: 'Founded and lead a software company building efficient, reliable, and secure solutions with polished UI/UX for B2C, B2B, and B2G across platforms, systems, and SaaS.',
    bullets: [
      ['Performance engineering:', 'Refactored the platform for the state-owned enterprise Smart City, improving latency and throughput 50–70× — every change load-tested against production with Grafana k6.'],
      ['Constrained environments:', 'Optimized architecture, payload sizes, and network behaviour for low-end Android devices and the unstable, low-bandwidth connections common across the region.'],
      ['Product breadth:', 'Deliver end-to-end software across platforms, systems, and SaaS for B2C, B2B, and B2G clients.'],
      ['Leadership:', 'Built the practices for communicating with business and government stakeholders, dividing work across the team, and raising every engineer’s technical level.'],
    ],
  },
  {
    title: 'Software Engineer & Backend Architect',
    company: 'Koinoti Nav',
    date: 'October 2025 - Present',
    type: 'Engineering',
    desc: 'Build performant, secure, and scalable software with Rust and Next.js. Design high-load architectures for modern systems.',
    bullets: [
      ['Business automation:', 'Built 10+ large-scale systems automating core business processes for enterprise clients, reducing manual work by up to 80%.'],
      ['HR automation:', 'Led end-to-end optimization of the hiring platform, automating pipelines with AI-driven screening and onboarding flows that reduced hiring time from days to hours.'],
      ['Secure platforms:', 'Engineered a closed, security-first Linux distribution with a custom kernel for enterprise partners, giving them full control over their trusted computing base.'],
    ],
  },
  {
    title: 'Software Engineer',
    company: 'Milli Eats',
    date: 'June 2025 - January 2026',
    desc: 'Built a cross-platform mobile delivery app on a three-sided marketplace architecture (customer, courier, vendor), focused on performance and scalability.',
    bullets: [
      ['High-load design:', 'Delivered a secure, high-performance architecture that improved delivery speeds by over 70% versus the prior system.'],
      ['Realtime stack:', 'Implemented GPS tracking and real-time update services with first-class native support on iOS and Android.'],
    ],
  },
  {
    title: 'Technical Instructor',
    company: 'TechnoHub',
    date: 'January 2025 - February 2025',
    desc: 'Taught programming, trained corporate teams, and developed software projects for enterprise clients.',
    bullets: [
      ['Curriculum leadership:', 'Mentored cohorts across Python, JavaScript, C, Ruby, and Assembly, from beginner through advanced levels.'],
      ['Enterprise enablement:', 'Trained 55 Group, TGEM, Avesto, Koinoti Nav, and others to embed AI tooling into daily operations.'],
      ['Community impact:', 'Delivered presentations and events covering cybersecurity, AI, engineering, and IT essentials.'],
    ],
  },
  {
    title: 'AI Specialist',
    company: 'TAG Marketeer Agency',
    date: 'February 2025 - March 2025',
    desc: 'Implemented AI solutions and automated marketing workflows, optimizing business processes through intelligent automation.',
    bullets: [
      ['Data intelligence:', 'Built an AI product that analyzes large datasets into statistical, analytical, and predictive dashboards — replacing weekly manual reporting with live views and cutting reporting-to-decision time ~100×.'],
      ['Throughput gains:', 'Reduced multi-month manual workflows to a single day through targeted automation.'],
    ],
  },
  {
    title: 'Founder',
    company: 'Founders School Bootcamp',
    date: 'Autumn 2024 - Winter 2024',
    desc: 'Developed a startup concept, networked with industry experts, and gained entrepreneurial experience in tech innovation.',
    bullets: [
      ['Resilience:', 'Although the product never launched, turned the experience into deep lessons across social engineering, marketing, and business management.'],
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
    type: 'Ongoing',
    desc: 'Developed financial workflow automation systems, maintained existing infrastructure, and optimized operational processes.',
    bullets: [
      ['Scoring models:', 'Authored 15+ mathematical formulas powering a robust, secure microcredit evaluation engine.'],
      ['Regulatory reporting:', 'Delivered automated reporting and analytics that satisfy stringent audit requirements, cutting regulatory report preparation ~1000× — from multi-day manual compilation to minutes.'],
    ],
  },
]

export function dateLine(exp) {
  return exp.type ? `${exp.date} · ${exp.type}` : exp.date
}

export const projects = [
  {
    name: 'Multi-Protocol API Framework',
    icon: 'fab fa-rust',
    href: 'https://github.com/BillSharifzade/rs-apilib',
    repo: 'rs-apilib',
    cover: 'apiweave',
    icons: ['siRust', 'siGraphql', 'siJson', 'siOpenapiinitiative'],
    stack: 'Rust (hyper, Tokio, proc-macros) \u00b7 REST \u00b7 GraphQL \u00b7 RPC \u00b7 SOAP \u00b7 WS',
    blurb:
      'Declare an operation once; apiweave serves it as REST, GraphQL, JSON-RPC, SOAP, WebSocket and SSE '
      + 'from one handler \u2014 one schema, one error taxonomy, no codegen step.',
    desc:
      'apiweave: a three-crate Rust workspace where a single #[operation] declaration is projected onto every '
      + 'protocol a service needs \u2014 REST, JSON-RPC 2.0, GraphQL, SOAP 1.1/1.2, WebSocket and SSE \u2014 sharing one '
      + 'schema IR, one validation pass and one error taxonomy. Ships a hand-written GraphQL parser with SDL and '
      + 'introspection, WSDL and OpenAPI 3.1 generation, and derive macros, on a default build of 61 crates with '
      + 'zero *-sys dependencies.',
  },
  {
    name: 'Recruitment Automation Platform',
    icon: 'fab fa-rust',
    href: 'https://github.com/BillSharifzade/Rust-Screenx-HR-Automatization',
    repo: 'Rust-Screenx-HR-Automatization',
    cover: 'screenx',
    icons: ['siRust', 'siPostgresql', 'siNextdotjs', 'siTelegram'],
    stack: 'Rust (Axum, Tokio, SQLx) \u00b7 PostgreSQL \u00b7 Next.js \u00b7 Telegram Mini App \u00b7 OpenAI',
    blurb:
      'Carries a candidate from registration through AI-generated testing to hire across an HR/ERP system, a '
      + 'Telegram bot and a Mini App, with background workers driving the AI queue and deadlines.',
    desc:
      'Recruitment platform bridging a corporate HR/ERP system, a Telegram bot, and a Telegram Mini App, '
      + 'automating the candidate lifecycle from registration through AI-generated testing to hire. Background '
      + 'workers drive the AI queue, webhook delivery, and deadline checks behind Argon2 + JWT auth and '
      + 'per-route rate limiting.',
  },
  {
    name: 'Competency Matrix Platform',
    icon: 'fab fa-golang',
    href: 'https://github.com/BillSharifzade/HR_Progress',
    repo: 'HR_Progress',
    cover: 'hr-progress',
    icons: ['siGo', 'siPostgresql', 'siReact', 'siTypescript'],
    stack: 'Go (chi) \u00b7 PostgreSQL \u00b7 React \u00b7 TypeScript',
    blurb:
      'Multi-assessor scoring against a per-grade competency matrix, turning the resulting gaps into Individual '
      + 'Development Plans with preceptor matching and predicted-improvement tracking.',
    desc:
      'Workforce development system for a large corporation: assessments scored by multiple assessors, a '
      + 'competency matrix with per-grade and per-department minimum thresholds, and Individual Development '
      + 'Plans generated from the resulting gaps \u2014 including preceptor matching and predicted-improvement '
      + 'tracking. Built to stay extensible as competencies change.',
  },
  {
    name: 'Async Kafka Client',
    icon: 'fab fa-rust',
    href: 'https://github.com/BillSharifzade/rs-rdkafka',
    repo: 'rs-rdkafka',
    cover: 'rdkafka',
    icons: ['siRust', 'siApachekafka', 'siC'],
    stack: 'Rust (Tokio, futures) \u00b7 librdkafka \u00b7 C bindings',
    blurb:
      'The fully asynchronous Apache Kafka client for Rust, kept '
      + 'in-tree with its rdkafka-sys binding layer.',
    desc:
      'The fully asynchronous, futures-enabled Apache Kafka client '
      + 'for Rust built on librdkafka: futures-based producers and stream consumers, admin and transaction APIs, '
      + 'consumer-group and metadata access, and a mocking layer \u2014 maintained in-tree alongside the rdkafka-sys '
      + 'C bindings.',
  },
  {
    name: 'Process Viewer CLI',
    icon: 'fab fa-rust',
    href: 'https://github.com/BillSharifzade/rs-procs',
    repo: 'rs-procs',
    cover: 'procs',
    icons: ['siRust', 'siLinux', 'siDocker'],
    stack: 'Rust (clap) \u00b7 Linux / macOS / FreeBSD / Windows \u00b7 Docker',
    blurb:
      'A modern ps replacement with tree views, Docker resolution and '
      + 'TOML-configured columns across four OS backends.',
    desc:
      'A modern replacement for ps written in Rust: tree and multi-column '
      + 'process views, Docker container resolution, per-process I/O and TCP/UDP port columns, and a '
      + 'TOML-configured column set with separate Linux, macOS, FreeBSD and Windows backends.',
  },
]

export function projectRepoLine(p) {
  return `github.com/BillSharifzade/${p.repo}`
}

export const education = [
  {
    degree: 'Bachelor of Computer Science',
    school: 'Russian-Tajik Slavonic University (RTSU)',
    date: '2021 - 2025',
    note: 'Completed',
  },
]

export const certifications = [
  { name: 'CCNA — Cisco Certified Network Associate', issuer: 'Cisco' },
  { name: 'Cisco Certified Instructor', issuer: 'Cisco' },
  { name: 'AZ-900: Azure Fundamentals', issuer: 'Microsoft' },
  { name: 'AI-900: Azure AI Fundamentals', issuer: 'Microsoft' },
  { name: 'Space Apps Challenge — Participant', issuer: 'NASA' },
  { name: 'Cloud Skill Badges', issuer: 'Google Cloud' },
  { name: 'Engineering Certification', issuer: 'Anthropic' },
  { name: 'Engineering Certification', issuer: 'OpenAI' },
  { name: 'Instructor Certification', issuer: 'TechnoHub' },
]

export function certLine(c) {
  const head = c.issuer ? `${c.name} — ${c.issuer}` : c.name
  return c.year ? `${head}, ${c.year}` : head
}

export const interests =
  'Astrophysics · Mathematics · Chess · Counter Strike 2 · Bodybuilding · Guitar · Knitting · Poems · Philosophy'
