// The PDF CV. cvgen serves the site's CV data to this template as /cv.json;
// everything about how it looks lives here.
//
// Every string from the data goes through text() as a plain string, never into
// markup, so a `*` or `#` in the CV prints as itself.

#let cv = json("/cv.json")
#let ink = cv.theme.color.pairs().map(((key, hex)) => (key, rgb("#" + hex))).to-dict()

// Line height as a multiple of the font size, the way the site's CSS measures
// it: the leading is split evenly around JetBrains Mono's own ascender
// (1.02em) and descender (0.30em).
#let lh(h) = {
  let half = (h - 1.32) / 2
  (top-edge: (1.02 + half) * 1em, bottom-edge: -(0.30 + half) * 1em)
}

#let t(body, size: 8.2pt, fill: ink.text, weight: "regular", h: 1.5, tracking: 0pt) = text(
  size: size,
  fill: fill,
  weight: weight,
  tracking: tracking,
  ..lh(h),
  body,
)

// A line (or wrapped lines) of its own.
#let line-of(..args) = block(t(..args))

// --- Glyphs -------------------------------------------------------------------

#let mark(width, height, paths, fill, size) = image(
  bytes(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + str(width) + " " + str(height) + "' fill='"
      + fill.to-hex() + "'>" + paths.map(d => "<path d='" + d + "'/>").join() + "</svg>",
  ),
  format: "svg",
  height: size,
)

// Inline marks sit centred on the text's line box, as the site's flex rows
// centre them: that centre is 0.36em above the baseline.
#let inline(body, size, text-size) = box(baseline: size / 2 - 0.36 * text-size, body)

// A Font Awesome glyph from the CV set, sized by its height.
#let glyph(name, size: 8pt, fill: ink.dim) = {
  let i = cv.icons.at(name)
  mark(i.w, i.h, (i.d,), fill, size)
}

#let signal-mark(size: 8pt, fill: ink.dim) = mark(cv.signal.width, cv.signal.height, cv.signal.paths, fill, size)

// A simple-icons brand mark (always a 24×24 box).
#let brand(path, size: 7.5pt, fill: ink.muted) = mark(24, 24, (path,), fill, size)

#let contact-glyphs = (
  Location: "location-dot",
  Email: "envelope",
  Telegram: "telegram",
  GitHub: "github",
  LinkedIn: "linkedin",
  Website: "globe",
)

#let contact-icon(label) = if label == "Signal" { signal-mark() } else if label in contact-glyphs {
  glyph(contact-glyphs.at(label))
}

// --- Page -------------------------------------------------------------------

#let email = cv.contacts.find(c => c.label == "Email").value
#let site = cv.contacts.find(c => c.label == "Website").value

#set document(title: cv.name + " - CV", author: cv.name, description: "Curriculum Vitae")
#set text(font: cv.theme.font, size: 8.2pt, fill: ink.text, lang: "en", ..lh(1.5))
#set par(leading: 0pt, spacing: 0pt)
#set block(spacing: 0pt)

#set page(
  paper: "a4",
  margin: (top: 40pt, bottom: 48pt, x: 44pt),
  fill: ink.bg,
  foreground: context {
    let foot(body) = text(size: 6.8pt, fill: ink.dim, ..lh(1.32), body)
    let at = counter(page).get().first()
    let total = counter(page).final().first()
    place(bottom + left, dx: 44pt, dy: -36pt, rect(width: 100% - 88pt, height: 1pt, fill: ink.rule, stroke: none))
    place(bottom + left, dx: 44pt, dy: -22pt, foot(cv.name + " · " + email))
    place(bottom + right, dx: -44pt, dy: -22pt, foot(site + " · " + str(at) + "/" + str(total)))
  },
)

// `bill@coolest_website:~$ cmd`, coloured the way the site's terminal does it.
#let prompt(cmd) = {
  let p = cv.theme.prompt
  let seg(s, fill, weight: "regular") = text(fill: fill, weight: weight, s)
  pad(bottom: 1pt, block(text(size: 7.4pt, ..lh(1.32), {
    seg(p.user, ink.ok)
    seg("@", ink.dim)
    seg(p.host, ink.ok)
    seg(":", ink.dim)
    seg(p.path, ink.dir, weight: "bold")
    seg("$ " + cmd, ink.text)
  })))
}

