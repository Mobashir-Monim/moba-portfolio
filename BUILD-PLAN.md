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

- [ ] 2.10 `prefers-reduced-motion` honoured throughout. The global CSS rule and the window
      transition already are; the remaining animations arrive with the apps.

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

A real shell over the content tree, which already exists as structured data, so the command
layer is small relative to what it buys you.

Commands: `ls`, `cd`, `cat`, `open`, `whoami`, `contact`, `theme`, `help`, `clear`. History with
arrow keys, tab completion, and a `404`-style error voice consistent with the OS.

Highest signal-to-effort item in the project. It demonstrates engineering judgment more directly
than any game, and it lands with exactly the audience that decides whether to contact you.

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
