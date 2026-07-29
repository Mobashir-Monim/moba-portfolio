# v2 Build Plan

Companion to `CLAUDE.md`. That file is the standing context and the rules. This file is the
ordered work. Phases are sequential; tasks inside a phase are mostly parallel.

Honest total: roughly 22 to 30 days of focused work. The shell and the apps are each about as
much work as the entire old site was.

The old site is not vendored here. It stays in its own repo, `mosite-svelte-v2`, and is read
across when content, copy, or assets are needed. See the porting table in `CLAUDE.md`.

---

## Phase 0: Scaffold

**~0.5 day. Goal: an empty site deploying to production before any real work exists.**

- [x] 0.1 `bun create svelte@latest` into `portfolio/v2/`. SvelteKit 2, Svelte 5, TypeScript
      strict.
- [x] 0.2 Tailwind v4, CSS-first config in `app.css`. No `tailwind.config.js` unless something
      genuinely needs it.
- [x] 0.3 `@sveltejs/adapter-cloudflare`. `export const prerender = true` in the root layout.
- [x] 0.4 ESLint, Prettier, `svelte-check`. Match the scripts block in `CLAUDE.md`.
- [x] 0.5 `bun test` script in `package.json`. `bunfig.toml` and `bun-test-setup.ts` exist, the
      script does not.
- [x] 0.6 `git init` at `portfolio/`, first commit, push.
- [ ] 0.7 Connect Cloudflare Workers Builds to the repo, deploy the hello-world. **Do this now,
      not at the end.**
      Adapter and build surprises are cheap to fix against an empty repo and expensive to fix
      against a finished site.

---

## Phase 1: Design system and static reskin

**~3 to 5 days. Goal: every surface of the OS drawn and verified, with no state wired in.**

This is the reskin. Components are real Svelte components with real markup and styles, driven
by props only. Nothing is interactive yet. Phase 2 makes them work.

### 1.1 Aesthetic direction (decide first, everything else depends on it)

The old site was vaguely modern-macOS: translucent windows, backdrop blur, `rounded-2xl`,
Montserrat with wide letter-spacing, on top of Skeleton's `crimson` preset. It reads pleasant
but generic, and
it sits oddly against the BIOS boot messages, which point somewhere more technical.

Pick a lane. My recommendation: **modern base, technical detailing.** Keep the blur, the radii,
and the depth, but make typography, iconography, and copy read like a systems tool. Mono for all
system chrome (title bars, sidebar metadata, dock tooltips, terminal), proportional for content.
Precise, geometric icons rather than soft ones. It stays contemporary, it makes the Terminal and
the boot screen feel native rather than bolted on, and it does not commit you to drawing pixel
art.

The alternatives, for completeness: full retro (System 7 or Win95 bitmap chrome, high charm,
high art cost, dates fast) or full glass (prettier, but nothing distinguishes it from every
other portfolio using a glass aesthetic).

**Needs your sign-off before 1.2 starts.**

### 1.2 Name the OS

The old site's operating system is unnamed, which is why the boot screen, the sidebar's `MDir`/`MDoc`
types, and the `644` permissions feel like isolated jokes instead of one world. Naming it makes
the boot sequence, System Info, the Terminal prompt, and the file-type labels cohere for free.
Cheap, and the single biggest personality gain available.

### 1.3 Tokens

Defined as CSS custom properties in `app.css`, one block per theme, switched by `data-theme` on
`<html>`, with dark/light as an independent axis.

- Colour: surface ramp, text ramp, accent, plus semantic aliases. Four themes carried over from
  the old site, but your own palettes, not Skeleton presets.
- Type scale, and the two families (proportional and mono).
- Spacing, radii, border widths.
- Elevation: shadow and blur per depth level, so a focused window reads above an unfocused one.
- Motion: duration and easing tokens. Named, so nothing hardcodes `300ms` again.

### 1.4 Typography

Subset to woff2 and preload. The old site shipped a raw `.ttf` variable font. Add the mono
family that 1.1 requires.

