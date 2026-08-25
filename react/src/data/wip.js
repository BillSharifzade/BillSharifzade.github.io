// Projects currently in flight, rendered by the WipTerminal `wip` command.
// This is the file to edit when work starts or ships: cv.js keeps the finished
// record, this keeps the live one. `left: 'ongoing'` is fine for open-ended work.
export const wipProjects = [
  {
    name: 'smart-city-core',
    company: '4Byte · B2G',
    spent: '9 mo',
    left: '~3 mo',
    progress: 0.72,
    stack: ['Rust', 'Go', 'PostgreSQL', 'Redis', 'Grafana k6'],
    desc: 'Refactor of a state-owned Smart City platform — 50–70× latency and throughput gains, every change load-tested against production.',
  },
  {
    name: 'apiweave',
    company: 'personal · open source',
    spent: '7 mo',
    left: '~5 mo',
    progress: 0.58,
    stack: ['Rust', 'Tokio', 'proc-macros'],
    desc: 'One #[operation] served as REST, GraphQL, JSON-RPC, SOAP, WebSocket and SSE — one schema, one error taxonomy, zero codegen.',
  },
  {
    name: 'b2g-systems',
    company: 'Azal Telecommunications',
    spent: '8 mo',
    left: 'ongoing',
    progress: 0.45,
    stack: ['Architecture', 'Tech specs', 'Security audits'],
    desc: 'Designing enterprise and government-scale systems, auditing closed mission-critical software, training internal teams.',
  },
]