// A section heading stays with whatever follows it.
#let section(title, icon) = block(sticky: true, pad(top: 15pt, bottom: 7pt, grid(
  columns: (auto, auto, 1fr),
  column-gutter: (6pt, 10pt),
  align: horizon,
  glyph(icon, size: 8pt, fill: ink.ok),
  t(upper(title), size: 7.8pt, weight: "bold", fill: ink.white, tracking: 1.4pt),
  rect(width: 100%, height: 1pt, fill: ink.rule, stroke: none),
)))

#let marker(body, size: 7.8pt) = grid(
  columns: (9pt, 1fr),
  t("›", size: 8pt, fill: ink.ok, weight: "bold", h: 1.32),
  t(body, size: size),
)

// Two columns, each with a gutter on its right.
#let two-up(cells, bottom) = grid(columns: (1fr, 1fr), ..cells.map(c => pad(right: 14pt, bottom: bottom, c)))

// --- Header -----------------------------------------------------------------

#prompt("whoami")
#pad(bottom: 6pt, line-of(cv.name, size: 22pt, weight: 800, fill: ink.white, h: 1.2, tracking: -0.4pt))
#prompt("cat role.txt")
#pad(bottom: 10pt, line-of(cv.role, size: 8.6pt, weight: "bold", fill: ink.accent, h: 1.4))

#pad(top: 2pt, block({
  set par(leading: 4pt)
  set text(size: 7.2pt, fill: ink.muted)
  cv
    .contacts
    .map(c => {
      let label = if c.href != none { link(c.href, c.value) } else { c.line }
      box({
        inline(contact-icon(c.label), 8pt, 7.2pt)
        h(4pt)
        label
      })
    })
    .join(h(12pt, weak: true) + sym.zws)
}))
#pad(top: 12pt, rect(width: 100%, height: 1pt, fill: ink.rule, stroke: none))

// --- Body -------------------------------------------------------------------

#section("Summary", "terminal")
#line-of(cv.summary)

#section("Core Stack", "layer-group")
#two-up(
  cv.skills.map(s => {
    line-of(s.cat, size: 8pt, weight: "bold", fill: ink.white)
    pad(top: 1pt, line-of(s.list, size: 7.6pt, fill: ink.muted))
  }),
  6pt,
)

#section("Experience", "briefcase")
#for exp in cv.experience {
  pad(bottom: 11pt, {
    // The heading and description never split, and stay with the first bullet.
    block(breakable: false, sticky: true, {
      block(t(size: 8.8pt, weight: "bold", fill: ink.white, {
        exp.title + " "
        text(fill: ink.accent, "· " + exp.company)
        h(1fr)
        h(12pt)
        text(size: 7pt, weight: "regular", fill: ink.dim, exp.dateLine)
      }))
      pad(top: 2pt, bottom: 3pt, line-of(exp.desc, size: 7.8pt, fill: ink.muted))
    })
    for (label, body) in exp.bullets {
      block(breakable: false, pad(top: 2pt, right: 4pt, marker({
        text(weight: "bold", fill: ink.white, label + " ")
        body
      })))
    }
  })
}

#section("Selected Projects", "diagram-project")
#for p in cv.projects {
  pad(bottom: 10pt, block(breakable: false, {
    block(t(size: 8.6pt, {
      text(weight: "bold", fill: ink.white, p.name)
      h(6pt)
      for path in p.icons {
        inline(brand(path), 7.5pt, 8.6pt)
        h(3pt)
      }
      h(1fr)
      h(12pt)
      link(p.href, text(size: 7pt, fill: ink.dir, p.repoLine))
    }))
    pad(top: 2pt, line-of(p.stack, size: 7.4pt, fill: ink.accent))
    pad(top: 2pt, line-of(p.desc, size: 7.8pt))
  }))
}

#section("Education", "graduation-cap")
#for ed in cv.education {
  pad(bottom: 6pt, block(breakable: false, {
    line-of(size: 8.6pt, weight: "bold", fill: ink.white, {
      ed.degree + " "
      text(fill: ink.accent, "· " + ed.school)
    })
    pad(top: 1pt, line-of(ed.meta, size: 7pt, fill: ink.dim))
  }))
}

#section("Certifications", "award")
#two-up(cv.certifications.map(c => block(breakable: false, marker(c.line, size: 7.6pt))), 3pt)

#section("Interests", "heart")
#line-of(cv.interests, size: 7.8pt, fill: ink.muted)
