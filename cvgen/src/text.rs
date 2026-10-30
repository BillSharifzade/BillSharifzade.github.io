//! The plain formats: CSV, Markdown and the terminal-styled text file.

use crate::cv::Cv;

// ---------------------------------------------------------------------------
// CSV — data only; there is nothing to style.
// ---------------------------------------------------------------------------

fn csv_escape(value: &str) -> String {
    if value.contains(['"', ',', '\n']) {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_owned()
    }
}

pub fn csv(cv: &Cv) -> String {
    let mut rows: Vec<[String; 3]> = Vec::new();
    let mut row = |a: &str, b: &str, c: &str| rows.push([a.into(), b.into(), c.into()]);

    row("Section", "Field", "Value");
    row("Profile", "Name", &cv.name);
    row("Profile", "Role", &cv.role);
    row("Profile", "Summary", &cv.summary);
    for c in &cv.contacts {
        row("Contact", &c.label, &c.value);
    }
    for s in &cv.skills {
        row("Skills", &s.cat, &s.list);
    }
    for exp in &cv.experience {
        row("Experience", &format!("{} · {}", exp.title, exp.company), &exp.date_line);
        row("Experience", "Description", &exp.desc);
        for (label, text) in &exp.bullets {
            row("Experience", label.strip_suffix(':').unwrap_or(label), text);
        }
    }
    for p in &cv.projects {
        row("Projects", &p.name, &p.stack);
        row("Projects", "Description", &p.desc);
        row("Projects", "Repository", &p.href);
    }
    for ed in &cv.education {
        row("Education", &format!("{} · {}", ed.degree, ed.school), &ed.meta);
    }
    for c in &cv.certifications {
        row("Certifications", &c.name, &c.line);
    }
    row("Extras", "Interests", &cv.interests);

    let body: Vec<String> = rows.iter().map(|r| r.iter().map(|v| csv_escape(v)).collect::<Vec<_>>().join(",")).collect();
    // The BOM makes Excel read the file as UTF-8 rather than the local code page.
    format!("\u{feff}{}", body.join("\r\n"))
}

// ---------------------------------------------------------------------------
// Markdown — kept purely semantic: it is the format most likely to be pasted
// into someone else's system, where decoration only gets in the way.
// ---------------------------------------------------------------------------

pub fn markdown(cv: &Cv) -> String {
    let mut lines: Vec<String> = Vec::new();
    let mut push = |s: String| lines.push(s);

    push(format!("# {}", cv.name));
    push(String::new());
    push(format!("**{}**", cv.role));
    push(String::new());
    push(cv.contacts.iter().map(|c| c.line.as_str()).collect::<Vec<_>>().join(" · "));
    push(String::new());
    push("## Summary".into());
    push(String::new());
    push(cv.summary.clone());
    push(String::new());
    push("## Core Stack".into());
    push(String::new());
    for s in &cv.skills {
        push(format!("- **{}:** {}", s.cat, s.list));
    }
    push(String::new());
    push("## Experience".into());
    push(String::new());
    for exp in &cv.experience {
        push(format!("### {} · {}", exp.title, exp.company));
        push(String::new());
        push(format!("*{}*", exp.date_line));
        push(String::new());
        push(exp.desc.clone());
        push(String::new());
        for (label, text) in &exp.bullets {
            push(format!("- **{label}** {text}"));
        }
        push(String::new());
    }
    push("## Selected Projects".into());
    push(String::new());
    for p in &cv.projects {
        push(format!("### [{}]({})", p.name, p.href));
        push(String::new());
        push(format!("*{}*", p.stack));
        push(String::new());
        push(p.desc.clone());
        push(String::new());
    }
    push("## Education".into());
    push(String::new());
    for ed in &cv.education {
        push(format!("### {} · {}", ed.degree, ed.school));
        push(String::new());
        push(format!("*{}*", ed.meta));
        push(String::new());
    }
    push("## Certifications".into());
    push(String::new());
    for c in &cv.certifications {
        push(format!("- {}", c.line));
    }
    push(String::new());
    push("## Interests".into());
    push(String::new());
    push(cv.interests.clone());
    push(String::new());
    lines.join("\n")
}

