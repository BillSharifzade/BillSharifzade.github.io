//! XLSX — one dark "card" sheet per CV section.

use rust_xlsxwriter::{
    Color, DocProperties, Format, FormatAlign, FormatBorder, FormatPattern, FormatUnderline, Workbook,
    XlsxError,
};

use crate::cv::Cv;

fn rgb(hex: &str) -> Color {
    Color::RGB(u32::from_str_radix(hex, 16).unwrap_or(0))
}

/// How a column's data cells differ from the body default.
#[derive(Clone, Copy, Default)]
struct Style<'a> {
    color: Option<&'a str>,
    bold: bool,
    /// Turn `http(s)://` values into hyperlinks.
    link: bool,
}

struct Column<'a> {
    header: &'a str,
    width: f64,
    style: Style<'a>,
}

const fn col(header: &str, width: f64) -> Column<'_> {
    Column { header, width, style: Style { color: None, bold: false, link: false } }
}

impl<'a> Column<'a> {
    fn color(mut self, color: &'a str) -> Self {
        self.style.color = Some(color);
        self
    }
    fn bold(mut self) -> Self {
        self.style.bold = true;
        self
    }
    fn link(mut self) -> Self {
        self.style.link = true;
        self
    }
}

enum Cell {
    Text(String),
    Number(f64),
}

impl From<&String> for Cell {
    fn from(s: &String) -> Self {
        Cell::Text(s.clone())
    }
}

impl From<&str> for Cell {
    fn from(s: &str) -> Self {
        Cell::Text(s.to_owned())
    }
}

impl From<String> for Cell {
    fn from(s: String) -> Self {
        Cell::Text(s)
    }
}

