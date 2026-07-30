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

- [x] 1. `src/lib/icons.ts`: `CHROME`, thirteen glyphs by three skins, stroked on a 24-unit grid, and
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

- [x] 1. Chrome recipe tokens in `app.css`: `--window-bg`, `--desktop-bg`, `--sidebar-w`,
      `--titlebar-pattern`, `--title-align`, `--bevel-out`, `--bevel-in`. Every one of the five
      things this file budgeted a scoped `[data-skin]` rule for turned out to be a token, so the
      shipped stylesheet still contains no scoped skin rules at all.
- [x] 2. Window chrome: `Window.svelte`, `TitleBar.svelte`, `InfoSidebar.svelte`. Section with an
      accessible name, title bar as a div, controls as the only buttons in the tree, body height
      from flex rather than `calc()`. Ledger #4, #17, #24, and #27 all live here.
- [x] 3. Desktop: `Desktop.svelte`, `DesktopIcon.svelte`. Icons are plain links, so Enter and
      JavaScript-off both work without a keydown handler. Rest, hover, selected, and open.
- [x] 4. `Dock.svelte`: apps, settings, and one group per kind of open window with its count.
- [x] 5. `BootScreen.svelte`: logo, thermometer, POST lines, skip. Draws over content that already
      exists rather than standing in for it.
- [x] 6. `SettingsPanel.svelte` and `SkinPreview.svelte`. Skin is the headline control and gets
      live previews rendered under a nested `data-skin`, which is the token split proving itself:
      three skins on screen at once from one markup tree. Click mode joins the persisted settings.
- [x] 7. `Modal.svelte`: labelled `role="dialog"` shell. Focus trapping and Escape are phase 2.
- [x] 8. `src/lib/fs.ts` plus its test, for the invented filesystem sizes. Ledger #7 was an
      unbounded lookup in exactly this function.
- [x] 9. Every component in `/styleguide`, every state visible, driven by the real settings panel.

### 1.7 Styleguide route

A prerendered `/styleguide` rendering every token and every component state, with skin, theme,
and mode switchers. At 24 combinations this stops being a convenience and becomes the only
practical way to verify contrast, so build it early and keep it current. It is where WCAG AA
failures get caught, not the launch audit.

**Exit criteria:** every surface drawn in every skin, every state visible in the styleguide, AA
contrast passing in all 24 skin/theme/mode combinations, and no component branching on skin where
a token or a scoped rule would do.

### 1.8 Composition conformance

**Opened after the fact, and it runs before anything else.**

1.1 was decided against three drawn mockups, all rendering the same scene: `/projects` open with
`lightsaml` selected, three icons down the left edge, a dock, and a boot screen. 1.3 through 1.7
then built the tokens and the components correctly and drew them in the styleguide, which is
where the mistake hid: every component passed on its own, and nothing checked that the desktop
they compose into matches the picture the direction was chosen from.

It does not. The tokens are right and the skins are right; the arrangement is not. Nine deltas,
found by putting the shipped `/` beside the 1.1 artifact.

Two of these are spec disagreements rather than build defects, and are resolved here rather than
left to drift: the artifact's desktop carries no masthead where the concept spec in `CLAUDE.md`
asks for "logo and name", and no mockup implies anything is open on load.

- [x] 1. **Desktop icons are a list, not a grid.** The artifact stacks them down the left edge with
      the label beside the glyph. `IconGrid` and `DesktopIcon` do a grid with the label below.
      Folders keep the grid; the desktop takes the list, and the difference is a variant, not a
      second component.

- [x] 2. **Title bar is inverted.** Artifact: window controls left, title, nav chevrons right.
      `TitleBar.svelte` has the nav first and the controls last.

- [x] 3. **Folder windows have a path row** under the title bar, `~/projects` in modern's mono and
      `Projects` in the other two. Not built at all.

- [x] 4. **Info sidebar header and field set.** Artifact leads with the filename as accent text,
      then Kind, Size, Perms, Owner, Modified. Built leads with a 40px glyph and a centred name,
      spells out Permissions and Author, and adds a Contains row.

- [x] 5. **Dock is missing its apps button and its words.** Artifact reads `3 DOCUMENTS` and
      `1 FOLDER`. Built renders a glyph and a bare numeral, with the word only in screen-reader
      text, and hides apps entirely.

- [x] 6. **Boot screen is unwired.** `BootScreen.svelte` shipped in 1.6 and nothing mounts it. It
      is in all three mockups and it is the first impression the direction was picked on.

- [x] 7. **Modern's desktop is flat.** The mockup carries a faint graph-paper grid;
      `--desktop-bg` is `var(--c-surface-0)`. Glass wants re-checking against its mockup too,
      though its cyan-to-violet reads as `halide` and `selenium` rather than a fourth palette,
      because the artifact predates the named themes.

- [x] 8. **Masthead.** Resolved toward the artifact: the corner block goes, and `/` keeps a
      visually hidden `<h1>` so the page still has its heading. The boot screen carries the name
      instead, which is what "logo and name" was reaching for.

- [x] 9. **Nothing opens on load.** Resolved toward the artifact as well: the boot screen is the
      first impression, so the desktop behind it stays empty and the first window is the
      visitor's own click.

**Exit criteria:** `/` beside the 1.1 artifact, in all three skins, with no arrangement
difference left that is not a deliberate, written-down decision. The styleguide gains a desktop
composition section, so this cannot hide there again.

**Status: not met.** All nine changes shipped and the result was rejected on sight as worse than
what it replaced. So the delta list was not the problem, or not the whole problem, and closing
nine gaps against a still photograph did not produce the thing the photograph is of.

What is missing is a statement of what is actually wrong, in the reviewer's words rather than in
a diff against a mockup. Until that exists, another pass would be guessing at a target twice.
Deferred at the reviewer's call; do not reopen this by proposing more changes to the same nine
items.

---

## Phase 3: Content layer

**~2 to 3 days. Runs second.**

Numbered 3, executed second. The numbers are stable identifiers, not an order: `CLAUDE.md` and
eight comments in the source point at them, and renumbering would churn all of that to say the
same thing twice.

Tasks 2.1 and 2.2, the window state module and its tests, shipped ahead of this phase because
the store has no content dependency. Everything from 2.3 down does. A window opens a node, and
with no tree to open, 2.3 would be wired against a placeholder that this phase then deletes.

- [x] 3.1 Types in `src/lib/types/`. Plain objects, no model classes. A date is `YYYY-MM`, not
      `{ month: 'Nov', year: '2022' }`: the tree needs to compare dates, and a string that sorts
      with `<` removes the month lookup table that shape would need.

- [x] 3.2 Content collections in `src/lib/content/`, ported from the old site's `src/lib/data/`.
      Every item gets a stable `slug`. Companies and projects are keyed by slug with the slug
      repeated in the record, which buys `projects.busso` with no lookup helper; experiences are
      an array, because theirs is the only order that carries meaning.

- [x] 3.3 Directory tree in `src/lib/tree.ts`, derived from the collections. A flat record, since
      a window addresses nodes by id every render and that has to be a key access. Size and
      modified date are derived too: bytes of the item's own copy, and the end date of the job
      it was built under.

- [x] 3.4 Content components in `src/lib/components/content/`, plus `NodeContent`, the one
      dispatcher that stands between the content and how it is being looked at. The tree carries
      a discriminated body, so `NodeContent` switches on `node.type` and gets `node.data`
      narrowed; a route renders it and gets a document, a window renders the same call and gets
      the same document inside chrome.

- [x] 3.5 Prose moved to `src/lib/content/prose/*.md`, five files keyed by `## slug`. Only two
      pieces of markdown are honoured, the key line and the blank line between paragraphs, so no
      markdown dependency is added to read them. `prose()` throws on a missing key at import
      time and a test catches prose that nothing claims.

- [x] 3.6 Assets ported: five company logos, downscaled 1500px to 256px with `sips`, 316 KB to
      54 KB, no toolchain added. Fonts landed in 1.4 and icons were redrawn in 1.5.

---

## Phase 2: Shell rebuild

**~4 to 6 days. Runs third. Goal: the OS works, and works without a mouse or a script.**

- [x] 2.1 Window state module (`.svelte.ts`, runes). Flat array, array order is stacking order,
      focus moves a record to the end. History as a string-id stack per window, never object
      references.

