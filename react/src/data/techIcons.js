import {
  siRust,
  siReact,
  siNextdotjs,
  siDocker,
  siLinux,
  siPostgresql,
  siApachekafka,
  siGitlab,
} from 'simple-icons'

// The "Current Stack" cards, first on top. Holding a card turns its logo into
// `headline` and `detail`: what the technology is best at, in a few words.
export const techIcons = [
  { title: 'Rust', slug: 'rust', path: siRust.path, headline: 'Fearless', detail: 'Memory safety with no garbage collector, at the speed of C.' },
  { title: 'React', slug: 'react', path: siReact.path, headline: 'Declarative', detail: 'Interfaces as a function of state, from web to native.' },
  { title: 'Next.js', slug: 'nextdotjs', path: siNextdotjs.path, headline: 'Full-stack', detail: 'Server rendering, routing and the edge in one framework.' },
  { title: 'Docker', slug: 'docker', path: siDocker.path, headline: 'Portable', detail: 'The same image from a laptop to production, byte for byte.' },
  { title: 'Linux', slug: 'linux', path: siLinux.path, headline: 'Control', detail: 'Every layer open to tune, right down to the kernel.' },
  { title: 'PostgreSQL', slug: 'postgresql', path: siPostgresql.path, headline: 'Integrity', detail: 'ACID transactions and rich SQL you can trust with money.' },
  { title: 'Kafka', slug: 'apachekafka', path: siApachekafka.path, headline: 'Throughput', detail: 'A durable log streaming millions of events between services.' },
  { title: 'GitLab', slug: 'gitlab', path: siGitlab.path, headline: 'Automated', detail: 'Pipelines that test, build and ship every single commit.' },
]
