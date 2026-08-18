import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
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

// The site's #818cf8 is too light to hold up in print at 9pt, so the document
// steps the same hue down to an ink-weight indigo and keeps the light tint for rules.
const ACCENT = '#4338ca'
const TINT = '#a5b4fc'
const INK = '#16161d'
const BODY = '#33333d'
const MUTED = '#5f5f6b'
const FAINT = '#9a9aa8'
const RULE = '#e4e4ea'

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 52,
    paddingHorizontal: 46,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: BODY,
    lineHeight: 1.45,
  },

  header: { marginBottom: 4 },
  name: { fontSize: 25, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4, color: INK, lineHeight: 1.1 },
  role: { fontSize: 10.5, color: ACCENT, marginTop: 6, fontFamily: 'Helvetica-Bold', letterSpacing: 0.2 },
  headerRule: { height: 2, backgroundColor: ACCENT, marginTop: 11, marginBottom: 9 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  contactCell: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  contactItem: { fontSize: 8.4, color: MUTED },
  contactLink: { fontSize: 8.4, color: MUTED, textDecoration: 'none' },
  contactSep: { fontSize: 8.4, color: TINT, marginHorizontal: 6 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: RULE, marginLeft: 10 },

  summary: { color: BODY },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBlock: { width: '50%', marginBottom: 7, paddingRight: 14 },
  skillCat: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: INK },
  skillList: { fontSize: 8.5, color: MUTED, marginTop: 1.5 },

  expItem: { marginBottom: 12 },
  expHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  expTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: INK, flex: 1, paddingRight: 12 },
  expCompany: { color: ACCENT },
  expDate: { fontSize: 8, color: FAINT },
  expDesc: { fontSize: 8.8, color: MUTED, marginTop: 3, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', marginTop: 2.5, paddingRight: 4 },
  bulletDot: { width: 9, fontSize: 8.6, color: TINT, fontFamily: 'Helvetica-Bold' },
  bulletText: { fontSize: 8.6, color: BODY, flex: 1 },
  bulletLabel: { fontFamily: 'Helvetica-Bold', color: INK },

  projItem: { marginBottom: 10 },
  projHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  projName: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: INK, flex: 1, paddingRight: 12 },
  projRepo: { fontSize: 7.8, color: FAINT, textDecoration: 'none' },
  projStack: { fontSize: 8.2, color: ACCENT, marginTop: 2 },
  projDesc: { fontSize: 8.6, color: BODY, marginTop: 3 },

  eduItem: { marginBottom: 6 },
  eduDegree: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: INK },
  eduSchool: { color: ACCENT },
  eduMeta: { fontSize: 8, color: FAINT, marginTop: 2 },

  certBlock: { width: '50%', flexDirection: 'row', marginBottom: 4, paddingRight: 14 },
  certDot: { width: 9, fontSize: 8.5, color: TINT, fontFamily: 'Helvetica-Bold' },
  certText: { fontSize: 8.5, color: BODY, flex: 1 },

  interests: { fontSize: 8.8, color: MUTED },

  // Absolutely-positioned fixed Texts: a flex row wrapper collapses here, so each
  // footer element is placed independently against the page box.
  footerRule: { position: 'absolute', bottom: 40, left: 46, right: 46, height: 1, backgroundColor: RULE },
  footerLeft: { position: 'absolute', bottom: 26, left: 46, fontSize: 7.5, color: FAINT },
  // Static rather than a `render`-driven page number: the render prop produced no
  // output here, and it cannot be verified against the browser build the app ships.
  footerRight: {
    position: 'absolute',
    bottom: 26,
    left: 349,
    width: 200,
    fontSize: 7.5,
    color: FAINT,
    textAlign: 'right',
  },
})

// minPresenceAhead reserves space after the heading, so a section title can never
// strand itself at the foot of a page with its content overleaf.
function Section({ title }) {
  return (
    <View style={styles.sectionHead} minPresenceAhead={70} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
    </View>
  )
}

function CvDocument() {
  return (
    <Document title={`${profile.name} - CV`} author={profile.name} subject="Curriculum Vitae">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.role}</Text>
          <View style={styles.headerRule} />
          <View style={styles.contactRow}>
            {profile.contacts.map((c, i) => (
              <View key={c.label} style={styles.contactCell}>
                {c.href ? (
                  <Link src={c.href} style={styles.contactLink}>
                    {c.value}
                  </Link>
                ) : (
                  <Text style={styles.contactItem}>{contactLine(c)}</Text>
                )}
                {i < profile.contacts.length - 1 && <Text style={styles.contactSep}>|</Text>}
              </View>
            ))}
          </View>
        </View>

        <Section title="Summary" />
        <Text style={styles.summary}>{profile.summary}</Text>

        <Section title="Core Stack" />
        <View style={styles.grid}>
          {skills.map((s) => (
            <View key={s.cat} style={styles.skillBlock}>
              <Text style={styles.skillCat}>{s.cat}</Text>
              <Text style={styles.skillList}>{s.list}</Text>
            </View>
          ))}
        </View>

        <Section title="Experience" />
        {experience.map((exp) => (
          <View key={exp.company} style={styles.expItem}>
            {/* Heading and description stay together; bullets flow across page
                breaks so a role never strands half a page of whitespace. */}
            <View wrap={false} minPresenceAhead={46}>
              <View style={styles.expHeadRow}>
                <Text style={styles.expTitle}>
                  {exp.title} <Text style={styles.expCompany}>· {exp.company}</Text>
                </Text>
                <Text style={styles.expDate}>{dateLine(exp)}</Text>
              </View>
              <Text style={styles.expDesc}>{exp.desc}</Text>
            </View>
            {exp.bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow} wrap={false}>
                <Text style={styles.bulletDot}>›</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletLabel}>{b[0]} </Text>
                  {b[1]}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Section title="Selected Projects" />
        {projects.map((p) => (
          <View key={p.repo} style={styles.projItem} wrap={false} minPresenceAhead={40}>
            <View style={styles.projHeadRow}>
              <Text style={styles.projName}>{p.name}</Text>
              <Link src={p.href} style={styles.projRepo}>
                {projectRepoLine(p)}
              </Link>
            </View>
            <Text style={styles.projStack}>{p.stack}</Text>
            <Text style={styles.projDesc}>{p.desc}</Text>
          </View>
        ))}

        <Section title="Education" />
        {education.map((ed) => (
          <View key={ed.school} style={styles.eduItem} wrap={false}>
            <Text style={styles.eduDegree}>
              {ed.degree} <Text style={styles.eduSchool}>· {ed.school}</Text>
            </Text>
            <Text style={styles.eduMeta}>{ed.note ? `${ed.date} · ${ed.note}` : ed.date}</Text>
          </View>
        ))}

        <Section title="Certifications" />
        <View style={styles.grid}>
          {certifications.map((c) => (
            <View key={`${c.name}-${c.issuer}`} style={styles.certBlock} wrap={false}>
              <Text style={styles.certDot}>›</Text>
              <Text style={styles.certText}>{certLine(c)}</Text>
            </View>
          ))}
        </View>

        <Section title="Interests" />
        <Text style={styles.interests}>{interests}</Text>

        <View style={styles.footerRule} fixed />
        <Text style={styles.footerLeft} fixed>
          {profile.name} · {profile.contacts.find((c) => c.label === 'Email')?.value}
        </Text>
        <Text style={styles.footerRight} fixed>
          {profile.contacts.find((c) => c.label === 'Website')?.value}
        </Text>
      </Page>
    </Document>
  )
}

export default CvDocument
