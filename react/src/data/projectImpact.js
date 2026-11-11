// What each selected project has done, for the "Impact" view of its window
// (components/ProjectImpact.jsx). Keyed by repo. Site only: the CV exports
// read cv.js, never this file.
//
// Six cells per project, laid out as
//   hero hero wide  wide
//   hero hero small small
//   wide wide wide  wide
// and filled in order. Kinds:
//   metric    a number that counts up: prefix, value, suffix, note
//   dots      a count drawn as dots (one per unit, up to 30), with its figure
//   fact      a short statement: title, note
//   flow      steps in order
//   lock      something the owner keeps private
//   potential a status, with a line that leaves the chart
//   fanout    one source spreading into several targets
//   stack     the project's logos (taken from the project itself)
export const projectImpact = {
  HR_Progress: [
    { kind: 'metric', label: 'Revenue', prefix: '$', value: 35, suffix: 'k+', note: 'every month', icon: 'chart-line', grid: true },
    { kind: 'dots', label: 'In use at', count: 25, figure: '25+', note: 'companies', icon: 'building' },
    { kind: 'fact', label: 'Scoring', title: 'Many assessors', note: 'per review', icon: 'users' },
    { kind: 'fact', label: 'Growth', title: 'Mentors matched', note: 'to every plan', icon: 'seedling' },
    { kind: 'flow', label: 'How it works', steps: ['Assess', 'Gaps', 'Plan', 'Mentor', 'Track'] },
    { kind: 'stack', label: 'Built with' },
  ],
  'Rust-Screenx-HR-Automatization': [
    { kind: 'metric', label: 'Revenue', prefix: '$', value: 10, suffix: 'k+', note: 'every month', icon: 'chart-line', grid: true },
    { kind: 'dots', label: 'In use at', count: 10, figure: '10+', note: 'companies', icon: 'building' },
    { kind: 'fact', label: 'Screening', title: 'AI-written tests', note: 'for every candidate', icon: 'microchip' },
    { kind: 'fact', label: 'Channels', title: 'ERP, bot, Mini App', note: 'one pipeline', icon: 'telegram' },
    { kind: 'flow', label: 'Candidate journey', steps: ['Register', 'AI test', 'Scored', 'Hire'] },
    { kind: 'stack', label: 'Built with' },
  ],
  tek: [
    { kind: 'metric', label: 'Used by', value: 1000, suffix: '+', note: 'electricians', grid: true, icon: 'users' },
    { kind: 'lock', label: 'Revenue', title: 'Private', note: 'The company keeps its figures closed.' },
    { kind: 'fact', label: 'Catalogue', title: '~30k rps', note: 'p99 14 ms', icon: 'gauge-high' },
    { kind: 'fact', label: 'Product page', title: '~47k rps', note: 'p99 3 ms', icon: 'bolt' },
    { kind: 'flow', label: 'An order', steps: ['Price per account', 'Cart', 'Invoice', '1C reserve', 'CRM'] },
    { kind: 'stack', label: 'Built with' },
  ],
  // From mintaka_web's production benchmark (bench/results/2026-10-30-koinot-dyu-1.md:
  // the server's own time per request, p99 27–47 µs) and the site's build budgets.
  mintaka_web: [
    { kind: 'metric', label: 'Server time', prefix: '< ', value: 50, suffix: ' µs', note: 'per request, p99 at 4,000 req/s', icon: 'gauge-high', grid: true },
    { kind: 'fact', label: 'The lab', title: 'Dushanbe, routed live', note: 'Dijkstra and A* across 8,393 intersections, in your browser', icon: 'globe' },
    { kind: 'fact', label: 'Third parties', title: '0', note: 'requests, trackers or cookies', icon: 'shield-alt' },
    { kind: 'fact', label: 'First screen', title: '< 14 kB', note: 'compressed; the build enforces it', icon: 'bolt' },
    { kind: 'flow', label: 'Every project', steps: ['Measure', 'Build', 'Prove'] },
    { kind: 'stack', label: 'Built with' },
  ],
  payment_system: [
    { kind: 'potential', label: 'Status', status: 'Alpha', title: 'Potential', note: 'beyond the usual scale, in money and in people' },
    { kind: 'fact', label: 'Money', title: 'No floats, ever', note: 'integer minor units', icon: 'scale-balanced' },
    { kind: 'fact', label: 'Load test', title: '~3,200 tx/s', note: 'p99 95 ms, 0 errors', icon: 'gauge-high' },
    { kind: 'fact', label: 'Audit', title: 'Merkle + Ed25519', note: 'tamper-evident', icon: 'shield-alt' },
    { kind: 'flow', label: 'Pay with a fingerprint', steps: ['Enrol once', 'Open a check', 'Touch', 'Match', 'Posted'] },
    { kind: 'stack', label: 'Built with' },
  ],
  'rs-apilib': [
    { kind: 'metric', label: 'Used by', value: 239, note: 'developers, free', grid: true, icon: 'users' },
    {
      kind: 'fanout',
      label: 'One handler',
      source: '#[operation]',
      targets: ['REST', 'GraphQL', 'JSON-RPC', 'SOAP', 'WebSocket', 'SSE'],
    },
    { kind: 'fact', label: 'Open source', title: '$0', note: 'to help people build backends', icon: 'heart' },
    { kind: 'fact', label: 'Build', title: '61 crates', note: 'zero *-sys deps', icon: 'cubes' },
    { kind: 'fact', label: 'Also generates', title: 'GraphQL, WSDL, OpenAPI 3.1', note: 'hand-written GraphQL parser, SDL and introspection', icon: 'sitemap' },
    { kind: 'stack', label: 'Built with' },
  ],
}
