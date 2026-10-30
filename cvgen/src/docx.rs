//! DOCX — WordprocessingML written directly.
//!
//! The document is fixed, so a handful of XML templates covers it; a DOCX
//! crate would add a dependency tree for features this never uses (and none
//! of them write `w:background`, which the dark page needs).

use std::collections::HashMap;
use std::fmt::Write as _;
use std::io::{Cursor, Write};

use zip::write::SimpleFileOptions;

use crate::cv::{Contact, Cv};
use crate::icons;

/// Half-points, as Word counts font sizes.
const fn pt(n: f64) -> u32 {
    (n * 2.0 + 0.5) as u32
}

/// A4 in twentieths of a point, and the margins the page uses.
const PAGE_W: u32 = 11906;
const PAGE_H: u32 = 16838;
const MARGIN_X: u32 = 1000;
/// The right edge of the text column, for right-aligned tab stops.
const RIGHT: u32 = PAGE_W - 2 * MARGIN_X;

/// EMUs per CSS pixel, the unit image sizes are given in.
const EMU_PER_PX: f64 = 9525.0;

const NS: &str = concat!(
    r#"xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" "#,
    r#"xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" "#,
    r#"xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" "#,
    r#"xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" "#,
    r#"xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture""#
);

const REL: &str = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

/// Run formatting: colour, size and weight are all the CV varies.
#[derive(Clone, Copy)]
struct Fmt<'a> {
    color: &'a str,
    size: u32,
    bold: bool,
    /// Letter spacing in twentieths of a point.
    spacing: i32,
}