- [x] 2.2 Unit tests for every mutator, written alongside. Defect #1 in the ledger was a `===`
      typo in exactly this code, shipped because nothing tested it.

- [x] 2.3 Open, close, focus, minimize, restore, wired through `WindowLayer` and `WindowFrame`.
      Keyed `{#each}` over the store, array order is stacking order, so no z-index bookkeeping
      exists to go wrong. Enter and exit are one `transition:scale`, which plays its outro before
      removal; the `justOpened`/`justClosed`/`setTimeout(500)` mechanism is not carried across.
      Raising happens on `pointerdown` and on `focusin`, so a pointer and a Tab key agree about
      what is in front, and both land on the window `<section>` rather than making it a button.

- [x] 2.4 Drag and resize via Pointer Events with `setPointerCapture`. One code path for mouse,
      touch, and pen. `translate3d()`, never `left`/`top`. Position and size live in
      component-local state during the gesture and are committed to the store once on pointerup.

      Both gestures are the same gesture, so `src/lib/gesture.ts` owns it once: capture on the way
      down, feed the delta while it moves, commit when it comes up. The surface listens on itself
      once capture is set, so no per-window `window` listener exists (ledger #25), and
      `touch-action: none` on the title bar and the grip is what makes the one path cover touch.
      Bounds are measured at pointerdown, never on mount (ledger #5).

      `clampToDesktop` keeps a margin of the window on screen, because the layer clips its
      overflow and a window dragged past an edge has no scrollbar to bring it back. `clampSize`
      holds a 320x200 floor and a desktop-sized ceiling, so a window cannot be shrunk past its own
      title bar or stretched past the screen. Size is undefined until the first resize, which is
      what keeps the default a CSS expression against the viewport instead of a number frozen at
      open time; the window's container query then restacks the sidebar as it narrows, with no
      second breakpoint to keep in step.

      Both stay mouse-optional, which `CLAUDE.md` allows: nothing is reachable only through them,
      since position and size are presentation and the window is already fully keyboard-operable.

- [x] 2.5 Responsive: one markup tree, Tailwind variants. The window is full-screen below 40rem
      through a media query that drops the transform, which is why position is a custom property
      and not an inline `transform` with an `!important` fighting it.

- [x] 2.6 Routing and dual render. One `[...path]` catch-all instead of thirteen route files:
      every content path is a node and every node knows its own href, so the route table is the
      tree. 36 content pages prerender with complete semantic HTML; `/about` alone carries the
      full prose, which is the whole of ledger #12. Load returns the node id, not the node, so
      the payload does not ship copy the client's tree module already has.

- [x] 2.7 Head and SEO: canonical, Open Graph, Twitter card, JSON-LD. `sitemap.xml`. Per-route
      title and description already land with 2.6, off `tree.summary()`. `robots.txt` shipped in
      phase 0.

      One `Head.svelte` over `src/lib/seo.ts`, used by both renders of the site, so a route cannot
      ship half a head. `SITE_URL` is the only place the origin is written, and moving to
      mobashirmonim.com is that one line.

      Kept a constant rather than an env var, and not derived from the request, because there is
      no request: the site prerenders, `url.origin` during prerender is `http://sveltekit-prerender`,
      and a crawler never runs the JavaScript that could read `location`. An env var would work,
      being build-time, but it moves the value somewhere the repo cannot see it, and unset in CI
      means every canonical on the site is quietly wrong.

      `robots.txt` became an endpoint for the same reason, since its `Sitemap:` line has no
      relative form and a file in `static/` cannot import a constant. That was the only other
      place the origin was written down.

      Structured data covers the types that are things: `Person` on `/` and `/about`,
      `CreativeWork` per project, `ScholarlyArticle` per publication. Degrees and certifications
      are credentials rather than works and index folders are furniture, so both get none rather
      than a claim about a page that is not one. The JSON goes out with every `<` escaped, because
      `</script>` inside a quoted string still closes the tag.

      `sitemap.xml` is a prerendered endpoint built from the same tree the route table is (2.6),
      so the two cannot drift; the body lives in `seo.ts` because a route handler is not testable.

      No `og:image`. Nothing here has art yet, and `summary` beats `summary_large_image` pointing
      at a placeholder. It becomes worth doing when there is something to put in it.

- [x] 2.8 Skin, theme, and appearance all applied pre-paint by an inline script in `app.html`
      reading localStorage. Landed in 1.3; what was left is the `matchMedia` listener that follows
      a live OS colour-scheme change while appearance is `auto`.

      The OS preference is now module state rather than a `matchMedia` call on demand, because
      `auto` has to be reactive: the system flipping under the page changes nothing about
      `settings.appearance`, so every readout of `isDark()` would have gone stale. That is also
      what retires the `void settings.appearance` nudge in `/styleguide`, which was standing in
      for a dependency it did not actually have.

      `followSystemAppearance()` returns its own teardown, so the caller is one `$effect` in the
      root layout and there is no listener to unregister by hand (ledger #2, #3). It writes the
      class itself rather than leaving that to a second effect over `isDark()`, since `update()`
      already owns that line.

- [x] 2.9 Accessibility pass against the contract in `CLAUDE.md`: arrow-key grid navigation,
      Escape closes the focused window and the settings modal, focus moves into a window on open
      and returns to its icon on close, focus trapping in `Modal`. The rest of the contract, no
      nested interactives and accessible names on every icon-only control, holds already.

      Icons stay plain links rather than becoming `role="grid"` or `role="listbox"`, which is the
      other pattern the contract allows, and the two components that had deferred the choice say so
      now instead of promising a role. A role is an attribute: it ships in the prerendered HTML and
      is still there with JavaScript off, announcing keyboard behaviour that nothing is around to
      provide. `$lib/roving` adds the arrows and nothing else, on the link itself, so the element
      taking the key is an interactive one and Svelte owns the listener.

      A step off the edge stays put rather than clamping into range, which the test caught: clamped,
      ArrowUp from the top row lands on the first item, a sideways move in answer to a vertical key.
      Column count is measured off the layout rather than declared, because the grid wraps at
      whatever the window is wide and only the layout knows where a row ends.

      Escape means the innermost thing that can hear it. Inside a window it drops the selection if
      there is one and closes the window otherwise, and it stops there, so the desktop's own Escape
      does not also deselect behind it. Settings is a window, so it needs no case of its own.

      Focus moves into the window's `<section>` on open and back to the opener on close, falling
      back to the item's own icon by `href` when that element is gone: clicking a link does not
      focus it in every browser, and the opener can equally be a row in a window that has since
      closed. The effect re-runs when the section comes and goes, so minimize hands the keyboard
      back and restore takes it again. The case it misses is navigating inside a folder window,
      where the content is replaced along with the focused link and the keyboard lands on the body,
      out of Escape's reach; recovered only when focus actually fell to the body, so the back button
      keeps its own focus across a press.

      `Modal` gained the trap, the Escape, and the focus restore that 1.6 deferred. Its copy in the
      styleguide had to move behind a button, because a dialog that holds the keyboard cannot also
      be a swatch sitting on a page.

      Only `nextIndex` is unit tested, since it is the only part that is arithmetic rather than
      focus. The rest was verified by driving headless Chrome against the dev server: arrows across
      the desktop list and a five-column grid, Enter into a window, Escape deselecting then closing,
      focus landing back on `/projects`, and Tab cycling inside the modal.

- [x] 2.10 `prefers-reduced-motion` honoured throughout. The global CSS rule and the window
      transition already are; the remaining animations arrive with the apps.

      **The apps arrived and brought one animation between them**, the case study reader's scroll
      progress, and 4.2 had already settled it: a bar that moves only as far as the reader has
      already scrolled is a position readout, not motion, so it stays and the component puts back
      the duration the blanket rule takes away. Nothing else in phases 4 and 5 animates. So the
      audit found no violation to fix, which is the answer this task was owed either way, and the
      work became making that answer hold rather than making it true.

      **Two properties were missing from the blanket rule**, both delays. Reduced motion means
      instant, and a 300ms wait before an instant change is still 300ms of the page doing something
      the visitor asked it not to. Nothing sets one today; the two lines are what keeps that true.

      **What a blanket rule provably cannot reach is the part worth testing.** It is a stylesheet,
      so it governs anything the engine drives from a stylesheet and nothing else, and there are
      exactly two ways out of it in a Svelte app:

      1. A `transition:` directive, which has two compilations. Returning a `css` function makes a
         real CSS animation and the rule does reach it; returning a `tick` function runs in script
         and the rule reaches nothing. The call site cannot tell you which, so the only safe rule
         is that a component with a directive also asks `prefersReducedMotion`.
      2. `scrollIntoView({ behavior: 'smooth' })`, which is the sharper of the two because it looks
         like it obeys CSS and does not: the option overrides `scroll-behavior` rather than
         deferring to it, so the `scroll-behavior: auto !important` in the rule buys nothing against
         it. `Terminal.svelte` already calls `scrollIntoView`, one argument away from being wrong.

      `src/lib/motion.test.ts` holds both, plus the rule's own declarations. It also fails if no
      directive is left anywhere, because the first check would then pass while guarding nothing,
      and a test that cannot fail should be deleted rather than trusted. Both checks were mutated to
      confirm they bite.

      Verified by driving headless Chrome over CDP against the preview build, in all three skins,
      with the media feature emulated and a control run without it. The measurement is Chrome's own
      Animation domain rather than computed styles, because a stylesheet says what would animate and
      only the engine says what did: under the preference every animation started came back at 1ms,
      without it the same interactions started 120ms ones. The boot screen never paints and never
      sets its attribute; the progress bar still reads 0 at the top and 1 at the bottom.

      **One thing found on the way that is not this task's**, recorded as 2.14.

- [x] 2.14 The window's open and close transition does not play. Found while building 2.10's
      control run, which needed a case where something visibly animates and could not get one out
      of `transition:scale` on the window frame.

      Chrome's Animation domain reported no animation object created for the frame on open or on
      close, in either motion preference, on the preview build. Not a slow one, not a capped one:
      none. The only animations the page started around a window opening were the desktop icon's
      own `background-color` and `color` transitions.

      **A Svelte 5 transition is local by default, and local means it plays only when the state
      change happened in its own block.** That is the whole of it. The runtime says so in as many
      words, and the shape of the bug is the proof: minimize and restore flip the `{#if}` in
      `WindowFrame` directly, so those two animated all along, while opening and closing add and
      remove the entire component from the each in `WindowLayer`, one block up, which is precisely
      the case local skips. Measured before the fix, in that order: open none, minimize 160ms,
      restore 160ms, close none.

      Three cheaper explanations were ruled out first. Not the parameters: exaggerated to
      `duration: 1600` with `start: 0.5`, rebuilt, confirmed present in the shipped chunk, no
      change. Not the preference: `matchMedia` reports none in the control and the boot screen
      plays, which is the same signal read the same way. Not 2.10, since it reproduces before it.

      The fix is `|global` on the directive. Weighed against moving the `{#if}` up into
      `WindowLayer` so the each block owns the frame's presence, which would make the transition
      local-correct: that trades one modifier for restructuring the component that 2.4, 2.9, and
      2.13 all have hands in, to express the same intent less directly.

      **What this also settles is how Svelte 5 spends a transition, which 2.10 was guessing at.**
      Every directive goes through the Web Animations API, reported as `WebAnimation` beside the
      `CSSTransition` entries the same page produces. A stylesheet does not reach WAAPI at all, so
      the blanket rule in `app.css` buys nothing against a directive and `prefersReducedMotion` is
      the only thing that caps one. `motion.test.ts` said "either compilation, so assume the worst";
      it now says what was measured, and the check it guards went from prudent to required.

      A zero duration makes Svelte start no animation rather than a zero-length one, so under the
      preference the window's absence from the Animation domain is the pass, and the control run is
      what keeps that from being vacuous.

      `motion.test.ts` gained the modifier itself, because this is a defect that no compiler,
      linter, or type checker notices and that presents only as an animation quietly not happening.
      It holds every directive in the repo global, not just this one, since everything animated here
      lives in a component a parent block adds; a future local transition is a real decision and
      should have to be written down. Mutated to confirm it fails.

      Verified by driving headless Chrome over CDP against the preview build, reading the Animation
      domain rather than computed styles: open, minimize, restore, and close each start a 160ms
      `WebAnimation` where before only two of the four did, and close still leaves no frame behind,
      so the outro plays before removal rather than instead of it. 2.10 was re-run on top and still
      passes in all three skins, now with a real WAAPI animation in the control to be absent from
      the reduced run. 2.13 was re-run too, since this touches the same component: two windows open,
      one press on the background window's Close still closes it, in all three skins.

- [x] 2.11 Folder views: icon, list, column, gallery, switched from a segmented control at the
      right of the path row. Asked for after the fact, and built as one dispatcher over one set of
      items so the window never learns which view is on screen and the plain routes keep taking the
      default, which is what keeps the JavaScript-off document unchanged.

      `view` lives on the window record rather than in the frame, because the frame unmounts while
      minimized and a view that reset itself on every trip to the dock is not a setting. The
      click-mode branch moved to `src/lib/activate.ts` and is now tested: `activators` honours the
      setting for icon and list, `pickers` overrides it for column and gallery, where a single click
      has to pick or those two views cannot be walked at all. Ledger #10 was this same branch,
      solved with a 100ms `setTimeout` racing a re-read of the setting.

      Column view anchors at the window's current folder, not at the root, because the tree has no
      parent map by design: a project is listed under both its experience and under Projects. Gallery
      previews the item's own write-up through a new `NodeBody`, split out of `NodeContent` so a
      preview cannot recurse into the previewed item's children.

- [x] 2.12 Structured data as a graph, and the answer engines. Opened after 2.7, which shipped the
      mechanical head and nothing that describes the site as a set of connected entities. That
      description is what a rich result and an LLM citation are both reading.

      **The graph.** Every page asserted its own anonymous `Person` for `author`, so a crawler was
      looking at thirty people who happen to share a name. Now one `Person` at `{SITE_URL}/#person`
      and one `WebSite` at `/#website`, emitted on every page, with every other node referencing
      them by `@id`. Highest value item here and close to the cheapest.

      An `@id` that nothing defines is a dangling edge: the consumer is told a project has an
      author and given nowhere to look. So organizations resolve through the company slug rather
      than through their name, which is what keeps Brac University as employer and Brac University
      as degree institution one node instead of two, and a test walks every page asserting that no
      `@id` is referenced without also being defined there.

      **`BreadcrumbList`** per content page, which needed no new data: an href is a path, and
      `byHref` turns each prefix of it back into a node. The tree deliberately has no parent map
      (2.11), but a URL is one.

      **`CollectionPage` with an `ItemList`** on the four index folders, which carried no structured
      data at all and are exactly the pages that tell a machine the shape of the site.

      **`EducationalOccupationalCredential`** for degrees and certifications. 2.7 gave them nothing
      on the grounds that a credential is not a `CreativeWork`, which was right about
      `CreativeWork` and wrong about there being no correct type.

      **Employment** through schema.org's role pattern rather than a bare `worksFor`, which is a
      present-tense claim: every job is an `OrganizationRole` carrying its own dates, so a finished
      one reads as finished. Plus `alumniOf` and `hasCredential`, and the experience page emits the
      employer. The CV reads as employment history rather than as prose that mentions dates.

      **`dateModified`** from `node.modified`, which the tree already derives per node and the head
      dropped on the floor. `datePublished` only where the content records one: a publication has a
      year and a credential has an award date, a project has neither, and deriving one from the
      single date a project carries would be a claim rather than a derivation.

      **AEO and GEO, honestly scoped.** Most of what is sold under those two names is either SEO
      with a new label or unmeasurable. Three things are real and are ours to control:

      1. Extractable lead sentences. An answer engine quotes the first sentence that answers the
         implied question, and `summary()` takes `description[0]` verbatim. So this was a copy edit
         in `content/prose/*.md` and not code: every document's opening sentence now stands alone
         as an answer to "what is this" and fits the 155-character window whole. Four opened on a
         pronoun with no antecedent anywhere in the document, and two were in a present tense the
         records had already ended.
      2. Semantic HTML, short sentences, one fact each. The dual render already gives the first,
         and this is the actual mechanism behind most GEO advice.
      3. Crawler policy, decided and written down here so it does not get "hardened" later by
         reflex: `robots()` allows everything including the AI crawlers, because a portfolio wants
         to be quoted.

      Deliberately skipped: `llms.txt`, which no major crawler has been shown to read, and
      `FAQPage`, whose rich result Google retired for non-government sites in 2023. Both stay cheap
      if either grows teeth.

      **Three things nothing else claimed.** `/styleguide` already carried `noindex`, from 1.7.
      No `404` route existed, so a wrong URL got SvelteKit's bare error page, which reads as a soft
      404 and was also the one place `CLAUDE.md` asks for a voice that no task built; it speaks the
      shell's, which is what Terminal (4.4) will speak too. And `og:image` is now one static
      1200x630 covering every page, drawn as the boot screen in the default dress, source in
      `scripts/og.svg` and baked with the Chrome already on the machine, so no renderer and no
      dependency. Per-page cards want a renderer in the build, and thirty generated ones are not
      worth more than one honest one.

- [x] 2.13 A closed window is not closed. Found while verifying 4.4 and reproduced with nothing
      from that task involved: open Projects and About from the desktop, click About's Close
      button, and its section leaves the DOM while the dock still counts it. Close Projects
      afterwards and About comes back, focused.

      So the record survives `close`, or the each block re-materialises it from a stale list. The
      dock and the DOM disagreeing is the useful half of the evidence: the dock reads the store, so
      whichever of them is wrong names the layer to look in. Ledger #1 was this shape, a store
      mutator that did not do what its name said, which is why 2.2 tests every one of them; add the
      failing case there before touching the fix.

      **The store was not it, and the narrated symptom did not reproduce.** `close` was driven from
      a fresh load in both `bun run dev` and the preview build, in every ordering the note allows:
      About in front and behind, three windows deep, both closes inside the 160ms outro, close and
      reopen inside it, close with the other window minimized. Store and DOM agreed every time, and
      2.2 already covered the mutator itself. So no failing case was added there, because there was
      none to add.

      **What does reproduce, on the first press, every time: pressing Close on a window that is not
      already on top does not close it.** It raises it and the press is spent. Press again and it
      closes, which is why this reads from the user's seat as exactly what the title says, and why
      a session of it leaves windows in states nobody meant to put them in.

      Raising happens on `pointerdown`, stacking order was the store's array order, and the layer
      rendered that array directly. So a press on a background window reordered a keyed `{#each}`,
      Svelte moved the pressed button to a new place in the DOM, and Chrome, holding a press and a
      release at different tree positions, dispatched no `click` at all. The event log is
      unambiguous: `pointerdown` on the glyph, `mousedown` retargeted to the layer, `pointerup` and
      `mouseup` back on the glyph, and no `click` anywhere. Nothing about it is specific to Close:
      minimize, back, forward, and the view switcher all lost their first press the same way, which
      is also why 4.4 had to reach for `pointerup` to get focus back into the terminal.

      The fix separates the two orders that were one. The record carries `seq`, its open order, and
      that is what the layer renders in, so a window's DOM node never moves while it is open. The
      stack stays the array order and is spent as `z-index` off the record's index in it, derived
      per render rather than bookkept, which is what the note in `WindowLayer` was actually guarding
      against. The layer gets `isolation: isolate`, so a tenth window cannot climb over the boot
      screen or the dock on the strength of a number that only means "tenth".

      `seq` is tested in 2.2 for the property the fix rests on: open order is independent of
      everything that reorders the stack, and a reopened window takes a later place rather than its
      old one. The rest is DOM behaviour and was verified by driving headless Chrome over CDP
      against both the dev server and the preview build, in all three skins: one press closes,
      minimizes, and walks back a background window; the raised window is the one on screen while
      the DOM order holds still; the dock still counts a minimized window and its group still
      restores it; the dock still draws over the windows; and Escape still closes the focused window.

- [x] 2.15 **Withdrawn. There is no defect here, and what there was instead is worth more than the
      bug would have been.** Filed while verifying 5.1 as "Escape closes a window in the store and
      leaves its frame in the DOM, and every window opened after it is invisible", reproduced on
      the preview build of `dacc093`, and wrong.

      The symptom was real and repeatable: close from the store or by the Close button and the
      frame goes; press Escape and the record leaves the store, the dock's group disappears, and
      the `.frame` stays at `opacity: 0` for good, with every later window arriving at `opacity: 0`
      too. The narrowing was real as well. Only key events did it, whatever they were bound to: a
      plain `keydown` listener closing the window ghosts it, a plain `click` listener doing the
      same thing does not, and `stopPropagation`, the deferral to a microtask or a task, and the
      Svelte handler itself all made no difference.

      **What separated the two was not the app.** A `KeyboardEvent` dispatched from the page does
      not ghost the window; the same key dispatched over CDP does. That is the line between an
      untrusted event and real input, and it points at the browser rather than at anything in
      `src/`.

      **Headless Chrome stops producing frames after real input unless the renderer believes it is
      focused.** Measured directly: 45 rAF callbacks in 600ms before a key press, 1 after, with
      `document.timeline.currentTime` frozen across the same window. A Svelte transition is a WAAPI
      animation (2.14), so a stopped timeline means the outro never finishes, the effect is never
      destroyed, and the node is never removed. Every observation in the paragraph above follows
      from that one fact, including the later windows stuck at `opacity: 0`: those are intros that
      never got a frame either.

      The fix is one CDP call in the harness, `Emulation.setFocusEmulationEnabled`, plus the three
      backgrounding flags. With it, 136 frames in the same 600ms after the same key press, and
      Escape closes a window in all three skins with focus landing back where it came from.

      **What this changes for every other task in this file:** any verification that pressed a key
      and then judged whether something animated, or whether something animated away, was measuring
      a frozen clock unless the harness enabled focus emulation. Pointer input does not trigger it.
      2.10 and 2.14 both read the Animation domain and both reported live animations in their
      control runs, so their frames were running; nothing here says they are wrong. It does say
      that the next keyboard-plus-motion check must turn focus emulation on before it can claim
      anything, which is what this entry exists to carry forward.

**Exit criteria:** fully operable by keyboard alone; readable and navigable with JS off; no
ledger defect reintroduced.

---

## Phase 4: Tier-1 apps

**~6.5 days. Everything here either gets you contacted or demonstrates capability.**

### 4.1 Résumé viewer (~0.5 day)

- [x] Document window with a PDF download. The old site had no way to get a CV, which is the one
      artifact a recruiter reliably wants.

      **Not an app.** The roster in `CLAUDE.md` lists this under Tier 1, but an app has no route,
      no sitemap entry, and no structured data, and a CV is the single page most worth indexing.
      So it is a content node at `/resume` like every other document, and the Apps menu stays
      dark until Terminal and Mail, which genuinely are not content. `SETTINGS_ID` keeps its
      note that phase 4 turns it into a roster; this task did not need one.

      **The body is assembled, not authored.** `Resume.svelte` reads `about`, `experiences`,
      `degrees`, `certifications`, `publications`, and the skill catalogue, and links each row to
      the page it summarises. So the résumé is the one document that links to all of them and
      nothing on it can drift from them: there is no second copy to keep in step. The `Resume`
      record holds only the page's own framing plus a pointer at the PDF.

      `ProfilePage` in the graph, with `mainEntity` pointing at the `#person` node every page
      already carries. Schema.org has no résumé type, and `CreativeWork` would claim a career is
      a work I authored. The PDF rides along as `associatedMedia`, a `DigitalDocument` with an
      `encodingFormat`, or a crawler is told there is an associated URL and not that following
      it hands back a PDF.

      The download is an anchor with `download`, which is the whole mechanism: SvelteKit's router
      leaves such links alone, so it works with JavaScript off and needs no handler. The one thing
      no other test could catch is the file going missing, since renaming `static/resume.pdf`
      still builds, still renders, and 404s only when someone clicks. `resume.test.ts` ties the
      record to the file on disk.

      **Content caught up to the PDF first.** The collections were a year behind it: KroDev was
      missing entirely, and the about title and two roles disagreed with the CV a visitor would
      download from the same page. Added `krodev` as a company and a sixth experience, corrected
      the Eveneer and GymRevenue roles and `about.title`. KroDev carries no project children, the
      way `aml-technology-advisor` already does. `Company.logo` became optional, because there is
      no KroDev mark in the repo and a placeholder logo claims a brand that is not theirs.

      Verified by driving headless Chrome over CDP against the preview build: Tab to the Résumé
      icon, Enter opens the window with focus inside it, the download anchor and all six
      experience links resolve, Escape closes and hands focus back to the icon.

### 4.2 Case study reader (~1.5 days)

- [x] Narrative documents with problem, constraints, approach, outcome, and where there is one,
      measured results. Reader chrome with a table-of-contents sidebar, scroll progress, and
      next/previous.

      **Where they live.** A `Case Studies` folder inside Projects, six studies of the twenty-one
      projects. Not beside the catalogue entries, which would put two nodes named for the same work
      in one listing, and not at the root, which would be a second top-level section mirroring the
      first. The href repeats what the slug already says,
      `/projects/case-studies/busso-case-study`, and that is the price of the rule in `CLAUDE.md`
      that a slug is both the window id and the route segment: ids are one flat namespace, so a
      study cannot be `busso`, and the last segment of a document's href is its id.

      A study dates to the job its project was built under rather than to when it was written,
      because `modified` on this site means the work and not the writing.

      **The five sections are markdown, not five fields.** `prose.ts` gained a third honoured piece
      of syntax, `### heading`, and a `proseSections` beside `prose`. The alternative was five
      named fields and a mapping table from heading text to field name, when the markdown already
      declares both the set and the order. What that gives up is the type system holding the
      headings, so `content.test.ts` holds them instead: canonical set, canonical order, and the
      four that are not optional. Results is the one that may be missing, because it is the one
      that needs a number.

      This is also the shape the raw notes arrive in. `CASE-STUDIES.md` at the repo root uses the
      same `## slug` plus `### Heading` layout, so a filled-in block moves into
      `content/prose/case-studies.md` nearly verbatim.

      **The reader is a content component**, so the route and the window get the same one, the way
      every other content type already works. It is its own container, which is what lets one
      markup tree fit a full-width route, a narrow window on a wide screen, and the gallery view's
      preview pane: the contents list moves beside the prose and sticks above 40rem, and sits above
      it below that.

      **Scroll progress is CSS.** `animation-timeline: scroll()` against whichever scroller the
      reader is inside, so there is no listener, no `$effect`, and no script, and it is right in
      all three frames without knowing which one it is in. Two things it cost:

      1. The bar started pinned across the top of the prose, which is where a reading progress bar
         normally goes. The prose scrolls under it, and a rule crossing a line of text reads as a
         strikethrough. It moved into the contents box, which is opaque and already sticks.
      2. `overflow: hidden` on any ancestor of the bar makes that ancestor a scroll container, and
         `scroll()` resolves to the nearest one. The box clipped its own radius for one revision
         and the bar sat at zero forever while still looking correct in a screenshot. Both the box
         and the bar carry a note not to.

      Reduced motion keeps it: a bar that moves only as far as the reader has already scrolled is
      not motion. The global rule in `app.css` caps every animation at 1ms, which on a progress
      timeline means permanently full rather than instant, so the component puts the duration back.

      The fill is `--c-select` rather than `--c-accent`, for the reason the boot thermometer
      already gives: the selection highlight is inside every skin's accent budget, retro's
      included, and this is the same widget filling the same way.

      **Fragment links and nothing else** for the contents list, so it works with no script.
      Anchors are prefixed with the study's own slug, because two studies can be open in two
      windows at once and a bare `#problem` would then exist twice in one document.

      **`Article` in the graph**, with the project it is about nested inside it in full rather than
      referenced. A page that points at an `@id` nothing on it defines is a dangling edge, which
      2.12's test already forbids, so the project's `CreativeWork` came out of the `entity` switch
      into a function both cases call.

      **The content is assembled, not recorded.** These six were built from the project write-ups,
      the feature lists, and the employment records, restructured into the five sections. Nothing
      in them asserts a fact those three do not already carry, and the only number anywhere is the
      one `cli-dev-tool` already claimed, which is why five of the six carry no Results section at
      all. `CASE-STUDIES.md` is where the first-hand notes go, and they replace this section by
      section as they arrive.

      Verified by driving headless Chrome over CDP against the dev server: the study opens in a
      document window from the Case Studies folder, the two-column layout and sticky contents box
      resolve against the window rather than the viewport, the bar reads 0, 0.5 and 1.0 at the
      matching scroll positions, and a contents link scrolls the window's own body to the heading.
      All three skins checked.

### 4.3 Mail (~2 days)

**Deferred, at the reviewer's call.** The rest of phase 4 runs first. Nothing else in the phase
depends on it: the app roster it would have forced landed with 4.5 instead, since Terminal and
System Info are equally apps with no route.

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

- [x] A real shell over the content tree, which already exists as structured data, so the command
      layer is small relative to what it buys you. `ls`, `cd`, `cat`, `open`, `whoami`, `contact`,
      `theme`, `help`, `clear`, with arrow-key history, tab completion, and the `404` page's error
      voice.

      **The tree is already a filesystem, so paths are hrefs.** `..` is string work on the href
      rather than a lookup, because the tree carries no parent map by design (2.11) and a URL is
      one anyway; 2.12's breadcrumbs are the same trick. The root is the one path with no record
      behind it, since nothing owns the whole filesystem, and that is the only special case in
      `resolve`.

      `ls` prints the last href segment and not `node.name`, which is the difference between a
      filename and a title: names here carry spaces, and `cd Case Studies` cannot work in a shell
      that splits on them. One `label()` feeds `ls` and completion both, so the thing listed is
      always the thing the next command accepts, and a test asserts exactly that.

      **`src/lib/terminal.ts` is pure.** No DOM, no window store, no settings. A command that
      changes something returns an effect describing it and `Terminal.svelte` performs it, which
      is what makes all nine commands plain input-to-output assertions. One `COMMANDS` table is
      the dispatch, the `help` output, and the completion candidates, so a command cannot exist in
      two of those and not the third.

      No `pwd`: the prompt is the status display and already shows the directory. First argument
      only, marked as such, because nothing on the list takes two and flags would be a parser.

      **Three focus problems, and each one needed the browser to find.** The terminal is the one
      window whose content should hold the keyboard rather than its frame, and getting there took
      three passes:

      1. Taking focus in a plain `$effect` loses it. A child's effect runs before its parent's, so
         `WindowFrame` hands the keyboard straight back to its own `<section>`. It cannot be fixed
         from that side either: the frame reads `document.activeElement` to know where to return
         focus on close, so content that had already taken it would record itself as its own
         opener. A frame later is the fix.
      2. Clicking back in after `open` needs `pointerup`, not `click` and not `pointerdown`.
         `click` is never dispatched, because taking focus scrolls the body and the release lands
         on a different element than the press. `pointerdown` fires, but the mousedown after it
         focuses the nearest focusable ancestor, which is the window's own section.
      3. So the terminal owns its scrolling instead of letting the window body do it. Both read
         fine, but only this one is stable under a pointer: with the body scrolling, the release
         lands on the body's padding, outside the component, and the handler never hears it.

      Verified by driving headless Chrome over CDP against the dev server: focus lands in the
      prompt on open, every command runs, Tab completes one candidate and lists many without
      touching the line, the arrows walk the history and back out of it, `open` opens a window and
      raises it, `theme` re-dresses the desktop, `clear` empties the screen, an unknown command
      answers in the shell voice, clicking back into the terminal returns the cursor to the prompt,
      and Escape closes the window and hands focus to the launcher. All three skins checked.

      **One bug found on the way that is not this task's**, recorded as 2.13.

### 4.5 System Info (~0.5 day)

- [x] "About This Machine": the stack this site runs on, bundle size, Lighthouse scores, build date.
      Pull real numbers at build time rather than hardcoding them, or the joke curdles.

      **The roster came due here.** `SETTINGS_ID` carried a note saying phase 4 would turn it into
      one, and a second app is what made that true: one app is a branch, two are a pair of branches,
      and three are ledger #27 with a new name. So `src/lib/apps.ts` owns the roster and
      `AppContent.svelte` is the one dispatcher between an id and the app, which is the shape
      `NodeContent` already has for content types. The window frame no longer knows that Settings
      exists.

      A branch per app inside that dispatcher rather than a lookup table, because each app takes
      different props. That is the thing a test has to hold, since a roster entry with no branch
      opens an empty window and throws nothing; `apps.test.ts` reads the component's source, the way
      `icons.test.ts` holds `Icon.svelte` to the skin list. It also asserts what keeps two namespaces
      apart: an `app:` prefix cannot occur in a content slug, so one window store can address both.

      **Apps open as documents.** The dock groups by `Kind`, and an app is nearer a document than a
      folder: a thing you look at, not a place you go. A third member of `Kind` would have rippled
      through the tree, the file-type labels, and the info sidebar to buy one more heading.

      **The launcher is the native popover.** Light dismiss, Escape, the top layer, and returning
      focus to its button are all the platform's, and they are the whole of what a hand-rolled menu
      would have been writing. It is a labelled list of buttons and deliberately not `role="menu"`,
      which would promise arrow keys nothing implements: 2.9 settled that principle. An open popover
      leaves its ancestor's containing block, so it positions against the viewport, which is exact on
      the desktop and approximate in the styleguide, and the styleguide says so.

      That cost one real bug, found by driving the keyboard rather than by reading. A window records
      what held focus when it opened and hands it back when it closes, and a menu item is inside a
      popover that is about to be hidden: still connected, still refusing focus, so the keyboard fell
      to the body. The dock now focuses its own launcher before opening anything, and the window's
      restore checks `checkVisibility()` rather than only `isConnected`.

      **Every number is measured or injected.** Versions come from `package.json` through `define`,
      which is why `vite.config.ts` dumps the manifest and `$lib/build` picks and labels: the config
      has no business deciding what the window shows. Bun's version is asked of the binary, because
      `bun run dev` honours the shebang on vite's bin and that shebang says node, so this file is
      evaluated by Node even in a repo with no npm in it.

      `BUILT` is the day and not the minute, since the client and the server build separately and a
      straddled minute would put two strings in one deploy. `SITE_MODIFIED` reads it, which retires
      the hand-bumped constant `os.ts` was carrying and its `ponytail:` note with it. A deploy now
      dates the whole site.

      **Weight is read from the browser, not from the build.** A bundle size cannot be injected into
      the bundle whose size it reports, and every way out of that circle is worse than the
      Performance API: a second build pass, a byte-patched placeholder, or a runtime fetch. The
      reading answers a better question anyway, counting the document, the CSS, and the font beside
      the script. `encodedBodySize` rather than `transferSize`, which is zero on a cache hit and
      would tell a returning visitor the site weighs nothing.

      **Lighthouse waits for 6.1.** A score cannot be pulled at build time without running Lighthouse
      in the build, and a hardcoded 100 is the number this window exists not to print. 6.1 runs the
      audit and writes the numbers down; System Info reads them then.

      Verified by driving headless Chrome over CDP against the preview build: the launcher opens by
      pointer and by Enter, `aria-expanded` tracks it, Tab walks the list, Enter launches, the menu
      dismisses itself, focus lands inside the window and returns to the launcher on Escape, and the
      window carries no info sidebar. All three skins checked, including the popover in retro.

---

## Phase 5: Tier-2 apps

**~3 days. Charm. Ships after the site does its job.**

### 5.1 Snake (~0.5 day)

- [x] Safe IP, small logic, best first game.

      **The rules are a pure module.** `src/lib/snake.ts` is functions from a game to the next
      game, the split `$lib/terminal` already uses, so every rule is an input-to-output assertion
      and the component is left holding a clock, a keyboard, and a grid of spans. Randomness is a
      parameter rather than a call to `Math.random`, which is the whole of what makes food
      placement testable.

      Three rules that the naive version of this file gets wrong, and each one has a test:

      1. **A turn is measured against the direction last moved, not the one pending.** Two turns
         inside a single tick are each legal against the pending direction and together they are a
         reversal, so up-then-left while moving right folds the snake into its own neck. That is
         why the record carries `dir` and `next` rather than one field.
      2. **The tail cell is free to move into**, because it empties on the same tick unless the
         snake is growing into it. Chasing your own tail is legal; a version that checks the head
         against the whole body kills you for it.
      3. **Food is picked from the free cells**, not from all of them, so it never spawns under the
         snake. The last free cell taken is the win, which is the one ending that is not a death.

      **The board is `role="application"`**, not a grid and not a button: a surface whose keys
      belong to the app rather than to the reading cursor is the one thing that role is for, and it
      carries its instructions in its own label because there is no visual affordance to infer them
      from. Two a11y warnings are suppressed there, both of them the compiler's interactive-element
      list not including that role; the alternative is calling the playfield a `<button>`, which is
      a larger lie than the warnings are worth.

      It takes the keyboard a frame after mount, for the reason `Terminal.svelte` gives at length: a
      child's effect runs before its parent's, so doing it inline hands focus straight back to
      `WindowFrame`. A four-button d-pad covers the pointer and the phone, where the window is full
      screen with no keyboard at all, and each button hands focus back to the board.

      **Nothing animates.** The snake moves by rendering discrete cells on a `setInterval` the
      `$effect` owns, so there is no transition to cap and `prefers-reduced-motion` has nothing to
      reach. That is deliberate: a clock a visitor started by pressing an arrow key is not
      decoration, and a game that refuses to move is not a slower game.

      The initial board is placed deterministically and re-placed on mount, because `/styleguide`
      renders every app in the roster at build time and a random position at init is one position
      on the server and another in the browser.

      Only the food is coloured, `--c-select` rather than `--c-accent`, for the reason the boot
      thermometer and the reader's progress bar already give: the selection highlight is inside
      every skin's accent budget, retro's included. The snake itself is drawn in the theme's ink.

      Minimizing ends the game, because the frame unmounts its content and the game state is
      component-local. Putting it on the window record the way `view` is (2.11) is what that would
      cost, and a tier-2 toy does not earn a field on every window in the store.

      Verified by driving headless Chrome over CDP against the preview build, in all three skins:
      the launcher opens Snake, focus lands on the board, the first arrow starts the clock and the
      snake walks, Space pauses and the board holds still, resuming runs it into the wall and the
      status reads Game over, the d-pad steers and hands focus back, the overlay button starts a
      new game, and Escape closes the window and returns focus to the launcher. No page errors in
      any skin.

      **One thing found on the way that is not this task's**, recorded as 2.15 and withdrawn there:
      Escape appeared to close a window in the store while leaving its frame in the DOM. It was the
      harness, not the shell, and the entry is kept for what it says about verifying motion from a
      keyboard at all.

### 5.2 Calculator with the Pro paywall gag (~1 day)

- [x] The calculator itself is a couple of hours. The gag is the point.

      **The paywall is in the pure module, not the component.** `src/lib/calc.ts` is a function per
      key, the split `snake.ts` and `terminal.ts` already use, and `operate` is where `÷` refuses
      and says why. That is the product rule this app exists to tell a joke about, and a punchline
      with no test is one that can stop working quietly. `calc.test.ts` drives the pad as strings
      of key presses, which is the only way an arithmetic bug in a state machine is visible without
      stepping through it.

      Four functions and a display string, because `0.`, `-0` and a half-typed number are display
      states that do not survive a round trip through `number`. `format` runs results through
      twelve significant digits and back, which is what keeps `0.1 + 0.2` off the screen as
      `0.30000000000000004`. An operator applies the pending one before storing itself, so
      `2 + 3 +` reads 5 before it reads 9, and two operators in a row swap rather than apply.

      **The escape hatch is the app.** "Continue with Basic" dismisses the upsell and everything
      works except division, which reports that division is a Pro feature and leaves the entry
      alone. The `÷` key is marked PRO before it is pressed, so the refusal is a punchline rather
      than a bug report.

      **No form, no field, nothing that resembles one**, which `CLAUDE.md` is explicit about and
      the test asserts: zero `input`, `textarea` or `contenteditable` in the window, before and
      after pressing Unlock. Unlock leads to an in-world dead end, that no payment processor is
      installed on this machine, and the button then removes itself. A convincing payment form is
      how people get trained to type card numbers into whatever asks, and a joke is not worth
      teaching that. If this ever takes money it becomes hosted Stripe Checkout with a real product
      description, terms, and a refund path.

      The keypad is `inert` while the upsell is up, so Tab cannot walk through the panel into the
      keys behind it, and typing is guarded separately. Both are the platform's rather than a focus
      trap of our own, which is what 4.5 settled with the launcher popover.

      Typing works as well as tapping: digits, the four operators, Enter, Backspace and Delete,
      handled on a plain wrapper that the keys bubble to. Every one of them is a real button first,
      so the app is fully operable by Tab and Enter with that handler deleted.

      Verified by driving headless Chrome over CDP against the preview build, in all three skins:
      the upsell is up on open with the keypad inert behind it, Unlock reaches the dead end and
      takes its own button away, Basic dismisses it, `2 + 3` reads 5 by pointer, `9 * 6` reads 54
      by keyboard, `8 ÷` refuses in the app's own words, and Escape closes the window and returns
      focus to the launcher. No field of any kind in the window at any point.

### 5.3 Second game, and a third (~1 to 2 days)

**Both, at the reviewer's call.** The plan left the choice open between 2048 and Minesweeper. The
answer was both: each is safe, bounded, and unlike the other and unlike Snake, so the second one
costs a day and buys a third game.

- [x] **2048.** The original is MIT licensed and explicitly free to clone, which is why this one
      keeps its name where `CLAUDE.md`'s rule sends the two deferred below under their own.

      **The rules are a pure module.** `src/lib/tiles.ts` is functions from a game to the next game,
      the split `snake.ts`, `calc.ts` and `terminal.ts` already use, so the component holds a
      keyboard and a grid of spans and nothing else. Randomness is a parameter, which is what makes
      a spawn testable; a move draws twice, once for the cell and once for the value.

      One `slide` covers all four directions, because every direction is "toward index 0 of a line":
      the vertical pair transposes, the far pair reverses, and the same two operations undo it. Four
      hand-written index walks is the other way, and three of them would be the first with a sign
      flipped.

      Four rules the naive version gets wrong, and each one has a test:

      1. **A tile that has merged is spent for the rest of the move.** `2 2 4` gives `4 4` and not
         `8`, and `2 2 2 2` gives `4 4`. Pairing from the leading edge and skipping the partner is
         the whole of it.
      2. **A press that moves nothing is not a move**, so it neither scores nor spawns. Spawning on
         a blocked press is how a board fills up while the player holds a key against a wall.
      3. **A full board is not the same as a finished one.** A full board with two equal neighbours
         is still playable, so `stuck` asks `shift` in all four directions rather than scanning for
         pairs, and the answer cannot disagree with the move.
      4. **A row must not merge into the row above it**, which is what a shift written against the
         flat array does. Nothing about the board says which one it did until that case runs.

      Reaching 2048 is a flag and not an ending, because stopping the game at the moment it is won
      is not the game.

      **The board is `role="application"`**, for the reason `Snake.svelte` gives and 2.9 settled: a
      `role="grid"` promises the arrows move a reading cursor, and here they move every tile at
      once. The keys belong to the app, which is the one thing that role is for.

      **The value ramp is a ring, not a fill.** A tile keeps one foreground on one background
      whatever it is worth, the pair the calculator's keys already use and `tokens.test.ts` already
      checks in all 24 combinations, and the value is spent on an outline of `--c-select` that
      thickens as the tile climbs. A background mixed per value is the obvious way to draw this and
      it puts text on a colour nothing has measured, which in light mode is where AA goes.

      **One CSS defect found by looking, and it generalises.** The ring was first written as a
      second entry in `box-shadow` beside `var(--bevel-out)`. Two of the three skins resolve that
      token to `none`, a `none` inside a comma-separated shadow list is invalid, and the whole
      declaration is dropped: the ramp rendered in retro and nowhere else, which looks exactly like
      a ramp that is too subtle rather than like a syntax error. Anything composing a shadow with a
      skin token has the same hole.

      **It fits the window it opens in.** The board is square, so its width is its height, and 24rem
      put the pad below the fold of a window that opens 384px tall. 17rem plus a single-row pad is
      what clears the readout and the keys. The pad is one row rather than Snake's cross because
      these four are not steering: every press slides the whole board, so there is no heading for a
      cross to stand for.

      **The id is `app:tiles` and the name is 2048.** `apps.test.ts` turns an app id into the
      constant name `AppContent.svelte` has to branch on, and no JavaScript identifier starts with a
      digit. `sysinfo` and System Info already work that way.

      Verified by driving headless Chrome over CDP against the preview build, in all three skins:
      the launcher opens 2048, focus lands on the board, real arrow keys slide it, every tile stays
      a power of two, the d-pad slides and hands focus back, the score reads, New game returns the
      board to two tiles, and Escape closes the window and returns focus to the launcher. No page
      errors in any skin.

      **One thing the harness had to learn**, and it is the reason the d-pad looked broken for a
      pass: a control inside a window whose body clips its overflow has a bounding rect the pointer
      cannot reach, and a press at those coordinates lands on whatever is on top at that point
      instead. It reads as a focus bug. The harness now scrolls the target into view and checks
      `elementFromPoint` before pressing, which any later CDP pass over a windowed control wants.

- [x] **Minesweeper.** Generic concept, no enforcement history, and the only name on the list that
      is a description of the game rather than a brand.

      **The rules are a pure module.** `src/lib/mines.ts`, the same split, and randomness as a
      parameter buys more here than a testable spawn: the mines are placed by it, so "the first click
      is never a mine" is checkable by handing in the worst draw there is instead of playing until it
      happens.

      Four rules the naive version gets wrong, and each one has a test:

      1. **A neighbour is not `i ± 1`.** One to the left of column 0 is the last cell of the row
         above. That wrap is invisible until a count beside an edge reads one too high, and then it
         is invisible in a way that looks like bad luck.
      2. **The mines do not exist until the first reveal**, and they are then kept off the pressed
         cell and off its neighbours. Excluding the neighbours too is what makes the first press open
         a region rather than a lone number, which is the difference between a game and a guess.
      3. **The flood marks a cell as it is pushed, not as it is popped.** Marked on pop, an open field
         is walked into once from every neighbour it has, which is slow on this board and a blown
         stack on a larger one. It is a stack rather than recursion for the same reason.
      4. **A flag is a lock.** It stops the flood and it refuses a press, which is the whole job of
         planting one. Revealing a flagged cell and losing to it is the bug this prevents.

      The win is every cell that is not a mine, whatever the flags say. Losing reveals every mine, or
      the player is told they lost and not what by.

      **Cells are plain buttons and the tab stop roves.** Not `role="grid"`, which promises a
      composite widget with rows and cells of its own, and 2.9 settled that a role announcing
      behaviour nothing implements is worse than no role. A button is already reachable and already
      opens on Enter and Space; the arrows are `nextIndex` from `$lib/roving`, the arithmetic 2.9
      wrote and tested, with the column count declared because this grid does not wrap. One tab stop
      rather than eighty-one: eighty-one is the conventional reading of the rule and it puts the whole
      board between the keyboard and everything after it.

      Each cell carries its own name, `Row 4, column 7, 2 mines nearby`, which is the reason to make
      it a button at all: closed, flagged, empty and a count look different and would otherwise all
      announce as an unlabelled control. Flagging is `F` on the focused cell, right-click for a mouse,
      and a Flag mode toggle for a pointer with no second button, which on a phone is every pointer.

      **Two drawing decisions that only the browser could settle.** The board is the well and the
      closed cells are raised on it, not the other way round: the surface ramp is not a straight line
      of lightness, and `--c-surface-3` is the darkest of the four in dark mode and the lightest in
      light. Drawn the other way, a closed cell and an opened one were nearly identical in dark
      modern, where there is no bevel to carry the difference either. And in light mode the two
      surfaces are both a shade off white, so the closed cell takes a `--c-line` hairline, which is
      what makes it a cell in both polarities.

      Counts stay in the theme's ink. The traditional colour per number is eight hues nothing has
      measured for contrast, and a retro that spends eight colours is not retro. Only the flag and the
      mine are coloured, both `--c-select`.

      **The class was called `hidden` for one revision**, which is a Tailwind utility for
      `display: none`. It survived on scoped-selector specificity alone. Renamed to `closed`, because
      a component class that only works because Svelte's hash outranks a global utility is a
      coincidence, not a design.

      Verified by driving headless Chrome over CDP against the preview build, in all three skins: the
      launcher opens Minesweeper, the board is one tab stop with focus on the first cell, the arrows
      walk it and a step off the edge stays put, F plants and lifts a flag and the counter follows, a
      flagged cell refuses to open, the first press opens a region and is never a mine, flag mode
      plants one by pointer, New game closes every cell, and Escape closes the window and returns
      focus to the launcher. Checked again in light mode on a second theme, which is where both
      drawing decisions above came from.

Deferred, and deliberately: a falling-block puzzle (~2 days) and a maze chase (~4+ days). The
maze chase is both the highest effort and the highest legal risk on the list. If either gets
built, it ships under its own name with its own art. Mechanics are not copyrightable; names,
character designs, and specific visual expression are, and both franchises enforce.

### 5.4 Motion across all three games (~0.5 day)

**Opened after the fact, at the reviewer's call: the games changed state without drawing the
change.** Each of the three replaced a board between one frame and the next. Snake hopped a whole
cell every 110ms, 2048 teleported every tile at once, and Minesweeper's flood opened a region of
fifty cells in a single frame, which is what made it read as a screen redraw rather than as
something the press caused.

- [x] **Play is its own motion budget.** `--dur-play` and `--ez-play` per skin, beside the chrome
      pair that was already there, and retro is the reason the split exists rather than a reuse of
      `--dur-fast`. Its chrome durations are zero because System 7 did not animate a window growing
      into place, and a sprite crossing a playfield is not that kind of flourish: a 1-bit machine
      drew every frame of one. So retro spends 90ms with no easing curve, which is what a redraw
      looked like, and never `steps()`, which would hold a tile still and then teleport it late.
      Modern 120ms on the standard curve, glass 200ms on its softer one. `tokens.test.ts` already
      holds every skin to the same token set, so adding the pair to one skin demanded it of all
      three.

- [x] **Snake interpolates the tick.** Placement moved from `inset-*` to `translate`, which is
      ledger #24's rule and here it is also the only version that can move at all: an interpolated
      `inset` is a layout pass per frame per segment. Keying by index already meant segment *n*
      renders what segment *n-1* held, so every segment travels exactly one cell per tick and one
      `transition: translate` is the whole crawl.

      **Its duration is the one number in this task that is not a skin token, and it cannot be
      one.** Shorter than the tick and the snake arrives early and sits still; longer and it never
      finishes, so it trails its own logical position by a fixed amount for the rest of the game.
      `TICK` goes to CSS as a custom property and the easing is linear, because this is not a
      flourish over a state change, it is the state change drawn continuously.

      The food is the exception the crawl would break: it never travels, it appears somewhere else,
      and under one rule for every `.cell` it would sail across the board through a snake that had
      been nowhere near it. So it keeps no transition and is wrapped in `{#key}` on its own
      coordinates, which makes a respawn a new element and replays its pop.

- [x] **2048 records what the move did.** Two boards a press apart do not say which tile came from
      where, and that is exactly what has to be drawn. `move()` now returns a `Move` beside the
      board: the distance travelled by the tile now at each index, which destinations are merges,
      the consumed half of each merge, where the spawn landed, and the direction it was all along.

      Distances rather than source indices, because a mover only ever travels toward index 0 of its
      own line and the component knows the axis from `dir`. That is what lets the three animation
      grids ride through the existing transposes untouched: `rows`, `transpose` and `flip` became
      generic, a per-cell scalar reorients exactly like a value does, and there is no second mapping
      to keep in step with the first.

      **The ghost is the half of a merge with no cell of its own.** Two tiles land in one
      destination and only one element is drawn there, so without a record of the other, a tile at
      the far edge vanishes on the spot while nothing anywhere moves. It rides inside the
      destination cell rather than loose on the board, so it needs no grid slot that would push the
      sixteen real ones around, and it is gone on the frame the merge pops.

      **The cells are keyed by the move count, which is what replays anything at all.** A CSS
      animation starts when its element is created; changing a custom property on an element that is
      already there changes nothing. Sixteen spans per press is the cost, and the alternative is
      retriggering by hand across two frames. `moves` and not `score`, because a move that merges
      nothing still scores nothing and still moved, and a blocked press increments neither, so the
      board correctly holds still against a wall.

- [x] **One Svelte defect found by measuring, and it generalises.** The two animation slots on a
      tile were first switched by custom property, `animation: var(--a-move, none) …`, with `.slid`
      and `.merged` setting the names. Nothing moved. Svelte renames a component's `@keyframes` to
      a scoped name and rewrites the `animation` declarations that reference it, and a name arriving
      through `var()` is a string it cannot see: the keyframes were scoped, the references were not,
      and the only rule in the file that animated was the one literal reference. It looks exactly
      like a slide that is too subtle, the way 5.3's `box-shadow` `none` looked exactly like a ring
      that is too subtle. **An animation name goes where the compiler can read it**, which cost one
      repeated declaration and source order between `.slid` and `.merged`.

      It is also why the CDP harness matches keyframe names by suffix: what the Animation domain
      reports is `svelte-1foej5q-tile-ghost`, not `tile-ghost`.

- [x] **Minesweeper opens outward.** A revealed cell here is the board showing through, so there is
      nothing to animate in: what moves is the closed cell that was covering it. Every opened cell
      draws that lid as `::after` and takes it away on a delay set by the Chebyshev distance from
      the press, so the flood arrives as a ring travelling out rather than as a region that was
      always open.

      The lid is in the same selector list as `.closed` rather than repeating its four
      declarations, because a lid is by definition a closed cell and the moment those two drift the
      reveal animates away something the board never showed. Base `opacity: 0` with the keyframes
      holding it at 1, so it needs no fill mode to stay gone afterwards, only `backwards` to keep it
      there through its own wait. The flag pops on the mark alone, since the cell it lands on was
      already there.

- [x] **Reduced motion needed nothing new, which was the point of doing all of it in CSS.** No new
      `transition:` directive exists, so `motion.test.ts` is untouched and 2.14's `|global` rule
      still holds every directive in the repo. The blanket rule in `app.css` reaches every one of
      these, and 2.10's two delay lines, which nothing set at the time, are what keep the ripple and
      the pop's wait from surviving the preference. Measured: every duration comes back at 1ms and
      every delay at 0, in all three skins, and all three games stay fully playable at 1ms, which is
      the same call `Snake.svelte` already made about its clock.

- [x] **Tests.** `tiles.test.ts` gained the move record, which nothing in the game reads and which
      is therefore only ever as right as its cases: distance to a destination, the same distance
      whichever direction produced it, the mark on a merge, the ghost and its longer distance, a
      move that merges nothing leaving none, and the two vertical cases that catch a record built
      against the flat array, which lands its distances in the right row and the wrong column. Plus
      an invariant inside the existing played-to-the-end game: a record can never point at an empty
      cell, and a ghost belongs to a merge or to nothing.

      Verified by driving headless Chrome over CDP against the preview build, reading the Animation
      domain rather than computed styles, in all three skins with a reduced-motion control run.
      Snake starts twelve 110ms `CSSTransition`s per press and its head sits at `1237.56%` mid-tick
      where the reduced run reads `1300%` both samples; 2048 starts `tile-slide`, `tile-spawn`,
      `tile-pop` and `tile-ghost` at the skin's own duration with the landing pair delayed by one
      full duration and the ghost travelling alongside; Minesweeper starts one lid per opened cell,
      41 to 64 of them, at five distinct ring delays that scale with the skin. No page errors in any
      skin, and every tile on every board still a power of two.

      **One harness fact worth carrying forward, in the spirit of 2.15.** Driving three apps in and
      out of one long-lived document wedges the CDP session after the third window: the point it
      stops moves with the script, so it is the session and not the page. A fresh document per app
      costs a second and sidesteps it. The profile directory must also be unique per run, or a
      second Chrome exits on the lock while its client waits forever on a socket nothing will
      answer.

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

6.8 Structured data and index verification, which can only happen against the live host: Rich
Results Test on one page of each JSON-LD type, Search Console connected with the sitemap
submitted, and a check that the canonical host in the served HTML matches the host serving it.
That last one is the failure `SITE_URL` is a constant to make loud, and it is the one to run
first on the day mobashirmonim.com is pointed at the Worker.

---

## Sequencing notes

- Phase 1 gates everything. Do not start the shell before the styleguide is signed off, or the
  reskin gets relitigated inside feature work.
- Running order is 0, 1, 3, 2, 4, 5, 6. Phase 3 comes before the shell because the shell opens
  windows onto content, and content built after the shell means building it twice.
- Phase 4 apps are independent of each other and can be built in any order or in parallel.
- Phase 5 is genuinely optional and can slip past launch without harm.
- Deploy at the end of every phase. The pipeline exists from Phase 0 precisely so this is free.
