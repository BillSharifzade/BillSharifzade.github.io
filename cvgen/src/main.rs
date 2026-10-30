//! Builds the CV downloads for billsharifzade.github.io.
//!
//! Reads the CV as JSON (react/scripts/cv-json.mjs prints it from cv.js) and
//! writes the same document six ways, so the site serves plain files instead
//! of generating them in the visitor's browser.
//!
//!     cvgen <cv.json | -> <out-dir>

mod cv;
mod docx;
mod icons;
mod pdf;
mod text;
mod xlsx;

use std::error::Error;
use std::io::Read;
use std::path::PathBuf;
use std::process::ExitCode;
use std::{env, fs, io};

type Result<T> = std::result::Result<T, Box<dyn Error>>;

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => {
            eprintln!("cvgen: {err}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<()> {
    let args: Vec<String> = env::args().skip(1).collect();
    let [input, out] = args.as_slice() else {
        return Err("usage: cvgen <cv.json | -> <out-dir>".into());
    };
    let json = if input == "-" {
        let mut buf = String::new();
        io::stdin().read_to_string(&mut buf)?;
        buf
    } else {
        fs::read_to_string(input)?
    };
    let cv: cv::Cv = serde_json::from_str(&json)?;

    let files = [
        ("pdf", pdf::build(&json)?),
        ("docx", docx::build(&cv)?),
        ("xlsx", xlsx::build(&cv)?),
        ("csv", text::csv(&cv).into_bytes()),
        ("md", text::markdown(&cv).into_bytes()),
        ("txt", text::txt(&cv).into_bytes()),
    ];

    let out = PathBuf::from(out);
    fs::create_dir_all(&out)?;
    for (ext, bytes) in files {
        let path = out.join(format!("{}.{ext}", cv.basename));
        fs::write(&path, &bytes)?;
        println!("{:>6} kB  {}", bytes.len().div_ceil(1024), path.display());
    }
    Ok(())
}
