# Site update — task list

Requested 2026-11-02 (second batch; the first one is in git history). Done top to
bottom; each task is ticked once it builds and has been checked in the browser.

## 1. Hero — a new opening instead of the profile card
- [x] Talk it through first: three directions proposed (trace, chip, boot).
- [x] Build all three independently, each as a real production build with its own link,
      so the user can rate them (`VITE_HERO=trace|die|boot`).
- [x] Build a fourth that mixes the best of the three (`VITE_HERO=mix`).
- [x] Main photo: the eye-behind-glasses macro (`src/assets/hero/eye.webp`); the Arch
      logo stays as an accent.
- [x] The user picked the mix; it is now the only hero (`components/hero/Hero.jsx`). The
      build switch, the other candidates, ProfileCard and the arch.png preload are gone.

## 1c. Hero polish and the rest (2026-11-03, third batch)
- [x] Start on a realistic CPU (no photo); lightning strikes it, it powers up and boots
      Linux; then the ASCII backdrop rises in (symbols go up and glow); then the CPU
      turns over and the photo is on its back. Lens reflection kept and polished
      (second-surface ghost, mouse-parallax glare).
- [x] Signals leave an edge connector on the socket, not a "client" point in the photo,
      as bit trains of light along the traces; the parts' numbers are live.
- [x] Neofetch: Running 70+ projects; Users 30+ companies.
- [x] The header's target cursor works in the hero too.
- [x] Header logo: |qwantum>, letters in superposition with their Greek twins; hover
      collapses it.
- [x] Prompt reads qwantum@sudo.
- [x] Live sites show the sites' real logos in black and white.
- [x] Let's Connect is a new component (Connect.jsx).
- [x] Verify: lint, full build, pre-render, desktop and phone, no console errors.

## 1d. Hero: mass, legs and a new reveal (2026-11-03, fourth batch)
- [x] The chip has mass instead of a flat 3D turn: a moulded body with a visible
      edge and a shadow on the board. It stays flat (it is soldered down), and the
      photo is printed onto it like photolithography: a stepper walks its reticle
      over the fields and each one flashes and leaves the photo.
- [x] The glare crosses the glasses every 4 seconds.
- [x] Reboot takes the ASCII backdrop down with Linux and brings it back when
      Linux is up again.
- [x] Legs on the processor and on every part, soldered to the board with traces
      running into it; signals leave and enter through the legs, which light up.
- [x] Verify: lint, build, desktop, laptop and phone, reboot, reduced motion.

## 1e. Header logo: decode (2026-11-04)
- [x] Six candidates tried in the real header; the user chose "decode" and the
      rest are deleted.
- [x] The name is built from the ASCII backdrop's characters: when Linux is up and
      the backdrop rises, one lit character per letter lifts off the backdrop's
      grid, flies into the header and climbs the ramp into its letter. Reboot
      dissolves it; hover runs the ramp again; reduced motion shows it plainly.
- [x] Verify: first visit, reboot, repeat visit, phone, hover, reduced motion,
      blocked scripts.

## 1f. Hobbies captions and a new Let's Connect (2026-11-04)
- [x] Beyond the Code: the captions under the animations are gone.
- [x] Let's Connect rebuilt for ease of use: the ss -tln table and the handshake
      ladder are gone. Email first, as large as the card allows, with Copy and
      Write buttons (the address copies on click too); one big card per other
      channel with a plain verb. The address condenses out of the backdrop's ramp
      when reached and on copy; each brand mark is drawn in the ramp's characters
      and scrambled by a passing band on hover. Dushanbe clock with day/night.
- [x] Verify: desktop, phone, hover, copy, keyboard focus, reduced motion.

## 1b. Small follow-ups (2026-11-03)
- [x] Docker leftovers from the screenshot run removed (containers, volumes, dangling
      images).
- [x] The book in Beyond the Code types "Love can save the universe".

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
- [x] (2026-11-04) Recruitment's Mini App screenshot drawn as a handset, like tek and
      payment_system. Competency Matrix and apiweave stay without one: they have
      no phone layout.
- [x] (2026-11-04) Window buttons 14px with bold, centred marks drawn as strokes
      (the text glyphs sat off-centre, and their bold weight never applied).
      Restore while maximised shows two inward corners.

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
