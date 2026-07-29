# v2 Build Plan

Companion to `CLAUDE.md`. That file is the standing context and the rules. This file is the
ordered work. Phases are sequential; tasks inside a phase are mostly parallel.

Honest total: roughly 25 to 34 days of focused work. The shell and the apps are each about as
much work as the entire old site was, and the three switchable skins add three to four days on
top of that, almost all of it in Phase 1.

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
- [x] 0.7 Connect Cloudflare Workers Builds to the repo, deploy the hello-world. Live at
      `moba-portfolio.m-monim.workers.dev`. **Do this now, not at the end.**
      Adapter and build surprises are cheap to fix against an empty repo and expensive to fix
      against a finished site.

---

## Phase 1: Design system and static reskin

**~6 to 9 days. Goal: every surface of the OS drawn and verified in all three skins, with no
state wired in.**

This is the reskin. Components are real Svelte components with real markup and styles, driven
by props only. Nothing is interactive yet. Phase 2 makes them work.

### 1.1 Aesthetic direction: all three ship as user-switchable skins

**Decided.** The old site's theme switcher changed colour. This one changes shape. Three skins,
selectable at runtime, persisted, switching in place without a reload:

| Skin | Character |
|---|---|
| `modern` | Blur, radii, depth kept. Mono chrome, proportional content. Stroked geometric icons on a 24-unit grid. |
| `retro` | System 7. Pinstripe title bar, dithered desktop, black hairlines, hard drop shadows, inset bevels, selection by inversion. No translucency. |
| `glass` | Translucency all the way. Heavy backdrop blur, generous radii, soft light, gradient accent. Where the old site already was. |

Crossed with four colour themes and dark/light, that is **24 combinations, every one of which
must pass AA**. See the theming table in `CLAUDE.md` for which axis owns what, and for the
per-skin accent budget. The load-bearing constraint: skins own shape, themes own colour, and it
stays one markup tree.

Evidence this is tractable: the three directions were prototyped from byte-for-byte identical
markup. Every difference was CSS.

### 1.2 Name the OS

**Decided: Mnemos.** Version 2.0, matching the site.

The old site's operating system was unnamed, which is why the boot screen, the sidebar's
`MDir`/`MDoc` types, and the `644` permissions read as isolated jokes instead of one world.

Mnemos is Greek, memory. A portfolio is a record of work, so the name means what the site is. It
earns the `M` prefix that `MDir` and `MDoc` already depend on, and it reads as native in
pinstripes and in monospace alike, which the skin switcher requires.

Where it surfaces: the boot sequence, the Terminal prompt and hostname, System Info, the
file-type labels, and the `404` voice. One exported constant in `src/lib/`, never a string
literal in a component, or renaming it later means grepping eight files.

### 1.3 Tokens

Defined as CSS custom properties in `app.css`. Two independent sets, and the split between them
is the architecture:

**Theme tokens (colour), one block per theme, switched by `data-theme`:** surface ramp, text
ramp, accent, semantic aliases.

**Skin tokens (shape), one block per skin, switched by `data-skin`:** font families, type scale,
radii, border widths, chrome heights, elevation recipes (shadow and blur per depth level, so a
focused window reads above an unfocused one), motion durations and easings.

Motion is a skin token, not a global: glass wants a soft ease, retro wants near-instant with no
easing at all, because System 7 did not animate. Named tokens throughout, so nothing hardcodes
`300ms` again.

Build the token contract before any component. Every skin must define every shape token, so a
missing value is a build-time hole rather than a silent fallback.

**The four themes, decided.** The old site used Skeleton's presets, `skeleton` / `crimson` /
`wintry` / `modern`. All four are renamed and repalletted. `modern` in particular could not
survive: it is now a skin name, and `data-skin="modern"` beside `data-theme="modern"` is a trap.

Named for ways of storing or showing an image, which is what Mnemos means and what a portfolio
does. Hue positions roughly track the old four so nothing feels lost.

| Theme | Accent | Replaces |
|---|---|---|
| `ferrite` | warm red, core-memory rust | `crimson` |
| `phosphor` | CRT green | `skeleton` |
| `halide` | cool blue, silver-halide film | `wintry` |
| `selenium` | violet, selenium drum | `modern` |

The names pay off in System Info and in the Terminal's `theme` command, and they cannot collide
with skin names. Hues are five hex values each and cheap to revise; the token architecture is the
expensive part and does not care what the colours are.

**Order of work for this task:**

- [x] 1. Token contract in `app.css`. Every token named and split theme-owned vs skin-owned before
      any component consumes one.
- [x] 2. Four theme blocks across dark and light, three skin blocks. Palettes are authored in OKLCH
      by `v2/scripts/gen-palette.ts` and flattened to hex; revise a hue there, not in `app.css`.
- [x] 3. Minimal pre-paint inline script in `app.html` for all three attributes. This is properly
      2.8's job, pulled forward because nothing above is verifiable without it.
- [x] 4. `/styleguide` at swatch and scale level only, no components yet, with skin, theme, and mode
      switchers. Fills out through 1.6.
