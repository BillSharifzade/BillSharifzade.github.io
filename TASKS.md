# Site update — task list

Requested 2026-11-02 (second batch; the first one is in git history). Done top to
bottom; each task is ticked once it builds and has been checked in the browser.

## 1. Hero — a new opening instead of the profile card
- [ ] Talk it through first: proposals go to the user, nothing is built yet. (Waiting on the user.)

## 2. Header — Download CV hover
- [x] Drop the particle burst and the white fill on hover.
- [x] Hover and focus behave like the other header links (the label rolls up).

## 3. Skills — favourite folders
- [x] A small star on the Rust and Linux folders marks them as the main ones.

## 4. Current Stack — logo stays after the reveal
- [x] Once a card turns into its headline, the logo shrinks into the top-right
      corner instead of disappearing.

## 5. Selected Projects
- [x] Sidebar as tall as the window, with more in it: all repositories, star on
      GitHub, live sites.
- [x] Window title bar: grey minimise / maximise / close buttons.
- [x] Projects in Progress terminal: grey buttons and grey text except the user's
      own; the title text white and clear; no collision with the section heading on
      phones.
- [x] Remove the Async Kafka Client and Process Viewer CLI; add payment_system and
      tek; order by impact.
- [x] Screenshots of tek and payment_system (desktop and phone), taken from the
      projects running locally; delete the two covers nobody uses any more.
- [x] "Impact" button: the project window turns into a bento of impact figures, in
      the same size, and back.
      - Multi-Protocol API Framework: open source, 239 users, helps people build backends.
      - Recruitment: $10k+ a month, 10+ companies.
      - Competency Matrix: $35k+ a month, 25+ companies.
      - Payment System: alpha; potential beyond the usual scale.
      - tek: 1,000+ electricians; revenue is private to the company.
- [x] Live sites: a compact list with short descriptions, plus "infinite romantic
      websites for my future wife", highlighted in the footer's colour.

## 6. Professional Journey — easier reading
- [x] Comfortable line length, spacing and hierarchy in the expanded card.
- [x] Icons for the summary block and the other inner blocks.

## 7. Beyond the Code — animations
- [x] Rebuild the artwork animations to look realistic and refined, while staying
      cheap (transform/opacity only, paused off screen, reduced motion respected).

## 8. Contact — remove the phone
- [x] Remove the phone mockup and its code; leave a clean section for what comes next.

## 9. Verify
- [x] Lint, build, pre-render; desktop and phone checks; no console errors.