pub fn build(cv: &Cv) -> Result<Vec<u8>, XlsxError> {
    let c = &cv.theme.color;
    let font = |size: f64, color: &str| {
        Format::new().set_font_name(&cv.theme.font).set_font_size(size).set_font_color(rgb(color))
    };

    let mut wb = Workbook::new();
    wb.set_properties(&DocProperties::new().set_author(&cv.name).set_title(format!("{} - CV", cv.name)));

    // A styled header row, alternating row ground, every cell in the used
    // rectangle filled so no white shows through, and gridlines off so the
    // card edge is the only line.
    let mut sheet = |name: &str, tab: &str, columns: Vec<Column>, rows: Vec<Vec<Cell>>| -> Result<(), XlsxError> {
        let ws = wb.add_worksheet();
        ws.set_name(name)?;
        ws.set_tab_color(rgb(tab));
        ws.set_screen_gridlines(false);
        ws.set_freeze_panes(1, 0)?;
        ws.set_row_height(0, 22)?;

        let head = font(9.5, &c.white)
            .set_bold()
            .set_background_color(rgb(&c.panel))
            .set_pattern(FormatPattern::Solid)
            .set_align(FormatAlign::VerticalCenter)
            .set_border_bottom(FormatBorder::Medium)
            .set_border_bottom_color(rgb(tab));
        for (i, column) in columns.iter().enumerate() {
            let i = i as u16;
            ws.set_column_width(i, column.width)?;
            ws.write_string_with_format(0, i, column.header, &head)?;
        }

        for (r, cells) in rows.iter().enumerate() {
            let row = r as u32 + 1;
            // Spreadsheet row 2 (the first data row) takes the page ground.
            let ground = if row % 2 == 1 { &c.bg } else { &c.panel_alt };
            for (i, (cell, column)) in cells.iter().zip(&columns).enumerate() {
                let i = i as u16;
                let style = column.style;
                let mut format = font(9.0, style.color.unwrap_or(&c.text))
                    .set_background_color(rgb(ground))
                    .set_pattern(FormatPattern::Solid)
                    .set_align(FormatAlign::Top)
                    .set_text_wrap()
                    .set_border_bottom(FormatBorder::Thin)
                    .set_border_bottom_color(rgb(&c.rule));
                if style.bold {
                    format = format.set_bold();
                }
                match cell {
                    Cell::Text(s) if style.link && (s.starts_with("http://") || s.starts_with("https://")) => {
                        let format = format.set_font_color(rgb(&c.dir)).set_underline(FormatUnderline::Single);
                        ws.write_url_with_format(row, i, s.as_str(), &format)?;
                    }
                    Cell::Text(s) if s.is_empty() => {
                        ws.write_blank(row, i, &format)?;
                    }
                    Cell::Text(s) => {
                        ws.write_string_with_format(row, i, s, &format)?;
                    }
                    Cell::Number(n) => {
                        ws.write_number_with_format(row, i, *n, &format)?;
                    }
                }
            }
        }
        Ok(())
    };

    let mut profile: Vec<Vec<Cell>> = vec![
        vec!["Name".into(), (&cv.name).into()],
        vec!["Role".into(), (&cv.role).into()],
        vec!["Summary".into(), (&cv.summary).into()],
    ];
    profile.extend(cv.contacts.iter().map(|ct| vec![(&ct.label).into(), (&ct.value).into()]));
    profile.push(vec!["Interests".into(), (&cv.interests).into()]);
    sheet("Profile", &c.ok, vec![col("Field", 16.0).bold().color(&c.dim), col("Value", 96.0)], profile)?;

    sheet(
        "Skills",
        &c.accent,
        vec![col("Category", 20.0).bold().color(&c.white), col("Skills", 70.0)],
        cv.skills.iter().map(|s| vec![(&s.cat).into(), (&s.list).into()]).collect(),
    )?;

    sheet(
        "Experience",
        &c.dir,
        vec![
            col("Period", 24.0).color(&c.dim),
            col("Type", 12.0).color(&c.dim),
            col("Title", 34.0).bold().color(&c.white),
            col("Company", 26.0).bold().color(&c.accent),
            col("Description", 60.0).color(&c.muted),
            col("Achievements", 84.0),
        ],
        cv.experience
            .iter()
            .map(|exp| {
                let bullets: Vec<String> = exp.bullets.iter().map(|(l, t)| format!("› {l} {t}")).collect();
                vec![
                    (&exp.date).into(),
                    exp.kind.as_deref().unwrap_or("").into(),
                    (&exp.title).into(),
                    (&exp.company).into(),
                    (&exp.desc).into(),
                    bullets.join("\n").into(),
                ]
            })
            .collect(),
    )?;

    sheet(
        "Projects",
        &c.cyan,
        vec![
            col("Project", 34.0).bold().color(&c.white),
            col("Stack", 54.0).color(&c.accent),
            col("Description", 90.0),
            col("Repository", 56.0).link(),
        ],
        cv.projects
            .iter()
            .map(|p| vec![(&p.name).into(), (&p.stack).into(), (&p.desc).into(), (&p.href).into()])
            .collect(),
    )?;

    sheet(
        "Education",
        &c.ok,
        vec![
            col("Period", 16.0).color(&c.dim),
            col("Degree", 34.0).bold().color(&c.white),
            col("Institution", 44.0).color(&c.accent),
            col("Status", 14.0),
        ],
        cv.education
            .iter()
            .map(|ed| {
                vec![(&ed.date).into(), (&ed.degree).into(), (&ed.school).into(), ed.note.as_deref().unwrap_or("").into()]
            })
            .collect(),
    )?;

    sheet(
        "Certifications",
        &c.accent,
        vec![col("Certification", 46.0).color(&c.white), col("Issuer", 20.0).color(&c.muted), col("Year", 10.0)],
        cv.certifications
            .iter()
            .map(|ct| {
                let year = match &ct.year {
                    Some(serde_json::Value::Number(n)) => Cell::Number(n.as_f64().unwrap_or_default()),
                    Some(serde_json::Value::String(s)) => s.into(),
                    _ => "".into(),
                };
                vec![(&ct.name).into(), ct.issuer.as_deref().unwrap_or("").into(), year]
            })
            .collect(),
    )?;

    wb.save_to_buffer()
}
