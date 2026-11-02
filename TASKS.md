# Site update — task list

Requested 2026-11-02. Done top to bottom; each task is ticked once it builds and
has been checked in the browser.

## 1. About Me — blur-in highlight instead of the decrypt animation
- [x] React Bits Pro's "Blur Highlight" needs a paid licence key (`REACTBITS_LICENSE_KEY`,
      not set here) and Tailwind + shadcn, which the site doesn't use. Build our own
      `BlurHighlight` in plain CSS instead: words blur in as the paragraph scrolls into
      view, then the key phrases light up.
- [x] Mark the important phrases in both About paragraphs.
- [x] Remove `DecryptedText` (used nowhere else).
- [x] Text stays in the pre-rendered HTML; reduced motion shows it at once.

## 2. Current Stack — card order
- [x] Rust is the first card and sits on top; each next card tucks under the one before
      (today the last card, GitLab, is on top).

## 3. Current Stack — hold to reveal
- [x] Hovering a card for 2 s fills its border like a timer.
- [x] When the border is full, the logo gives way to a word and a one-line description
      of the technology, with a soft blur/scale crossfade.
- [x] Leaving early resets the timer; leaving after the reveal returns to the logo.
- [x] Touch: a tap starts the same timer. Reduced motion: no fill animation, instant swap.
- [x] A hovered card comes to the top of the stack.

## 4. Selected Projects — new, fast showcase
- [x] Replace `AccordionGallery` (lags: it animates `flex-grow`, width, height, padding
      and a grayscale filter every frame, under a backdrop blur).
- [x] New component: a repository index on the left, a window on the right showing the
      selected project's screenshots, stack, summary and GitHub link. A scan line sweeps
      the window when the project changes.
- [x] Only opacity and transform animate; no layout work while switching.
- [x] Hover, focus, click and arrow keys select; proper tab semantics.
- [x] Phones: every project as its own card, no hover needed.
- [x] Delete `AccordionGallery.jsx` / `.css`.

## 5. Professional Journey — summaries
- [x] Add a short summary to every experience: what the role gave me, in professional
      first-person words (`summary` in `cv.js`; site only, the CV files don't change).
- [x] Show it in each card as its own section.

## 6. Beyond the Code — richer cards
- [x] Give each hobby card a real visual: a framed "plate" for the existing animated
      artwork, a large outlined word behind the content, captions, better chips.
- [x] Stay CSS-only and keep pausing animations offscreen; check phones.

## 7. Verify
- [x] Lint, full build, bundle sizes compared with before (index 82.7 kB gz).
- [x] Screenshots at desktop and phone widths; no console or hydration errors.
- [x] Update the README and notes where the components changed.