import { Document, Page, Text, View, StyleSheet, Link, Font, Svg, Path } from '@react-pdf/renderer'
import {
  profile,
  skills,
  experience,
  education,
  projects,
  projectRepoLine,
  interests,
  certifications,
  contactLine,
  certLine,
  dateLine,
} from '../data/cv.js'
import { resolveIcons } from '../data/projectIcons.js'
import { CV_ICON_PATHS } from '../data/cvIcons.js'
import { SIGNAL_LOGO } from '../data/signalLogo.js'
import { CV_THEME, hex } from '../utils/cvTheme.js'
import jbmRegular from '../assets/fonts/ttf/JetBrainsMono-Regular.ttf?url'
import jbmMedium from '../assets/fonts/ttf/JetBrainsMono-Medium.ttf?url'
import jbmBold from '../assets/fonts/ttf/JetBrainsMono-Bold.ttf?url'
import jbmExtraBold from '../assets/fonts/ttf/JetBrainsMono-ExtraBold.ttf?url'

// The site's face, embedded so the PDF looks the same on a machine that has
// never heard of JetBrains Mono. The static weights are used rather than the
// variable font because PDF readers cannot select a variation instance.
Font.register({
  family: CV_THEME.font,
  fonts: [
    { src: jbmRegular, fontWeight: 400 },
    { src: jbmMedium, fontWeight: 500 },
    { src: jbmBold, fontWeight: 700 },
    { src: jbmExtraBold, fontWeight: 800 },
  ],
})
// Monospace reads worse hyphenated than ragged.
Font.registerHyphenationCallback((word) => [word])

const C = {
  bg: hex('bg'),
  panel: hex('panel'),
  rule: hex('rule'),
  white: hex('white'),
  text: hex('text'),
  muted: hex('muted'),
  dim: hex('dim'),
  ok: hex('ok'),
  accent: hex('accent'),
  dir: hex('dir'),
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: CV_THEME.font,
    fontSize: 8.2,
    color: C.text,
  },
  // lineHeight is set per text style below rather than once on the Page. A
  // `render`-prop Text (the page-number footer) that inherits lineHeight from
  // the Page is laid out empty and never redrawn by react-pdf 4.5's dynamic
  // pass — the footer simply vanishes — and putting it on a wrapping View
  // instead inflates every block and doubles the page count.

  prompt: { flexDirection: 'row', fontSize: 7.4, marginBottom: 1 },
  name: { fontSize: 22, fontWeight: 800, color: C.white, lineHeight: 1.2, marginBottom: 6, letterSpacing: -0.4 },
  role: { fontSize: 8.6, fontWeight: 700, color: C.accent, lineHeight: 1.4, marginBottom: 10 },

  contactRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 },
  contactCell: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  contactText: { lineHeight: 1.5, fontSize: 7.2, color: C.muted, marginLeft: 4, textDecoration: 'none' },

  headerRule: { height: 1, backgroundColor: C.rule, marginTop: 8 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 7 },
  sectionTitle: {
    lineHeight: 1.5,
    fontSize: 7.8,
    fontWeight: 700,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginLeft: 6,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: C.rule, marginLeft: 10 },

  summary: { lineHeight: 1.5, color: C.text, fontSize: 8.2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBlock: { width: '50%', marginBottom: 6, paddingRight: 14 },
  skillCat: { lineHeight: 1.5, fontWeight: 700, fontSize: 8, color: C.white },
  skillList: { lineHeight: 1.5, fontSize: 7.6, color: C.muted, marginTop: 1 },

  expItem: { marginBottom: 11 },
  expHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  expTitle: { lineHeight: 1.5, fontWeight: 700, fontSize: 8.8, color: C.white, flex: 1, paddingRight: 12 },
  expCompany: { color: C.accent },
  expDate: { lineHeight: 1.5, fontSize: 7, color: C.dim },
  expDesc: { lineHeight: 1.5, fontSize: 7.8, color: C.muted, marginTop: 2, marginBottom: 3 },
  bulletRow: { flexDirection: 'row', marginTop: 2, paddingRight: 4 },
  bulletDot: { width: 9, fontSize: 8, color: C.ok, fontWeight: 700 },
  bulletText: { lineHeight: 1.5, fontSize: 7.8, color: C.text, flex: 1 },
  bulletLabel: { fontWeight: 700, color: C.white },

  projItem: { marginBottom: 10 },
  projHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projNameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  projName: { lineHeight: 1.5, fontWeight: 700, fontSize: 8.6, color: C.white, marginRight: 6 },
  projTech: { flexDirection: 'row', alignItems: 'center' },
  projRepo: { fontSize: 7, color: C.dir, textDecoration: 'none' },
  projStack: { lineHeight: 1.5, fontSize: 7.4, color: C.accent, marginTop: 2 },
  projDesc: { lineHeight: 1.5, fontSize: 7.8, color: C.text, marginTop: 2 },

  eduItem: { marginBottom: 6 },
  eduDegree: { lineHeight: 1.5, fontWeight: 700, fontSize: 8.6, color: C.white },
  eduSchool: { color: C.accent },
  eduMeta: { lineHeight: 1.5, fontSize: 7, color: C.dim, marginTop: 1 },

  certBlock: { width: '50%', flexDirection: 'row', marginBottom: 3, paddingRight: 14 },
  certDot: { width: 9, fontSize: 8, color: C.ok, fontWeight: 700 },
  certText: { lineHeight: 1.5, fontSize: 7.6, color: C.text, flex: 1 },

  interests: { lineHeight: 1.5, fontSize: 7.8, color: C.muted },

  footerRule: { position: 'absolute', bottom: 36, left: 44, right: 44, height: 1, backgroundColor: C.rule },
  footerLeft: { position: 'absolute', bottom: 22, left: 44, fontSize: 6.8, color: C.dim },
  // The page-number Text gets its content from a `render` prop, so it has no
  // box of its own at layout time; the fixed View around it supplies one.
  footerRightBox: { position: 'absolute', bottom: 22, left: 300, width: 251 },
  footerRight: { fontSize: 6.8, color: C.dim, textAlign: 'right' },
})

