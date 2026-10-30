//! The CV's glyphs as SVG (for the PDF) and as PNG (for Word, which has no
//! vector image support).

use resvg::{tiny_skia, usvg};

/// A single-colour SVG drawing `paths` in a `width`×`height` view box.
pub fn svg(width: f64, height: f64, paths: &[&str], hex: &str) -> String {
    let body: String = paths.iter().map(|d| format!(r#"<path d="{d}"/>"#)).collect();
    format!(r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" fill="#{hex}">{body}</svg>"##)
}

/// A glyph rasterised for Word at 4× its display size, for crisp printing.
pub struct Png {
    pub data: Vec<u8>,
    /// Display size in CSS pixels (96 per inch), as Word's EMU sizes expect.
    pub width: f64,
    pub height: f64,
}

pub fn png(width: f64, height: f64, paths: &[&str], hex: &str, px: f64) -> Option<Png> {
    const SCALE: f64 = 4.0;
    let tree = usvg::Tree::from_str(&svg(width, height, paths, hex), &usvg::Options::default()).ok()?;
    let out_h = (px * SCALE).round() as u32;
    let out_w = (px * SCALE * width / height).round() as u32;
    let mut pixmap = tiny_skia::Pixmap::new(out_w, out_h)?;
    let s = out_h as f32 / height as f32;
    resvg::render(&tree, tiny_skia::Transform::from_scale(s, s), &mut pixmap.as_mut());
    Some(Png { data: pixmap.encode_png().ok()?, width: px * width / height, height: px })
}
