//! PDF — typeset by Typst from cv.typ, which reads the CV as `/cv.json`.
//!
//! The world is sealed: one template, one data file, and the site's own
//! JetBrains Mono compiled into the binary. Nothing is read from the system,
//! so the PDF comes out the same on every machine and in CI.

use typst::diag::{FileError, FileResult, SourceDiagnostic, Warned};
use typst::foundations::{Bytes, Datetime, Duration, Smart};
use typst::syntax::{FileId, RootedPath, Source, VirtualPath, VirtualRoot};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World};
use typst_layout::PagedDocument;
use typst_pdf::PdfOptions;

const TEMPLATE: &str = include_str!("cv.typ");

// The static weights, not the variable font: PDF readers cannot select a
// variation instance.
const FONTS: [&[u8]; 4] = [
    include_bytes!("../../react/src/assets/fonts/ttf/JetBrainsMono-Regular.ttf"),
    include_bytes!("../../react/src/assets/fonts/ttf/JetBrainsMono-Medium.ttf"),
    include_bytes!("../../react/src/assets/fonts/ttf/JetBrainsMono-Bold.ttf"),
    include_bytes!("../../react/src/assets/fonts/ttf/JetBrainsMono-ExtraBold.ttf"),
];

fn file_id(path: &str) -> FileId {
    let vpath = VirtualPath::new(path).expect("static path");
    FileId::new(RootedPath::new(VirtualRoot::Project, vpath))
}

struct CvWorld {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
    main: Source,
    data_id: FileId,
    data: Bytes,
}

impl World for CvWorld {
    fn library(&self) -> &LazyHash<Library> {
        &self.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.book
    }

    fn main(&self) -> FileId {
        self.main.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.main.id() { Ok(self.main.clone()) } else { Err(not_found(id)) }
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        match id {
            id if id == self.data_id => Ok(self.data.clone()),
            id if id == self.main.id() => Ok(Bytes::from_string(self.main.text().to_owned())),
            id => Err(not_found(id)),
        }
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.get(index).cloned()
    }

    // No date: the document carries none, so the same CV gives the same bytes.
    fn today(&self, _offset: Option<Duration>) -> Option<Datetime> {
        None
    }
}

fn not_found(id: FileId) -> FileError {
    FileError::NotFound(id.vpath().get_with_slash().into())
}

fn describe(diags: &[SourceDiagnostic]) -> String {
    diags
        .iter()
        .map(|d| {
            let hints: String = d.hints.iter().map(|h| format!("\n  hint: {}", h.v)).collect();
            format!("{}{hints}", d.message)
        })
        .collect::<Vec<_>>()
        .join("\n")
}

pub fn build(json: &str) -> Result<Vec<u8>, String> {
    let fonts: Vec<Font> = FONTS.iter().flat_map(|data| Font::iter(Bytes::new(*data))).collect();
    let world = CvWorld {
        library: LazyHash::new(Library::default()),
        book: LazyHash::new(FontBook::from_fonts(&fonts)),
        fonts,
        main: Source::new(file_id("/cv.typ"), TEMPLATE.to_owned()),
        data_id: file_id("/cv.json"),
        data: Bytes::from_string(json.to_owned()),
    };

    let Warned { output, warnings } = typst::compile::<PagedDocument>(&world);
    let document = output.map_err(|errors| describe(&errors))?;
    // The template is ours, so any warning is a bug — an unknown font family,
    // say, which would otherwise ship a PDF set in the fallback face.
    if !warnings.is_empty() {
        return Err(describe(&warnings));
    }
    let options = PdfOptions { ident: Smart::Custom("billsharifzade.github.io/cv".into()), ..Default::default() };
    typst_pdf::pdf(&document, &options).map_err(|errors| describe(&errors))
}
