//! The CV as react/scripts/cv-json.mjs prints it from react/src/data/cv.js.
//!
//! Display strings that cv.js formats with helpers (`dateLine`, `certLine`, …)
//! arrive ready-made, so those rules live in one place only.

use std::collections::BTreeMap;

use serde::Deserialize;

#[derive(Deserialize)]
pub struct Cv {
    pub basename: String,
    pub theme: Theme,
    pub name: String,
    pub role: String,
    pub summary: String,
    pub contacts: Vec<Contact>,
    pub skills: Vec<Skill>,
    pub experience: Vec<Job>,
    pub projects: Vec<Project>,
    pub education: Vec<Education>,
    pub certifications: Vec<Cert>,
    pub interests: String,
    /// Font Awesome glyphs, by name (src/data/cvIcons.js).
    pub icons: BTreeMap<String, Icon>,
    pub signal: Signal,
}

#[derive(Deserialize)]
pub struct Theme {
    pub font: String,
    pub color: Colors,
    pub prompt: Prompt,
}

/// `rrggbb` strings, as src/utils/cvTheme.js defines them.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Colors {
    pub bg: String,
    pub panel: String,
    pub panel_alt: String,
    pub rule: String,
    pub white: String,
    pub text: String,
    pub muted: String,
    pub dim: String,
    pub ok: String,
    pub accent: String,
    pub dir: String,
    pub cyan: String,
}

#[derive(Deserialize)]
pub struct Prompt {
    pub user: String,
    pub host: String,
    pub path: String,
}

#[derive(Deserialize)]
pub struct Contact {
    pub label: String,
    pub value: String,
    pub href: Option<String>,
    /// `Label: value`, or the bare value for entries like the location.
    pub line: String,
}

#[derive(Deserialize)]
pub struct Skill {
    pub cat: String,
    pub list: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    pub title: String,
    pub company: String,
    pub date: String,
    #[serde(rename = "type")]
    pub kind: Option<String>,
    pub date_line: String,
    pub desc: String,
    /// `(label, text)`, the label ending in a colon.
    pub bullets: Vec<(String, String)>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub name: String,
    pub href: String,
    pub repo_line: String,
    pub stack: String,
    pub desc: String,
    /// simple-icons marks: one path each, in a 24×24 box.
    pub icons: Vec<String>,
}

#[derive(Deserialize)]
pub struct Education {
    pub degree: String,
    pub school: String,
    pub date: String,
    pub note: Option<String>,
    /// The date, plus the note when there is one.
    pub meta: String,
}

#[derive(Deserialize)]
pub struct Cert {
    pub name: String,
    pub issuer: Option<String>,
    pub year: Option<serde_json::Value>,
    pub line: String,
}

#[derive(Deserialize)]
pub struct Icon {
    pub w: f64,
    pub h: f64,
    pub d: String,
}

#[derive(Deserialize)]
pub struct Signal {
    pub width: f64,
    pub height: f64,
    pub paths: Vec<String>,
}

impl Cv {
    /// `bill@coolest_website:~$ cmd`, the prompt the site's terminal shows.
    pub fn prompt_line(&self, cmd: &str) -> String {
        let Prompt { user, host, path } = &self.theme.prompt;
        format!("{user}@{host}:{path}$ {cmd}").trim_end().to_owned()
    }

    pub fn contact(&self, label: &str) -> Option<&Contact> {
        self.contacts.iter().find(|c| c.label == label)
    }
}
