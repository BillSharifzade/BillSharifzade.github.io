import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'

const ACCENT = '#818cf8'
const DARK = '#1a1a1a'
const MUTED = '#555555'
const LINE = '#e2e2e2'

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: DARK,
    lineHeight: 1.45,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    paddingBottom: 14,
    marginBottom: 16,
  },
  name: { fontSize: 24, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, lineHeight: 1.1 },
  role: { fontSize: 11, color: ACCENT, marginTop: 7, fontFamily: 'Helvetica-Bold' },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  contactItem: { fontSize: 8.5, color: MUTED, marginRight: 14, marginBottom: 2 },
  contactLink: { color: MUTED, textDecoration: 'none' },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 14,
  },
  summary: { color: '#333333', marginBottom: 2 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBlock: { width: '50%', marginBottom: 7, paddingRight: 10 },
  skillCat: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: ACCENT },
  skillList: { fontSize: 8.8, color: '#444444', marginTop: 1 },
  expItem: { marginBottom: 11 },
  expHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  expTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  expCompany: { color: ACCENT, fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  expDate: { fontSize: 8.2, color: MUTED },
  expDesc: { fontSize: 9, color: '#444444', marginTop: 2, marginBottom: 3 },
  bulletRow: { flexDirection: 'row', marginTop: 1.5, paddingRight: 6 },
  bulletDot: { color: ACCENT, marginRight: 5, fontFamily: 'Helvetica-Bold' },
  bulletText: { fontSize: 8.6, color: '#333333', flex: 1 },
  bulletLabel: { fontFamily: 'Helvetica-Bold', color: DARK },
  certRow: { fontSize: 9, color: '#333333' },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
    fontSize: 7.5,
    color: '#999999',
    textAlign: 'center',
  },
})

const skills = [
  { cat: 'Python', list: 'NumPy/Pandas, Django & FastAPI, TensorFlow' },
  { cat: 'Web', list: 'React & React Native, TypeScript, Next.js' },
  { cat: 'Low-level', list: 'C (OpenGL, Vulkan), Zig, Assembly' },
  { cat: 'Linux', list: 'Arch/Gentoo/Kali, Kernel/Systemd/Syscalls, Unix Philosophy' },
  { cat: 'Rust', list: 'Axum, Actix, Tauri, Ratatui, Tokio' },
  { cat: 'Security & Crypto', list: 'AppSec, Cryptography, Network Security' },
]

