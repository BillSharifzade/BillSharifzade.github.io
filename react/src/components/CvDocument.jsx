import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import { profile, skills, experience, interests, certifications } from '../data/cv.js'

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

function CvDocument() {
  return (
    <Document
      title="Sharifzoda Bilol - CV"
      author="Sharifzoda Bilol"
      subject="Curriculum Vitae"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.role}</Text>
          <View style={styles.contactRow}>
            {profile.contacts.map((c) =>
              c.href ? (
                <Link key={c.label} src={c.href} style={[styles.contactItem, styles.contactLink]}>
                  {c.value}
                </Link>
              ) : (
                <Text key={c.label} style={styles.contactItem}>
                  {c.label === 'Phone' ? c.value : `${c.label}: ${c.value}`}
                </Text>
              )
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summary}>{profile.summary}</Text>

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

        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.certRow}>{interests}</Text>

        <Text style={styles.sectionTitle}>Certifications</Text>
        <Text style={styles.certRow}>{certifications}</Text>

        <Text style={styles.footer} fixed>
          Sharifzoda Bilol — Crafted with precision. github.com/BillSharifzade
        </Text>
      </Page>
    </Document>
  )
}

export default CvDocument