// ---------------------------------------------------------------------------
// Plain text — the one format that is *natively* the site's terminal: the
// same prompt as the social card, box-drawing rules, and › bullets, wrapped to
// a classic 78 columns so it reads the same in Notepad, less, or an email.
// ---------------------------------------------------------------------------

const COLS: usize = 78;

/// Columns a string occupies. Everything the CV prints is a single-width BMP
/// character, so this is its length in UTF-16 units, as the site counted it.
fn cols(s: &str) -> usize {
    s.encode_utf16().count()
}

fn wrap(text: &str, width: usize, indent: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut line = indent.to_owned();
    for word in text.split_whitespace() {
        let started = cols(&line) > cols(indent);
        if cols(&line) + cols(word) + usize::from(started) > width && started {
            out.push(std::mem::replace(&mut line, format!("{indent}{word}")));
        } else {
            if started {
                line.push(' ');
            }
            line.push_str(word);
        }
    }
    if cols(&line) > cols(indent) {
        out.push(line);
    }
    out
}

/// Wrap with a hanging indent: the marker on the first line, continuations indented under the text.
fn hang(text: &str, first: &str, rest: &str) -> Vec<String> {
    let mut lines = wrap(text, COLS, rest);
    if let Some(head) = lines.first_mut() {
        *head = format!("{first}{}", &head[rest.len()..]);
    }
    lines
}

fn rule(title: &str) -> String {
    let head = format!("── {} ", title.to_uppercase());
    let fill = COLS.saturating_sub(cols(&head));
    head + &"─".repeat(fill)
}

/// "Title · Company" on the left, the date flush right, on one line if it fits.
fn headline(left: &str, right: &str) -> Vec<String> {
    let gap = COLS as isize - cols(left) as isize - cols(right) as isize;
    if gap >= 2 {
        vec![format!("{left}{}{right}", " ".repeat(gap as usize))]
    } else {
        vec![left.to_owned(), format!("{}{right}", " ".repeat(COLS.saturating_sub(cols(right))))]
    }
}

pub fn txt(cv: &Cv) -> String {
    let mut lines: Vec<String> = vec![
        cv.prompt_line("whoami"),
        cv.name.clone(),
        String::new(),
        cv.prompt_line("cat role.txt"),
    ];
    lines.extend(wrap(&cv.role, COLS, ""));
    lines.push(String::new());
    lines.push(cv.prompt_line("cat contacts"));
    lines.extend(cv.contacts.iter().map(|c| format!("  {}", c.line)));
    lines.push(String::new());
    lines.push(rule("Summary"));
    lines.extend(wrap(&cv.summary, COLS, ""));
    lines.push(String::new());
    lines.push(rule("Core Stack"));
    for s in &cv.skills {
        lines.extend(hang(&format!("› {}: {}", s.cat, s.list), "  ", "    "));
    }
    lines.push(String::new());
    lines.push(rule("Experience"));
    for (i, exp) in cv.experience.iter().enumerate() {
        if i > 0 {
            lines.push(String::new());
        }
        lines.extend(headline(&format!("{} · {}", exp.title, exp.company), &exp.date_line));
        lines.extend(wrap(&exp.desc, COLS, "  "));
        for (label, text) in &exp.bullets {
            lines.extend(hang(&format!("› {label} {text}"), "  ", "    "));
        }
    }
    lines.push(String::new());
    lines.push(rule("Selected Projects"));
    for (i, p) in cv.projects.iter().enumerate() {
        if i > 0 {
            lines.push(String::new());
        }
        lines.extend(headline(&p.name, &p.repo_line));
        lines.extend(wrap(&p.stack, COLS, "  "));
        lines.extend(wrap(&p.desc, COLS, "  "));
    }
    lines.push(String::new());
    lines.push(rule("Education"));
    for ed in &cv.education {
        lines.extend(headline(&format!("{} · {}", ed.degree, ed.school), &ed.meta));
    }
    lines.push(String::new());
    lines.push(rule("Certifications"));
    lines.extend(cv.certifications.iter().map(|c| format!("  › {}", c.line)));
    lines.push(String::new());
    lines.push(rule("Interests"));
    lines.extend(wrap(&cv.interests, COLS, ""));
    lines.push(String::new());
    lines.join("\n")
}