### 1.5 Icon system

One `<Icon>` component over a path map, or a single SVG sprite. The old site had a separate
31-line component per icon.

### 1.6 Static components

Window chrome (title bar, controls, info sidebar, focused and unfocused states), desktop grid
and icon states (rest, hover, selected, open), dock, boot screen, settings panel, modal shell.

### 1.7 Styleguide route

A prerendered `/styleguide` rendering every token and every component state, with theme and
mode switchers. This is how you check contrast across four themes times two modes without
clicking through the whole site, and it is where you catch the WCAG AA failures early rather
than during the launch audit.

**Exit criteria:** every surface drawn, every state visible in the styleguide, AA contrast
passing in all eight theme/mode combinations.

---

## Phase 2: Shell rebuild

**~4 to 6 days. Goal: the OS works, and works without a mouse or a script.**

2.1 Window state module (`.svelte.ts`, runes). Flat array, array order is stacking order, focus
moves a record to the end. History as a string-id stack per window, never object references.

2.2 Unit tests for every mutator, written alongside. Defect #1 in the ledger was a `===` typo in
exactly this code, shipped because nothing tested it.

2.3 Open, close, focus, minimize, restore. Enter and exit via Svelte `transition:` directives,
keyed `{#each}`. Delete the `justOpened`/`justClosed`/`setTimeout` mechanism entirely.

2.4 Drag via Pointer Events with `setPointerCapture`. One code path for mouse, touch, and pen.
`translate3d()`, never `left`/`top`. Position in component-local state during the gesture,
committed to the store once on pointerup.

2.5 Responsive: one markup tree, Tailwind variants. No duplicated mobile branch, no
`MediaQuery` component, no user-agent sniffing.

2.6 Routing and dual render. Content routes emit complete semantic HTML; the shell renders the
same components inside window chrome. Verify with JavaScript disabled.

2.7 Head and SEO: per-route title, description, canonical, Open Graph, Twitter card, JSON-LD.
`sitemap.xml`, `robots.txt`.

2.8 Theme and appearance applied pre-paint by an inline script in `app.html` reading
localStorage. No flash.

2.9 Accessibility pass against the contract in `CLAUDE.md`: no nested interactives, accessible
names on every icon-only control, arrow-key grid navigation, Escape closes, focus moves into a
window on open and returns on close, visible `:focus-visible` everywhere.

2.10 `prefers-reduced-motion` honoured throughout. Reduced motion means instant, not slower.

**Exit criteria:** fully operable by keyboard alone; readable and navigable with JS off; no
ledger defect reintroduced.

---

## Phase 3: Content layer

**~2 to 3 days.**

3.1 Types in `src/lib/types/`. Plain objects, no model classes.

3.2 Content collections in `src/lib/content/`, ported from the old site's `src/lib/data/`.
Every item gets a stable `slug`.

3.3 Directory tree derived from the collections, not maintained beside them.

3.4 Content components: about, company, experience, project, degree, publication,
certification. Each renders standalone on its route and inside a window.

3.5 Move long prose out of TypeScript. The old site's `src/lib/data/projects.ts` was 642 lines
compiled into the bundle.

3.6 Port the assets the content needs: fonts, company logos, icons. See the porting table in
`CLAUDE.md`.

---

## Phase 4: Tier-1 apps

**~6.5 days. Everything here either gets you contacted or demonstrates capability.**

### 4.1 Résumé viewer (~0.5 day)

Document window with a PDF download. The old site had no way to get a CV, which is the one
artifact a recruiter reliably wants.

### 4.2 Case study reader (~1.5 days)

Distinct from the Projects catalogue: narrative documents with problem, constraints, approach,
outcome, and measured results. Reader chrome with a table-of-contents sidebar, scroll progress,
and next/previous. Case studies live as deep files inside Projects so nothing is duplicated;
the reader is simply the better viewer for them.

### 4.3 Mail (~2 days)

