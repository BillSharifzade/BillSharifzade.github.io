import {
  siRust,
  siGraphql,
  siJson,
  siOpenapiinitiative,
  siPostgresql,
  siNextdotjs,
  siTelegram,
  siGo,
  siReact,
  siTypescript,
  siApachekafka,
  siC,
  siLinux,
  siDocker,
  siBun,
  siNatsdotio,
  siKotlin,
} from 'simple-icons'

const SOURCE = {
  siRust,
  siGraphql,
  siJson,
  siOpenapiinitiative,
  siPostgresql,
  siNextdotjs,
  siTelegram,
  siGo,
  siReact,
  siTypescript,
  siApachekafka,
  siC,
  siLinux,
  siDocker,
  siBun,
  siNatsdotio,
  siKotlin,
}

export const projectIcons = Object.fromEntries(
  Object.entries(SOURCE).map(([slug, icon]) => [slug, { title: icon.title, path: icon.path }])
)

export function resolveIcons(slugs = []) {
  return slugs.map((slug) => projectIcons[slug]).filter(Boolean)
}