const experience = [
  {
    title: 'Head of Software Department',
    company: 'Azal Telecommunications',
    date: 'January 2026 - Present',
    desc: 'Lead corporate technical enablement and architecture design for large-scale enterprise and government systems.',
    bullets: [
      ['Corporate training:', 'Delivered corporate trainings on Unix philosophy, cybersecurity, and IT fundamentals to internal teams.'],
      ['Architecture:', 'Designed and architected enormous software systems, authored technical specifications, and audited closed, mission-critical software.'],
      ['International reach:', 'Led international meetings for B2G and B2B systems, aligning stakeholders across organizations.'],
    ],
  },
  {
    title: 'Co-Founder, CEO & Team Lead',
    company: '4Byte',
    date: 'December 2025 - Present',
    desc: 'Founded and lead a software company building efficient, reliable, and secure solutions with polished UI/UX for B2C, B2B, and B2G — across any platform, system, and SaaS.',
    bullets: [
      ['Leadership:', 'Grew as a leader — learning to communicate with people, business, and government, and to manage and divide work across the team.'],
      ['Team building:', 'Raised the level of everyone on the team while nurturing genuine friendship and lasting relationships.'],
      ['Product breadth:', 'Delivered end-to-end software solutions spanning platforms, systems, and SaaS products.'],
    ],
  },
  {
    title: 'Middle Software Engineer & Backend Architect',
    company: 'Koinoti Nav',
    date: 'October 2025 - Present',
    desc: 'Build performant, secure, optimized, and scalable software with Rust and Next.js, planning high-load architectures for modern systems.',
    bullets: [
      ['Business automation:', 'Built 10+ large-scale systems that automate core business processes for major companies.'],
      ['HR automation:', 'Led end-to-end optimization of the hiring platform with AI-driven screening and onboarding flows.'],
      ['Secure platforms:', 'Engineered a closed, security-first Linux distribution with a custom kernel for enterprise partners.'],
    ],
  },
  {
    title: 'Software Engineer',
    company: 'ZOOD Organization',
    date: 'June 2025 - Present',
    desc: 'Built a cross-platform mobile delivery app with a 3-sided architecture.',
    bullets: [
      ['High-load design:', 'Delivered a secure, high-performance architecture improving delivery speeds by 70%+ over the prior system.'],
      ['Realtime stack:', 'Implemented GPS tracking and real-time updates with first-class native iOS and Android support.'],
    ],
  },
  {
    title: 'Technical Instructor',
    company: 'TechnoHub',
    date: 'January 2025 - Present',
    desc: 'Teach programming, train corporate teams, and build software for enterprise clients.',
    bullets: [
      ['Curriculum:', 'Mentored cohorts across Python, JavaScript, C, Ruby, and Assembly, beginner through advanced.'],
      ['Enterprise enablement:', 'Trained 55 Group, TGEM, Avesto, Koinoti Nav, and others to embed AI tooling into operations.'],
    ],
  },
  {
    title: 'AI Specialist',
    company: 'TAG Marketeer Agency',
    date: 'February - March 2025',
    desc: 'Implemented AI solutions and automated marketing workflows.',
    bullets: [
      ['Data intelligence:', 'Built an AI product analyzing big data into statistical, analytical, and predictive dashboards.'],
      ['Throughput:', 'Reduced month-long workflows down to a single day through targeted automation.'],
    ],
  },
  {
    title: 'Financial Automation Developer',
    company: 'Micro-Credit Organization',
    date: 'Summer 2020 - Present',
    desc: 'Developed financial workflow automation systems and optimized operational processes.',
    bullets: [
      ['Scoring models:', 'Authored 15+ mathematical formulas powering a secure microcredit evaluation engine.'],
      ['Reporting:', 'Delivered automated reporting and analytics satisfying stringent audit requirements.'],
    ],
  },
]

function CvDocument() {
  return (
    <Document
      title="Sharifzoda Bilol - CV"
      author="Sharifzoda Bilol"
      subject="Curriculum Vitae"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>Sharifzoda Bilol</Text>
          <Text style={styles.role}>Backend Architect · AI Architecture Specialist · Full-Stack Developer</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactItem}>+992 985 447 072</Text>
            <Text style={styles.contactItem}>Signal: qwantum.01</Text>
            <Text style={styles.contactItem}>Telegram: @knight_of_bonnie</Text>
            <Link src="https://github.com/BillSharifzade" style={[styles.contactItem, styles.contactLink]}>
              github.com/BillSharifzade
            </Link>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summary}>
          Backend architect with deep expertise across full-range systems engineering — fintech, high-load systems,
          and AI creation and integration. I build robust, high-quality, long-term, and efficient solutions, with a
          focus on low-level programming, ML, blockchain, and architecting enormous systems from scratch.
        </Text>

        <Text style={styles.sectionTitle}>Technical Arsenal</Text>
        <View style={styles.skillsGrid}>
          {skills.map((s) => (
            <View key={s.cat} style={styles.skillBlock}>
              <Text style={styles.skillCat}>{s.cat}</Text>
              <Text style={styles.skillList}>{s.list}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Experience</Text>
        {experience.map((exp) => (
          <View key={exp.company} style={styles.expItem} wrap={false}>
            <View style={styles.expHeadRow}>
              <Text style={styles.expTitle}>
                {exp.title} <Text style={styles.expCompany}>· {exp.company}</Text>
              </Text>
              <Text style={styles.expDate}>{exp.date}</Text>
            </View>
            <Text style={styles.expDesc}>{exp.desc}</Text>
            {exp.bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>›</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletLabel}>{b[0]} </Text>
                  {b[1]}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Certifications</Text>
        <Text style={styles.certRow}>NASA Certified · CISCO Instructor · TechnoHub Certified</Text>

        <Text style={styles.footer} fixed>
          Sharifzoda Bilol — Crafted with precision. github.com/BillSharifzade
        </Text>
      </Page>
    </Document>
  )
}

export default CvDocument