impl Fmt<'_> {
    fn xml(&self) -> String {
        let mut x = String::from("<w:rPr>");
        if self.bold {
            x.push_str("<w:b/><w:bCs/>");
        }
        let _ = write!(x, r#"<w:color w:val="{}"/>"#, self.color);
        if self.spacing != 0 {
            let _ = write!(x, r#"<w:spacing w:val="{}"/>"#, self.spacing);
        }
        let _ = write!(x, r#"<w:sz w:val="{0}"/><w:szCs w:val="{0}"/></w:rPr>"#, self.size);
        x
    }
}

#[derive(Default)]
struct Para {
    before: Option<u32>,
    after: Option<u32>,
    keep_next: bool,
    /// `(left, hanging)` indent.
    hang: Option<(u32, u32)>,
    /// Hairline under (or, for the footer, over) the paragraph: `(space)`.
    rule_below: Option<u32>,
    rule_above: Option<u32>,
    /// `(alignment, position)` tab stops.
    tabs: Vec<(&'static str, u32)>,
    body: String,
}

impl Para {
    fn xml(&self, rule_color: &str) -> String {
        let mut p = String::from("<w:p><w:pPr>");
        if self.keep_next {
            p.push_str("<w:keepNext/>");
        }
        if self.rule_above.is_some() || self.rule_below.is_some() {
            p.push_str("<w:pBdr>");
            let mut edge = |side: &str, space: Option<u32>| {
                if let Some(space) = space {
                    let _ = write!(p, r#"<w:{side} w:val="single" w:sz="6" w:space="{space}" w:color="{rule_color}"/>"#);
                }
            };
            edge("top", self.rule_above);
            edge("bottom", self.rule_below);
            p.push_str("</w:pBdr>");
        }
        if !self.tabs.is_empty() {
            p.push_str("<w:tabs>");
            for (val, pos) in &self.tabs {
                let _ = write!(p, r#"<w:tab w:val="{val}" w:pos="{pos}"/>"#);
            }
            p.push_str("</w:tabs>");
        }
        if self.before.is_some() || self.after.is_some() {
            p.push_str("<w:spacing");
            if let Some(b) = self.before {
                let _ = write!(p, r#" w:before="{b}""#);
            }
            if let Some(a) = self.after {
                let _ = write!(p, r#" w:after="{a}""#);
            }
            p.push_str("/>");
        }
        if let Some((left, hanging)) = self.hang {
            let _ = write!(p, r#"<w:ind w:left="{left}" w:hanging="{hanging}"/>"#);
        }
        p.push_str("</w:pPr>");
        p.push_str(&self.body);
        p.push_str("</w:p>");
        p
    }
}

/// Collects the parts that the paragraphs refer to: link targets and images.
struct Package<'a> {
    cv: &'a Cv,
    rels: Vec<(String, &'static str, String, bool)>,
    media: Vec<(String, Vec<u8>)>,
    icons: HashMap<String, Option<(String, u64, u64)>>,
    drawings: u32,
}

impl<'a> Package<'a> {
    fn rel(&mut self, kind: &'static str, target: String, external: bool) -> String {
        let id = format!("rId{}", self.rels.len() + 1);
        self.rels.push((id.clone(), kind, target, external));
        id
    }

    fn fmt(&self, color: &'a str, size: f64) -> Fmt<'a> {
        Fmt { color, size: pt(size), bold: false, spacing: 0 }
    }

    // The run helpers mirror the site's terminal palette.
    fn base(&self) -> Fmt<'a> {
        self.fmt(&self.cv.theme.color.text, 8.5)
    }

    fn run(&self, text: &str, f: Fmt) -> String {
        format!(r#"<w:r>{}<w:t xml:space="preserve">{}</w:t></w:r>"#, f.xml(), esc(text))
    }

    fn text(&self, text: &str) -> String {
        self.run(text, self.base())
    }

    fn white(&self, text: &str, size: f64) -> String {
        let f = Fmt { bold: true, ..self.fmt(&self.cv.theme.color.white, size) };
        self.run(text, f)
    }

    fn accent(&self, text: &str, size: f64, bold: bool) -> String {
        let f = Fmt { bold, ..self.fmt(&self.cv.theme.color.accent, size) };
        self.run(text, f)
    }

    fn muted(&self, text: &str, size: f64) -> String {
        self.run(text, self.fmt(&self.cv.theme.color.muted, size))
    }

    fn dim(&self, text: &str) -> String {
        self.run(text, self.fmt(&self.cv.theme.color.dim, 7.0))
    }

    fn marker(&self) -> String {
        let f = Fmt { bold: true, ..self.fmt(&self.cv.theme.color.ok, 8.5) };
        self.run("› ", f)
    }

    fn link(&mut self, text: &str, href: &str, size: f64) -> String {
        let id = self.rel("hyperlink", href.to_owned(), true);
        let run = self.run(text, self.fmt(&self.cv.theme.color.dir, size));
        format!(r#"<w:hyperlink r:id="{id}" w:history="1">{run}</w:hyperlink>"#)
    }

    fn field(&self, instr: &str) -> String {
        let f = self.fmt(&self.cv.theme.color.dim, 7.0).xml();
        format!(
            r#"<w:r>{f}<w:fldChar w:fldCharType="begin"/></w:r><w:r>{f}<w:instrText xml:space="preserve"> {instr} </w:instrText></w:r><w:r>{f}<w:fldChar w:fldCharType="separate"/></w:r><w:r>{f}<w:t>1</w:t></w:r><w:r>{f}<w:fldChar w:fldCharType="end"/></w:r>"#
        )
    }

    /// An inline picture of a glyph, followed by `gap` in body text. Word
    /// treats an image as a break opportunity, so the gap is a no-break space
    /// where the glyph must stay with its label.
    fn picture(&mut self, key: String, paths: &[&str], view: (f64, f64), px: f64, color: &str, gap: &str) -> String {
        let id = format!("{key}|{px}|{color}");
        if !self.icons.contains_key(&id) {
            let entry = icons::png(view.0, view.1, paths, color, px).map(|png| {
                let name = format!("image{}.png", self.media.len() + 1);
                self.media.push((name.clone(), png.data));
                let rid = self.rel("image", format!("media/{name}"), false);
                (rid, (png.width * EMU_PER_PX).round() as u64, (png.height * EMU_PER_PX).round() as u64)
            });
            self.icons.insert(id.clone(), entry);
        }
        let Some((rid, cx, cy)) = self.icons[&id].clone() else { return String::new() };
        self.drawings += 1;
        let n = self.drawings;
        format!(
            concat!(
                r#"<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">"#,
                r#"<wp:extent cx="{cx}" cy="{cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>"#,
                r#"<wp:docPr id="{n}" name="Icon {n}"/>"#,
                r#"<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>"#,
                r#"<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">"#,
                r#"<pic:pic><pic:nvPicPr><pic:cNvPr id="{n}" name="Icon {n}"/><pic:cNvPicPr/></pic:nvPicPr>"#,
                r#"<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>"#,
                r#"<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>"#,
                r#"<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>"#,
                r#"</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>{gap}"#
            ),
            cx = cx,
            cy = cy,
            n = n,
            rid = rid,
            gap = self.text(gap),
        )
    }

    /// A Font Awesome glyph from the CV set (or Signal's mark).
    fn icon(&mut self, name: &str, px: f64, color: &str) -> String {
        let cv = self.cv;
        if name == "signal" {
            let paths: Vec<&str> = cv.signal.paths.iter().map(String::as_str).collect();
            return self.picture(name.into(), &paths, (cv.signal.width, cv.signal.height), px, color, "\u{a0}");
        }
        match cv.icons.get(name) {
            Some(i) => self.picture(name.into(), &[&i.d], (i.w, i.h), px, color, "\u{a0}"),
            None => String::new(),
        }
    }

    /// A simple-icons brand mark (always a 24×24 box).
    fn brand(&mut self, path: &str, px: f64, color: &str) -> String {
        let key = format!("brand|{}", &path[..path.len().min(40)]);
        self.picture(key, &[path], (24.0, 24.0), px, color, " ")
    }
}

fn contact_glyph(label: &str) -> &'static str {
    match label {
        "Location" => "location-dot",
        "Email" => "envelope",
        "Telegram" => "telegram",
        "Signal" => "signal",
        "GitHub" => "github",
        "LinkedIn" => "linkedin",
        "Website" => "globe",
        _ => "",
    }
}

pub fn build(cv: &Cv) -> zip::result::ZipResult<Vec<u8>> {
    let c = &cv.theme.color;
    let mut pk = Package { cv, rels: Vec::new(), media: Vec::new(), icons: HashMap::new(), drawings: 0 };
    pk.rel("styles", "styles.xml".into(), false);
    pk.rel("settings", "settings.xml".into(), false);
    pk.rel("fontTable", "fontTable.xml".into(), false);
    let footer_rel = pk.rel("footer", "footer1.xml".into(), false);

    let mut body: Vec<Para> = Vec::new();
    let right_tab = || vec![("right", RIGHT)];

    // `bill@coolest_website:~$ cmd`, coloured like the site's terminal.
    let prompt = |pk: &Package, cmd: &str| {
        let p = &cv.theme.prompt;
        let f = |color| pk.fmt(color, 7.5);
        Para {
            after: Some(20),
            body: [
                pk.run(&p.user, f(&c.ok)),
                pk.run("@", f(&c.dim)),
                pk.run(&p.host, f(&c.ok)),
                pk.run(":", f(&c.dim)),
                pk.run(&p.path, Fmt { bold: true, ..f(&c.dir) }),
                pk.run(&format!("$ {cmd}"), f(&c.text)),
            ]
            .concat(),
            ..Default::default()
        }
    };

    let section = |pk: &mut Package, title: &str, glyph: &str| {
        let icon = pk.icon(glyph, 10.0, &c.ok);
        let f = Fmt { bold: true, spacing: 24, ..pk.fmt(&c.white, 8.0) };
        Para {
            before: Some(280),
            after: Some(110),
            keep_next: true,
            rule_below: Some(3),
            body: icon + &pk.run(&title.to_uppercase(), f),
            ..Default::default()
        }
    };

    let bullet = |pk: &Package, label: &str, text: &str| Para {
        hang: Some((340, 200)),
        after: Some(40),
        body: [pk.marker(), pk.white(&format!("{label} "), 8.5), pk.text(text)].concat(),
        ..Default::default()
    };

    body.push(prompt(&pk, "whoami"));
    body.push(Para { after: Some(80), body: pk.white(&cv.name, 22.0), ..Default::default() });
    body.push(prompt(&pk, "cat role.txt"));
    body.push(Para { after: Some(140), body: pk.accent(&cv.role, 9.0, true), ..Default::default() });

    // Two fixed columns per line never wrap, so a glyph is never stranded at
    // a line end away from its label: the longest item is ~46 of 110 columns.
    let contact = |pk: &mut Package, ct: &Contact| {
        let icon = pk.icon(contact_glyph(&ct.label), 9.0, &c.dim);
        let label = match &ct.href {
            Some(href) => pk.link(&ct.value, href, 7.5),
            None => pk.muted(&ct.line, 7.5),
        };
        icon + &label
    };
    let pairs: Vec<&[Contact]> = cv.contacts.chunks(2).collect();
    for (i, pair) in pairs.iter().enumerate() {
        let last = i + 1 == pairs.len();
        let mut runs = contact(&mut pk, &pair[0]);
        if let Some(second) = pair.get(1) {
            runs += &pk.text("\t");
            runs += &contact(&mut pk, second);
        }
        body.push(Para {
            after: Some(if last { 60 } else { 30 }),
            tabs: vec![("left", 5000)],
            rule_below: last.then_some(8),
            body: runs,
            ..Default::default()
        });
    }

    body.push(section(&mut pk, "Summary", "terminal"));
    body.push(Para { body: pk.text(&cv.summary), ..Default::default() });

    body.push(section(&mut pk, "Core Stack", "layer-group"));
    for s in &cv.skills {
        body.push(Para {
            after: Some(50),
            body: pk.white(&format!("{}: ", s.cat), 8.5) + &pk.muted(&s.list, 8.0),
            ..Default::default()
        });
    }

    body.push(section(&mut pk, "Experience", "briefcase"));
    for exp in &cv.experience {
        body.push(Para {
            before: Some(180),
            after: Some(30),
            keep_next: true,
            tabs: right_tab(),
            body: [
                pk.white(&exp.title, 9.5),
                pk.accent(&format!(" · {}", exp.company), 9.5, true),
                pk.text("\t"),
                pk.dim(&format!("\u{a0}\u{a0}\u{a0}{}", exp.date_line)),
            ]
            .concat(),
            ..Default::default()
        });
        body.push(Para { after: Some(70), keep_next: true, body: pk.muted(&exp.desc, 8.0), ..Default::default() });
        for (label, text) in &exp.bullets {
            body.push(bullet(&pk, label, text));
        }
    }

    body.push(section(&mut pk, "Selected Projects", "diagram-project"));
    for p in &cv.projects {
        let mut head = pk.white(&p.name, 9.5) + &pk.text("  ");
        for path in &p.icons {
            head += &pk.brand(path, 9.0, &c.muted);
        }
        head += &pk.text("\t");
        head += &pk.link(&format!("\u{a0}\u{a0}\u{a0}{}", p.repo_line), &p.href, 7.0);
        body.push(Para { before: Some(140), after: Some(30), keep_next: true, tabs: right_tab(), body: head, ..Default::default() });
        body.push(Para { after: Some(40), keep_next: true, body: pk.accent(&p.stack, 7.5, false), ..Default::default() });
        body.push(Para { after: Some(80), body: pk.text(&p.desc), ..Default::default() });
    }

    body.push(section(&mut pk, "Education", "graduation-cap"));
    for ed in &cv.education {
        body.push(Para {
            after: Some(30),
            keep_next: true,
            body: pk.white(&ed.degree, 9.5) + &pk.accent(&format!(" · {}", ed.school), 9.5, true),
            ..Default::default()
        });
        body.push(Para { after: Some(100), body: pk.dim(&ed.meta), ..Default::default() });
    }

    body.push(section(&mut pk, "Certifications", "award"));
    for ct in &cv.certifications {
        body.push(Para { hang: Some((340, 200)), after: Some(40), body: pk.marker() + &pk.text(&ct.line), ..Default::default() });
    }

    body.push(section(&mut pk, "Interests", "heart"));
    body.push(Para { body: pk.muted(&cv.interests, 8.5), ..Default::default() });

    let email = cv.contact("Email").map_or("", |ct| ct.value.as_str());
    let site = cv.contact("Website").map_or("", |ct| ct.value.as_str());
    let footer = Para {
        rule_above: Some(6),
        tabs: right_tab(),
        body: [
            pk.dim(&format!("{} · {email}", cv.name)),
            pk.text("\t"),
            pk.dim(&format!("{site} · ")),
            pk.field("PAGE"),
            pk.dim("/"),
            pk.field("NUMPAGES"),
        ]
        .concat(),
        ..Default::default()
    };

    let paragraphs: String = body.iter().map(|p| p.xml(&c.rule)).collect();
    let document = format!(
        concat!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>"#,
            r#"<w:document {ns}><w:background w:color="{bg}"/><w:body>{paragraphs}"#,
            r#"<w:sectPr><w:footerReference w:type="default" r:id="{footer}"/>"#,
            r#"<w:pgSz w:w="{w}" w:h="{h}"/>"#,
            r#"<w:pgMar w:top="900" w:right="{mx}" w:bottom="860" w:left="{mx}" w:header="708" w:footer="708" w:gutter="0"/>"#,
            r#"</w:sectPr></w:body></w:document>"#
        ),
        ns = NS,
        bg = c.bg,
        paragraphs = paragraphs,
        footer = footer_rel,
        w = PAGE_W,
        h = PAGE_H,
        mx = MARGIN_X,
    );
    let footer_xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr {NS}>{}</w:ftr>"#,
        footer.xml(&c.rule)
    );

    let font = esc(&cv.theme.font);
    let styles_xml = format!(
        concat!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles {ns}>"#,
            r#"<w:docDefaults><w:rPrDefault><w:rPr>"#,
            r#"<w:rFonts w:ascii="{font}" w:hAnsi="{font}" w:eastAsia="{font}" w:cs="{font}"/>"#,
            r#"<w:color w:val="{color}"/><w:sz w:val="{size}"/><w:szCs w:val="{size}"/>"#,
            r#"</w:rPr></w:rPrDefault><w:pPrDefault/></w:docDefaults>"#,
            r#"<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>"#,
            r#"</w:styles>"#
        ),
        ns = NS,
        font = font,
        color = c.text,
        size = pt(8.5),
    );
    // Declared as a fixed-pitch "modern" face, so a machine without
    // JetBrains Mono substitutes another monospace rather than Calibri.
    let fonts_xml = format!(
        concat!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts {ns}>"#,
            r#"<w:font w:name="{font}"><w:altName w:val="Consolas"/><w:charset w:val="00"/>"#,
            r#"<w:family w:val="modern"/><w:pitch w:val="fixed"/></w:font></w:fonts>"#
        ),
        ns = NS,
        font = font,
    );
    let settings_xml = format!(
        concat!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings {ns}>"#,
            // Word only paints w:background on screen with this set; printing
            // it is a per-user option, so the PDF remains the print copy.
            r#"<w:displayBackgroundShape/>"#,
            r#"<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>"#,
            r#"</w:settings>"#
        ),
        ns = NS,
    );

    let mut doc_rels = String::from(r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">"#);
    for (id, kind, target, external) in &pk.rels {
        let mode = if *external { r#" TargetMode="External""# } else { "" };
        let _ = write!(doc_rels, r#"<Relationship Id="{id}" Type="{REL}/{kind}" Target="{}"{mode}/>"#, esc(target));
    }
    doc_rels.push_str("</Relationships>");

    let core = format!(
        concat!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>"#,
            r#"<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" "#,
            r#"xmlns:dc="http://purl.org/dc/elements/1.1/">"#,
            r#"<dc:title>{name} - CV</dc:title><dc:creator>{name}</dc:creator><dc:description>Curriculum Vitae</dc:description>"#,
            r#"</cp:coreProperties>"#
        ),
        name = esc(&cv.name),
    );
    let app = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>cvgen</Application></Properties>"#;
    let content_types = concat!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>"#,
        r#"<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">"#,
        r#"<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>"#,
        r#"<Default Extension="xml" ContentType="application/xml"/>"#,
        r#"<Default Extension="png" ContentType="image/png"/>"#,
        r#"<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>"#,
        r#"<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>"#,
        r#"<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>"#,
        r#"<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>"#,
        r#"<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>"#,
        r#"<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>"#,
        r#"<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>"#,
        r#"</Types>"#
    );
    let package_rels = concat!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>"#,
        r#"<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">"#,
        r#"<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>"#,
        r#"<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>"#,
        r#"<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>"#,
        r#"</Relationships>"#
    );

    let mut zip = zip::ZipWriter::new(Cursor::new(Vec::new()));
    let opts = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let mut put = |name: &str, data: &[u8]| -> zip::result::ZipResult<()> {
        zip.start_file(name, opts)?;
        zip.write_all(data)?;
        Ok(())
    };
    put("[Content_Types].xml", content_types.as_bytes())?;
    put("_rels/.rels", package_rels.as_bytes())?;
    put("docProps/core.xml", core.as_bytes())?;
    put("docProps/app.xml", app.as_bytes())?;
    put("word/document.xml", document.as_bytes())?;
    put("word/styles.xml", styles_xml.as_bytes())?;
    put("word/settings.xml", settings_xml.as_bytes())?;
    put("word/fontTable.xml", fonts_xml.as_bytes())?;
    put("word/footer1.xml", footer_xml.as_bytes())?;
    put("word/_rels/document.xml.rels", doc_rels.as_bytes())?;
    for (name, data) in &pk.media {
        put(&format!("word/media/{name}"), data)?;
    }
    Ok(zip.finish()?.into_inner())
}
