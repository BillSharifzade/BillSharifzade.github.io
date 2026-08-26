// Projects currently in flight, rendered by the WipTerminal `wip` command.
// This is the file to edit when work starts or ships: cv.js keeps the finished
// record, this keeps the live one. `left: 'ongoing'` is fine for open-ended
// work. `special: true` gets the pink treatment in wipLines() — reserved for
// exactly one project.
export const wipProjects = [
  {
    name: 'kernel',
    company: '4Byte · payment systems',
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
    spent: '18 mo',
    left: '~9 mo',
    progress: 0.67,
    stack: ['Love language', 'care', 'dates', 'time'],
    desc: 'marrying my sunshine — my sweetest, prettiest, genius, one-in-∞ Bonnie ❤ love you more than Rust, more than a processor loves instructions, memory and electricity.',
  },
]