/** A Font Awesome glyph from the CV set, sized by its cap height. */
function Glyph({ name, size = 8, color = C.dim, style }) {
  const [w, h, d] = CV_ICON_PATHS[name]
  return (
    <Svg width={(size * w) / h} height={size} viewBox={`0 0 ${w} ${h}`} style={style}>
      <Path d={d} fill={color} />
    </Svg>
  )
}

/** A simple-icons brand mark (always a 24x24 box). */
function Brand({ path, size = 7.5, color = C.muted, style }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path d={path} fill={color} />
    </Svg>
  )
}

function SignalMark({ size = 8, color = C.dim }) {
  const [, , w, h] = SIGNAL_LOGO.viewBox
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${w} ${h}`}>
      {SIGNAL_LOGO.paths.map((d) => (
        <Path key={d.slice(0, 24)} d={d} fill={color} />
      ))}
    </Svg>
  )
}

const CONTACT_GLYPH = {
  Location: 'location-dot',
  Email: 'envelope',
  Telegram: 'telegram',
  GitHub: 'github',
  LinkedIn: 'linkedin',
  Website: 'globe',
}

function ContactIcon({ label }) {
  if (label === 'Signal') return <SignalMark />
  const name = CONTACT_GLYPH[label]
  return name ? <Glyph name={name} /> : null
}

/** `bill@coolest_website:~$ cmd`, coloured the way the site's terminal does it. */
function Prompt({ cmd }) {
  const { user, host, path } = CV_THEME.prompt
  return (
    <View style={styles.prompt}>
      <Text style={{ color: C.ok }}>{user}</Text>
      <Text style={{ color: C.dim }}>@</Text>
      <Text style={{ color: C.ok }}>{host}</Text>
      <Text style={{ color: C.dim }}>:</Text>
      <Text style={{ color: C.dir, fontWeight: 700 }}>{path}</Text>
      <Text style={{ color: C.text }}>$ {cmd}</Text>
    </View>
  )
}

function Section({ title, icon }) {
  return (
    <View style={styles.sectionHead} minPresenceAhead={70} wrap={false}>
      <Glyph name={icon} size={8} color={C.ok} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
    </View>
  )
}

function CvDocument() {
  const email = profile.contacts.find((c) => c.label === 'Email')?.value
  const site = profile.contacts.find((c) => c.label === 'Website')?.value

  return (
    <Document title={`${profile.name} - CV`} author={profile.name} subject="Curriculum Vitae">
      <Page size="A4" style={styles.page}>
        {/* Header mirrors the social card: the terminal asks, the answers are the CV. */}
        <View>
          <Prompt cmd="whoami" />
          <Text style={styles.name}>{profile.name}</Text>
          <Prompt cmd="cat role.txt" />
          <Text style={styles.role}>{profile.role}</Text>
          <View style={styles.contactRow}>
            {profile.contacts.map((c) => (
              <View key={c.label} style={styles.contactCell}>
                <ContactIcon label={c.label} />
                {c.href ? (
                  <Link src={c.href} style={styles.contactText}>
                    {c.value}
                  </Link>
                ) : (
                  <Text style={styles.contactText}>{c.bare ? c.value : contactLine(c)}</Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.headerRule} />
        </View>

        <Section title="Summary" icon="terminal" />
        <Text style={styles.summary}>{profile.summary}</Text>

        <Section title="Core Stack" icon="layer-group" />
        <View style={styles.grid}>
          {skills.map((s) => (
            <View key={s.cat} style={styles.skillBlock}>
              <Text style={styles.skillCat}>{s.cat}</Text>
              <Text style={styles.skillList}>{s.list}</Text>
            </View>
          ))}
        </View>

        <Section title="Experience" icon="briefcase" />
        {experience.map((exp) => (
          <View key={exp.company + exp.date} style={styles.expItem}>
            <View wrap={false} minPresenceAhead={46}>
              <View style={styles.expHeadRow}>
                <Text style={styles.expTitle}>
                  {exp.title} <Text style={styles.expCompany}>· {exp.company}</Text>
                </Text>
                <Text style={styles.expDate}>{dateLine(exp)}</Text>
              </View>
              <Text style={styles.expDesc}>{exp.desc}</Text>
            </View>
            {exp.bullets.map(([label, text]) => (
              <View key={label} style={styles.bulletRow} wrap={false}>
                <Text style={styles.bulletDot}>›</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletLabel}>{label} </Text>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Section title="Selected Projects" icon="diagram-project" />
        {projects.map((p) => (
          <View key={p.repo} style={styles.projItem} wrap={false} minPresenceAhead={40}>
            <View style={styles.projHeadRow}>
              <View style={styles.projNameRow}>
                <Text style={styles.projName}>{p.name}</Text>
                <View style={styles.projTech}>
                  {resolveIcons(p.icons).map((t) => (
                    <Brand key={t.title} path={t.path} style={{ marginRight: 3 }} />
                  ))}
                </View>
              </View>
              <Link src={p.href} style={styles.projRepo}>
                {projectRepoLine(p)}
              </Link>
            </View>
            <Text style={styles.projStack}>{p.stack}</Text>
            <Text style={styles.projDesc}>{p.desc}</Text>
          </View>
        ))}

        <Section title="Education" icon="graduation-cap" />
        {education.map((ed) => (
          <View key={ed.school} style={styles.eduItem} wrap={false}>
            <Text style={styles.eduDegree}>
              {ed.degree} <Text style={styles.eduSchool}>· {ed.school}</Text>
            </Text>
            <Text style={styles.eduMeta}>{ed.note ? `${ed.date} · ${ed.note}` : ed.date}</Text>
          </View>
        ))}

        <Section title="Certifications" icon="award" />
        <View style={styles.grid}>
          {certifications.map((c) => (
            <View key={`${c.name}-${c.issuer}`} style={styles.certBlock} wrap={false}>
              <Text style={styles.certDot}>›</Text>
              <Text style={styles.certText}>{certLine(c)}</Text>
            </View>
          ))}
        </View>

        <Section title="Interests" icon="heart" />
        <Text style={styles.interests}>{interests}</Text>

        <View style={styles.footerRule} fixed />
        <Text style={styles.footerLeft} fixed>
          {profile.name} · {email}
        </Text>
        <View style={styles.footerRightBox} fixed>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) => `${site} · ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export default CvDocument