- [x] 5. A `bun test` that parses the token values and asserts WCAG AA on every foreground/background
      pair across all 24 combinations. Turns the non-negotiable in `CLAUDE.md` into something
      enforced rather than eyeballed 24 times.

### 1.4 Typography

Three skins, three type pairings. Subset to woff2 and preload only what the active skin needs;
do not ship all three families to every visitor. The old site shipped a raw `.ttf` variable font.

**Decided: one webfont, not three.** Three pairings, of which two are free:

| Skin | UI and body | Mono | Cost |
|---|---|---|---|
| `modern` | `ui-monospace` chrome, `system-ui` body | `ui-monospace` | 0 |
| `retro` | Geneva, Verdana, Tahoma | Monaco | 0 |
| `glass` | Montserrat, variable 400 to 700, latin | `ui-monospace` | 34.7 KB |

`glass` earns the download twice over: it is the skin whose character is the old site's face, and
without it `glass` and `modern` share a body stack and read as the same typography. `modern` pairs
a monospace chrome against a proportional body, which is already distinct from both other skins,
and `system-ui` plus `ui-monospace` is precisely what a native systems tool renders in.

Retro's bitmap question, weighed and declined: System 7's real faces are Chicago and Geneva, both
Apple trademarks with no free web licence, and the free lookalikes are single-size bitmaps that
fall apart off their design size. Geneva ships on macOS, Verdana and Tahoma cover the rest.

- [x] 1. Montserrat's latin variable woff2, self-hosted at `static/fonts/`, with its OFL 1.1
      licence beside it. Google's pre-subset file is what `pyftsubset` emits, so there is no font
      toolchain in the repo.
- [x] 2. One `@font-face` in `app.css` with `font-display: swap`, referenced only by the `glass`
      family tokens, so the browser fetches it for that skin and for nobody else. No per-skin
      stylesheet, no loader.
- [x] 3. Preload injected by the existing pre-paint script in `app.html`, keyed off the skin it has
      just resolved, because that is the only moment the skin is known and a static `<link>` is
      not. Without it the request waits on the stylesheet, which is the FOUT.
- [x] 4. `v2/_headers` marks `/fonts/*.woff2` immutable. The adapter appends its own rules to it at
      build time. The filename is the cache key, so replacing the font means renaming the file.
- [x] 5. A `bun test` tying the `@font-face`, the skin that references it, and the preload map
      together. That map is a fourth copy of the skin list, and a stale preload is invisible: the
      page still renders, it just fetches the wrong file or nothing at all.
- [x] 6. Weight specimen in `/styleguide`, so a variable axis that failed to load is visible rather
      than silently synthesised.

### 1.5 Icon system

One `<Icon>` component over a path map keyed by skin. Chrome glyphs carry three variants: folder,
document, their open states, window controls, chevron, apps, cog. Brand and social icons carry
one. The old site had a separate 31-line component per icon and no variants at all.

- [x] 1. `src/lib/icons.ts`: `CHROME`, nine glyphs by three skins, stroked on a 24-unit grid, and
      `BRAND`, six filled marks each on the grid it was drawn on. The cog is named `settings`,
      because retro draws System 7's control-panel sliders rather than a gear.
- [x] 2. `src/lib/components/Icon.svelte`. All three variants render and CSS picks by `data-skin`,
      so the skin switches with no script, never flashes, and is still right with JavaScript off.
      Stroke width, cap, and join come from `--icon-*` skin tokens; `--icon-cap` and `--icon-join`
      are new and defined by every skin.
- [x] 3. `src/lib/icons.test.ts`: every glyph defines every skin, no two skins share a path, path
      syntax is legal, no absolute coordinate leaves the grid, and the component still lists every
      skin. That last one matters because Svelte prunes CSS it cannot match, so the variants are
      literal elements rather than a loop.
- [x] 4. Icon section in `/styleguide`: every chrome glyph, the size ramp it is used at, and the
      brand marks.

### 1.6 Static components

Window chrome (title bar, controls, info sidebar, focused and unfocused states), desktop grid
and icon states (rest, hover, selected, open), dock, boot screen, settings panel, modal shell.

Each gets built once and verified in all three skins before moving to the next. Building all
components in one skin and re-skinning later is how the markup tree splits.

The boot screen is the sharpest test: it has to read as a POST sequence in `retro`, as a systems
tool in `modern`, and as something other than a soft gradient in `glass`. If glass cannot carry
it, that is worth knowing in Phase 1 rather than Phase 6.

### 1.7 Styleguide route

A prerendered `/styleguide` rendering every token and every component state, with skin, theme,
and mode switchers. At 24 combinations this stops being a convenience and becomes the only
practical way to verify contrast, so build it early and keep it current. It is where WCAG AA
failures get caught, not the launch audit.

**Exit criteria:** every surface drawn in every skin, every state visible in the styleguide, AA
contrast passing in all 24 skin/theme/mode combinations, and no component branching on skin where
a token or a scoped rule would do.

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

2.8 Skin, theme, and appearance all applied pre-paint by an inline script in `app.html` reading
localStorage. No flash. Switching skin at runtime re-dresses the running desktop in place: no
reload, open windows keep their position and stacking order.

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
