#!/usr/bin/env node
/**
 * strip-comments.mjs — remove comments from JS/JSX/TS/CSS/HTML sources
 * without changing anything else (formatting, strings, code).
 *
 * Usage:
 *   node scripts/strip-comments.mjs [paths...] [--dry] [--all]
 *
 *   paths   files or directories (default: ../src and ../index.html
 *           relative to this script, i.e. the react app)
 *   --dry   only report what would change, write nothing
 *   --all   also remove "functional" comments (eslint/ts/vite directives,
 *           /*! licenses, #__PURE__, ...) — kept by default because
 *           removing them can change behavior
 *
 * Safety:
 *   - JS/JSX/TS are parsed with @babel/parser; comments are removed by their
 *     exact byte ranges from the AST, so strings/regexes/JSX are never touched.
 *   - After stripping, the result is re-parsed and its token stream is
 *     compared to the original's. Any mismatch -> file is skipped, not broken.
 *   - CSS is scanned with a tokenizer that respects strings and url(...).
 */

import { parse } from '@babel/parser'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const ALL = args.includes('--all')
const inputs = args.filter((a) => !a.startsWith('--'))
if (inputs.length === 0) {
  inputs.push(path.join(__dirname, '..', 'src'), path.join(__dirname, '..', 'index.html'))
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'vendor', 'coverage'])
const JS_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'])
const CSS_EXT = new Set(['.css'])
const HTML_EXT = new Set(['.html', '.htm'])

// Comments whose removal can change behavior — kept unless --all.
const KEEP_RE =
  /^\s*(!|eslint|global\s|globals\s|jshint|jslint|@ts-|@vite-|@jsx|@license|@preserve|@copyright|istanbul\s|c8\s|v8\s|node:coverage|prettier-ignore|biome-ignore|webpack[A-Z]|#__|@__|#\s*source(Mapping)?URL|@refresh|<reference\s)/

const isKept = (value) => !ALL && KEEP_RE.test(value)

function babelOptions(ext, withTokens) {
  const plugins = []
  if (ext === '.ts' || ext === '.mts' || ext === '.cts') plugins.push('typescript')
  else if (ext === '.tsx') plugins.push('typescript', 'jsx')
  else plugins.push('jsx')
  return {
    sourceType: 'unambiguous',
    plugins,
    tokens: withTokens,
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  }
}

// Find {/* ... */} — JSX expression containers holding only comments —
// so the whole container can be removed, not just its insides.
function findEmptyJsxContainers(node, out) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) findEmptyJsxContainers(item, out)
    return
  }
  if (node.type === 'JSXExpressionContainer' && node.expression?.type === 'JSXEmptyExpression') {
    out.push(node)
  }
  for (const key of Object.keys(node)) {
    if (key === 'loc') continue
    findEmptyJsxContainers(node[key], out)
  }
}

// Find blocks with no statements ({ } of an empty catch, function, etc.).
// A comment that is a block's only content stays — removing it would raise
// eslint's no-empty and lose the explanation of why the block is empty.
function findEmptyBlocks(node, out) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) findEmptyBlocks(item, out)
    return
  }
  if ((node.type === 'BlockStatement' || node.type === 'StaticBlock') && node.body.length === 0) {
    out.push(node)
  }
  for (const key of Object.keys(node)) {
    if (key === 'loc') continue
    findEmptyBlocks(node[key], out)
  }
}

const isWordChar = (ch) => ch !== undefined && /[A-Za-z0-9_$]/.test(ch)

// Remove [start, end) ranges from source, cleaning up the lines they leave
// behind: a line that becomes blank disappears entirely; a trailing comment
// takes its preceding inline whitespace with it.
function spliceRanges(source, ranges) {
  ranges.sort((a, b) => b.start - a.start)
  let out = source
  let prevStart = Infinity
  for (const { start, end } of ranges) {
    if (end > prevStart) continue // overlap guard
    prevStart = start
    const lineStart = out.lastIndexOf('\n', start - 1) + 1
    let lineEnd = out.indexOf('\n', end)
    if (lineEnd === -1) lineEnd = out.length
    const before = out.slice(lineStart, start)
    const after = out.slice(end, lineEnd)
    if (/^\s*$/.test(before) && /^\s*$/.test(after)) {
      // comment (possibly multi-line) owned its line(s): drop them whole
      out = out.slice(0, lineStart) + out.slice(Math.min(lineEnd + 1, out.length))
    } else if (/^\s*$/.test(after)) {
      // trailing comment: drop it and the spaces before it
      const trimmed = before.replace(/\s+$/, '')
      out = out.slice(0, lineStart) + trimmed + out.slice(lineEnd)
    } else {
      // comment in the middle of code: absorb inline whitespace on one
      // side, and keep a space if removal would glue two tokens (`a/* */b`)
      let s = start
      let e = end
      if (/^\s*$/.test(before)) {
        while (e < lineEnd && (out[e] === ' ' || out[e] === '\t')) e++
      } else {
        while (s > lineStart && (out[s - 1] === ' ' || out[s - 1] === '\t')) s--
      }
      const glue = isWordChar(out[s - 1]) && isWordChar(out[e]) ? ' ' : ''
      out = out.slice(0, s) + glue + out.slice(e)
    }
  }
  return out
}

// Canonical token stream for before/after equivalence. Ignores comments,
// tokens belonging to removed {/* */} containers, and whitespace-only JSX
// text that spans lines (elided by JSX semantics; merges when a comment
// line between elements disappears).
const tokenStream = (ast, dropRanges = []) =>
  ast.tokens
    .filter((t) => t.type !== 'CommentLine' && t.type !== 'CommentBlock')
    .filter((t) => !dropRanges.some((r) => t.start >= r.start && t.end <= r.end))
    .filter((t) => !((t.type.label ?? t.type) === 'jsxText' && /^\s*$/.test(t.value) && t.value.includes('\n')))
    .map((t) => `${t.type.label ?? t.type} ${t.value ?? ''}`)
    .join('\n')