Compose-and-send only, no inbox. The only app with a trust boundary, so it gets real controls.

- Endpoint as a `+server.ts` POST route. Under `adapter-cloudflare` it becomes a Worker function
  in the same deploy, so no separate Worker project. It must set `export const prerender = false`
  to opt out of the root layout's prerendering.
- Delivery via Resend. Cloudflare removed the free MailChannels integration in 2024.
- Cloudflare Turnstile (invisible, same host, no aesthetic cost), plus a honeypot field, plus
  rate limiting by IP in the Worker.
- **Validation server-side, always.** Client-side validation is UX, not a control. Length caps,
  a real email-shape check, and reject anything oversized before it reaches the mail provider.
- Never echo submitted content back into HTML unescaped.
- After sending, an auto-reply appears in an Inbox containing only that message. It explains the
  send-only asymmetry in-world and confirms delivery.

### 4.4 Terminal (~2 days)

A real shell over the content tree, which already exists as structured data, so the command
layer is small relative to what it buys you.

Commands: `ls`, `cd`, `cat`, `open`, `whoami`, `contact`, `theme`, `help`, `clear`. History with
arrow keys, tab completion, and a `404`-style error voice consistent with the OS.

Highest signal-to-effort item in the project. It demonstrates engineering judgment more directly
than any game, and it lands with exactly the audience that decides whether to contact you.

### 4.5 System Info (~0.5 day)

"About This Machine": the stack this site runs on, bundle size, Lighthouse scores, build date.
Pull real numbers at build time rather than hardcoding them, or the joke curdles.

---

## Phase 5: Tier-2 apps

**~3 days. Charm. Ships after the site does its job.**

### 5.1 Snake (~0.5 day)

Safe IP, small logic, best first game.

### 5.2 Calculator with the Pro paywall gag (~1 day)

The calculator itself is a couple of hours. The gag is the point.

- On open: a "Calculator Pro" upsell. $499.99 to unlock.
- A working escape hatch. Suggestion: "Continue with Basic" works fully except division, which
  reports that division is a Pro feature. Funnier than a crippled calculator, and still usable.
- **No fake payment form. Ever.** No field that looks like it takes a card number. That is the
  line between a gag and a dark pattern, and it is also how people get trained to type card
  details into unverified inputs.
- If Stripe is added later: Stripe Checkout only, hosted and real, with a real product
  description, terms, and a refund path. Once money can actually move, it is a real transaction
  regardless of intent.

### 5.3 Second game (~1 to 2 days)

2048 (original is MIT licensed, explicitly free to clone) or Minesweeper (generic concept, no
enforcement history). Both are safe and bounded.

Deferred, and deliberately: a falling-block puzzle (~2 days) and a maze chase (~4+ days). The
maze chase is both the highest effort and the highest legal risk on the list. If either gets
built, it ships under its own name with its own art. Mechanics are not copyrightable; names,
character designs, and specific visual expression are, and both franchises enforce.

---

## Phase 6: Launch

**~2 to 3 days.**

6.1 Lighthouse across the site: performance, accessibility, best practices, SEO.

6.2 Manual accessibility audit. Keyboard only, then a screen reader. Not automated tooling
alone, which misses most of what matters here.

6.3 JavaScript-disabled pass over every content route.

6.4 Cross-browser and real-device check, particularly drag on touch.

6.5 Cloudflare Web Analytics. No Google Analytics, no consent banner needed.

6.6 Redirects from any old site URLs worth preserving.

6.7 Ledger review: walk all 35 items in `CLAUDE.md` and confirm none returned.

---

## Sequencing notes

- Phase 1 gates everything. Do not start Phase 2 before the styleguide is signed off, or the
  reskin gets relitigated inside feature work.
- Phases 2 and 3 can overlap once the state module is stable.
- Phase 4 apps are independent of each other and can be built in any order or in parallel.
- Phase 5 is genuinely optional and can slip past launch without harm.
- Deploy at the end of every phase. The pipeline exists from Phase 0 precisely so this is free.
