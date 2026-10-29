// Whole calendar months from a to b.
const monthsBetween = (a, b) =>
  (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() - (b.getDate() < a.getDate() ? 1 : 0)

// spent / left / progress measured against the visitor's clock, so a project
// with a fixed date fills its bar on its own instead of waiting for a re-edit.
function countdown(start, due, now = new Date()) {
  const t = Math.min(Math.max(now, start), due)
  const spent = monthsBetween(start, new Date(t))
  return {
    spent: `${spent} mo`,
    left: t >= due ? 'done' : `~${monthsBetween(start, due) - spent} mo`,
    progress: (t - start) / (due - start),
  }
}

export const wipProjects = [
  {
    name: 'kernel',
    company: 'Mintaka · payment systems',
    spent: '15 mo',
    left: '~1 mo',
    progress: 0.94,
    stack: ['Rust', 'PostgreSQL', 'Kafka', 'TigerBeetle'],
    desc: 'C2C money-transfer backend — the fastest ever built in Tajikistan: most optimized, modern, secure and stable, outperforming Dushanbe City Bank, Alif and every other local bank across a wide range of tests.',
  },
  {
    name: 'rff',
    company: 'personal',
    spent: '2 mo',
    left: '~2 mo',
    progress: 0.5,
    stack: ['Rust', 'ASM', 'C', 'Makefile'],
    desc: 'Rust fullstack framework for writing cross-platform applications in pure Rust.',
  },
  {
    name: 'karag',
    company: 'Koinoti Nav',
    spent: '3 mo',
    left: '~3 mo',
    progress: 0.5,
    stack: ['Python', 'TensorFlow', 'NumPy', 'LM Studio', 'SQLite', 'pgvector', 'TypeScript'],
    desc: "Koinot AutoRAG — closed corporate AI agent that works with documents locally, creates skills and shares them across every worker in the company, powered by a multimodal LLM in Koinot's high-tech data center.",
  },
  {
    name: 'arss',
    company: 'Azal Rust Software Solutions',
    spent: '6 mo',
    left: '~4 mo',
    progress: 0.6,
    stack: ['Rust', 'CRMs', 'Mobile', 'Embedded'],
    desc: 'B2B / B2C / B2G software — blazing, secure, extensible and stable: CRMs, mobile apps, embedded systems and more.',
  },
  {
    name: 'lirust',
    company: 'personal',
    spent: '12 mo',
    left: '~18 mo',
    progress: 0.4,
    stack: ['Rust'],
    desc: 'OS kernel written in pure Rust, inspired by Linux.',
  },
  {
    name: 'mipe',
    special: true,
    company: 'personal · most important project ever',
    // February 2025 → May 2027
    ...countdown(new Date(2025, 1, 1), new Date(2027, 4, 1)),
    stack: ['Love language', 'care', 'dates', 'time'],
    desc: 'marrying my sunshine — my sweetest, prettiest, genius, one-in-∞ Bonnie ❤ love you more than Rust, more than a processor loves instructions, memory and electricity.',
  },
]