function stripJs(source, ext) {
  const opts = babelOptions(ext, true)
  const ast = parse(source, opts)
  const comments = ast.comments ?? []
  if (comments.length === 0) return { out: source, removed: 0 }

  const containers = []
  findEmptyJsxContainers(ast.program, containers)
  const emptyBlocks = []
  findEmptyBlocks(ast.program, emptyBlocks)
  const inEmptyBlock = (cm) => emptyBlocks.some((b) => cm.start > b.start && cm.end < b.end)

  const ranges = []
  const consumed = new Set()
  let removed = 0

  for (const c of containers) {
    const inside = comments.filter((cm) => cm.start > c.start && cm.end < c.end)
    if (inside.length > 0 && inside.every((cm) => !isKept(cm.value))) {
      ranges.push({ start: c.start, end: c.end })
      inside.forEach((cm) => consumed.add(cm))
      removed += inside.length
    }
  }
  for (const cm of comments) {
    if (consumed.has(cm) || isKept(cm.value) || inEmptyBlock(cm)) continue
    ranges.push({ start: cm.start, end: cm.end })
    removed++
  }
  if (removed === 0) return { out: source, removed: 0 }

  const out = spliceRanges(source, ranges)

  // Equivalence check: the stripped file must produce the exact same
  // token stream as the original (comments aside).
  const containerRanges = ranges.filter((r) => !comments.some((cm) => cm.start === r.start && cm.end === r.end))
  const reparsed = parse(out, opts)
  if (tokenStream(reparsed) !== tokenStream(ast, containerRanges)) {
    throw new Error('token stream changed after stripping — file left untouched')
  }
  return { out, removed }
}

function stripCss(source) {
  const ranges = []
  let i = 0
  const n = source.length
  while (i < n) {
    const ch = source[i]
    if (ch === '"' || ch === "'") {
      i++
      while (i < n && source[i] !== ch) i += source[i] === '\\' ? 2 : 1
      i++
    } else if (source.startsWith('url(', i)) {
      i += 4
      while (i < n && source[i] !== ')') {
        const q = source[i]
        if (q === '"' || q === "'") {
          i++
          while (i < n && source[i] !== q) i += source[i] === '\\' ? 2 : 1
        }
        i++
      }
    } else if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? n : end + 2
      if (!isKept(source.slice(i + 2, stop - 2))) ranges.push({ start: i, end: stop })
      i = stop
    } else {
      i++
    }
  }
  return { out: spliceRanges(source, ranges), removed: ranges.length }
}

function stripHtml(source) {
  const ranges = []
  let i = 0
  const n = source.length
  while (i < n) {
    // leave <script>/<style> bodies alone — they are not HTML
    const raw = /^<(script|style)\b/i.exec(source.slice(i, i + 8))
    if (raw) {
      const close = source.toLowerCase().indexOf(`</${raw[1].toLowerCase()}`, i)
      i = close === -1 ? n : close + 3
    } else if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4)
      const stop = end === -1 ? n : end + 3
      // keep conditional comments, just in case
      if (!/^<!--\s*\[/.test(source.slice(i, i + 12))) ranges.push({ start: i, end: stop })
      i = stop
    } else {
      i++
    }
  }
  return { out: spliceRanges(source, ranges), removed: ranges.length }
}

async function collectFiles(entry, out) {
  const stat = await fs.stat(entry)
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(entry))) return
    for (const name of await fs.readdir(entry)) await collectFiles(path.join(entry, name), out)
  } else {
    const ext = path.extname(entry).toLowerCase()
    if (entry.includes('.min.')) return
    if (JS_EXT.has(ext) || CSS_EXT.has(ext) || HTML_EXT.has(ext)) out.push(entry)
  }
}

const files = []
for (const input of inputs) {
  try {
    await collectFiles(path.resolve(input), files)
  } catch {
    console.error(`skip: ${input} (not found)`)
  }
}

let changedFiles = 0
let totalRemoved = 0
let savedBytes = 0
const failures = []

for (const file of files) {
  const source = await fs.readFile(file, 'utf8')
  const ext = path.extname(file).toLowerCase()
  let result
  try {
    if (JS_EXT.has(ext)) result = stripJs(source, ext)
    else if (CSS_EXT.has(ext)) result = stripCss(source)
    else result = stripHtml(source)
  } catch (err) {
    failures.push(`${file}: ${err.message}`)
    continue
  }
  if (result.removed === 0 || result.out === source) continue
  changedFiles++
  totalRemoved += result.removed
  savedBytes += source.length - result.out.length
  const rel = path.relative(process.cwd(), file)
  console.log(`${DRY ? '[dry] ' : ''}${rel}: -${result.removed} comment${result.removed === 1 ? '' : 's'} (${source.length - result.out.length} bytes)`)
  if (!DRY) await fs.writeFile(file, result.out)
}

console.log(
  `\n${DRY ? 'Would remove' : 'Removed'} ${totalRemoved} comments from ${changedFiles} files (${(savedBytes / 1024).toFixed(1)} KB)` +
    (ALL ? '' : ' — directives (eslint/ts/license/PURE) kept; use --all to remove those too'),
)
if (failures.length > 0) {
  console.error(`\nSkipped (could not strip safely):`)
  for (const f of failures) console.error(`  ${f}`)
  process.exitCode = 1
}
