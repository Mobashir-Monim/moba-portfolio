# Portfolio (v2)

Personal portfolio for Mobashir Monim, built as a desktop operating-system metaphor. This
file is both the agent context and the spec. Read it before touching anything.

## Repo layout

```
portfolio/            <- this repo, github.com/Mobashir-Monim/moba-portfolio
  CLAUDE.md           <- this file
  BUILD-PLAN.md       <- the ordered work
  v2/                 <- the new site. All new work happens here.
```

The previous site is **not** vendored into this repo. It lives in its own repo,
`mosite-svelte-v2` (github.com/Mobashir-Monim/mosite-svelte-v2, checked out locally at
`~/mosite-svelte-v2`), built on SvelteKit 1 + Svelte 4 + Skeleton 2. It is referred to
throughout this file as **the old site**.

The old site is frozen. Never edit it, never import from it, never add it as a dependency.
It exists so the concept, the copy, the content data, and the assets can be read across and
ported by hand. Every file path in the defect ledger below is relative to the root of that
repo.

## Stack

| Concern | Choice |
|---|---|
| Framework | SvelteKit 2, Svelte 5 (runes) |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS v4, CSS-first config in `app.css` |
| Component library | None. No Skeleton, no shadcn, no UI kit. |
| Package manager / runtime | Bun. Never npm, yarn, or pnpm. |
| Adapter | `@sveltejs/adapter-cloudflare` |
| Hosting | Cloudflare Workers static assets, git-connected via Workers Builds |
| Analytics | Cloudflare Web Analytics |

### Commands

Run from `v2/`.

```bash
bun install
bun run dev
bun run build
bun run preview
bun run check      # svelte-check
bun run lint
bun run format
bun test           # bun's built-in test runner
```

## Hard rules

1. **Bun only.** No npm/yarn/pnpm in commands, docs, or CI.
2. **No new dependency** for anything a few lines of code or a native platform feature covers.
   Justify every addition to `package.json` in the commit message.
3. **Runes only for state.** `$state`, `$derived`, `$effect`, `$props`. No `writable()` unless
   the value genuinely lives outside the component tree, and if it does, read it with `get()`
   or `$store` syntax. Never call `.subscribe()` manually.
4. **No manual subscriptions, no manual event-listener cleanup** that Svelte can do for you.
   `$effect` returns its own teardown. `<svelte:window>` cleans itself up.
5. **CSS breakpoints for layout, JS only for behavior.** No user-agent sniffing, ever.
6. **Semantic HTML first.** A thing that navigates is `<a>`. A thing that acts is `<button>`.
   Never nest interactive elements.
7. **Everything prerenders.** All content is static data; there is no runtime data source.
8. **No em dashes** in any copy, comment, or commit. Use a comma or a colon.
9. **Simplest thing that works.** No abstraction with one caller, no config for a constant.

## Architecture decisions

### Rendering: dual layer, fully prerendered

The single largest failure of the old site was that all portfolio content only existed inside
windows that mounted on click, so search engines and link previews saw an empty page. This
build inverts that.

- Every piece of content (about, each experience, each project, each attainment) is a real
  route that server-renders complete semantic HTML: headings, paragraphs, lists, links.
- The OS shell is a **presentation layer over that same markup**, not a replacement for it.
  Opening a window renders the route's content component; there is one component per content
  type and both the plain route and the window use it.
- `export const prerender = true` in the root layout. The whole site ships as static files.
- With JavaScript disabled the site is a readable, navigable document. This is a requirement,
  not a nice-to-have. Test it.
- Full `<head>`: title, description, canonical, Open Graph, Twitter card, JSON-LD `Person`
  and `CreativeWork`. Generate per route. No `keywords` meta, it has been ignored for years.
- `robots.txt` and a generated `sitemap.xml`.

### State

One module owns window state, exposed as a rune-based store object (`.svelte.ts`). Shape it as
a flat array of window records plus derived helpers. Rules:

- Treat state as immutable at the boundary: produce a new array, assign it. Do not splice a
  shared reference and reassign the same object.
- Window stacking order is the array order. Focus moves a record to the end.
- Navigation history (`origin` / `tail` in the old site) is a **string id stack per window**,
  not object references. The old site stored whole window objects inside each other and
  created reference cycles.
- Drag position lives in component-local `$state` during the gesture and writes to the store
  once on pointerup. Never write to shared state on every pointermove.
- Every exported mutator gets a unit test. The old store had a live bug (`===` instead of `=`)
  precisely because nothing tested it.

### Responsive

Tailwind breakpoints and container queries. One markup tree, variant classes for the
differences. The old site duplicated the entire window markup for mobile and desktop; do not
do that.

For behavior that genuinely differs by input device, use `matchMedia('(pointer: coarse)')`
inside an `$effect`, never the user-agent string.

### Theming

CSS custom properties defined in `app.css`. Three independent axes, all set on `<html>`:

| Axis | Attribute | Values | Owns |
|---|---|---|---|
| Skin | `data-skin` | `modern`, `retro`, `glass` | Shape |
| Colour theme | `data-theme` | four palettes | Colour |
| Appearance | `class="dark"` | dark, light, auto | Ground polarity |

That is 24 valid combinations, and every one must pass WCAG AA.

**Skins own shape, themes own colour.** This split is the whole architecture, and it is what keeps
three skins from becoming three stylesheets. A skin block sets font families, radii, border
widths, chrome heights, shadow and blur recipes, and icon geometry. A theme block sets the surface
ramp, the text ramp, and the accent. Neither writes into the other's tokens.

Each skin decides how much of the accent to spend, and that budget is part of the skin, not the
theme:

- `modern` spends it throughout: accent, borders, focus rings, active icons.
- `retro` spends it only where System 7's Color control panel did, on the selection highlight and
  the title bar. Everything else stays greyscale. A colourised retro is not retro.
- `glass` spends it as the gradient stops.

**One markup tree.** Skins are token blocks plus a small number of rules scoped to
`[data-skin="..."]` for the things tokens genuinely cannot express: retro's pinstripe title bar,
dithered desktop, inset bevels, and selection-by-inversion; glass's `backdrop-filter`. The moment
a skin needs `{#if skin === 'retro'}` wrapped around duplicated chrome, it has become defect #27
with a new name. Reach for a token first, a scoped rule second, and a branch only after both fail.

**Icons** carry three variants for chrome glyphs only: folder, document, their open states, window
controls, chevron, apps, the four folder views, cog. Brand and social icons have one variant.

Skin, theme, and appearance must all be applied **before first paint** by a small inline script in
`app.html` that reads localStorage and sets the attributes. The old site hardcoded
`data-theme="crimson"` in the HTML and applied the saved theme after mount, so every
non-default user saw a flash.

### Motion

- Transition specific properties. Never `transition-all`.
- Prefer `transform` and `opacity`. Window position is `translate3d()`, never `left`/`top`.
- Svelte's built-in `transition:` directives handle enter and exit, including outro before
  removal. The old site hand-rolled this with `justOpened` / `justClosed` flags and
  `setTimeout(500)`; do not carry that mechanism across.
- Wrap every animation in `@media (prefers-reduced-motion: reduce)` or use Svelte's
  `reducedMotion` store. Reduced motion means instant state change, not a slower animation.

### Interaction

- Pointer Events (`pointerdown` / `pointermove` / `pointerup`) with `setPointerCapture`, so
  drag works with mouse, touch, and pen from one code path. The old site was mouse-only.
- The drag surface listens on itself once capture is set, not on `window`. The old site
  registered a global `mousemove` per open window.

## Concept spec

Carried over from the old site. The metaphor is the product; keep the personality.

**The OS is called mobOS**, version 2.0, matching the site. The owner's handle wearing an
operating system's suffix, so the name says whose machine this is, and it keeps the `M` that
`MDir` and `MDoc` already lean on. It sits above the skin, so it reads the same in pinstripes as
in monospace.

The name lives in one exported constant in `src/lib/`, never as a string literal in a component.
It surfaces in the boot sequence, the Terminal prompt and hostname, System Info, the file-type
labels, and the `404` voice, and those must never drift apart.

**Boot screen.** Logo, progress bar, rotating fake POST/BIOS messages. Shows on first load
only, skippable, and never blocks content from existing in the DOM.

**Desktop.** Logo and name, plus the root directory rendered as an icon grid. Icons are
folders and documents.

**Windows.** Draggable, resizable, focusable, stackable, minimizable, closable. Chrome is a title
bar with the name, back/forward navigation for folder windows, and minimize/close controls. Folder
windows additionally show an info sidebar for the selected item, with the invented filesystem
details that give the piece its charm: fake size, `644` permissions, `MDir Folder` / `MDoc File`
type names, author. Keep those.

Drag and resize are one gesture module and are both pointer-only, which the accessibility contract
allows: position and size are presentation, and nothing is reachable only through them. Both clamp,
so a window can be neither dragged off the clipped desktop nor shrunk past its own title bar.

Opening from inside a window follows the kind. A folder is a place, so it opens in the same window
and pushes history; a document is not, so it gets its own window, the way double-clicking a file
has always handed it to a viewer. Opening something already open raises it instead of duplicating
it, so there is never a second window on one item.

**Folder views.** Four, the same four a Finder window offers and in the same order: icon, list,
column, gallery. The switcher is a segmented control at the right of the path row, which is that
row's second job. The view is per window and survives navigating inside it.

Icon and list honour the click-mode setting. Column and gallery always pick on one click and open
on two, whatever that setting says, because in those two picking is how you move. Column view
anchors at the folder the window is in, never at the root: the tree has no parent map by design, so
there is no single ancestor path to draw. Gallery previews the item's real write-up rather than a
large generic icon, because nothing on this site has a thumbnail.

**Dock.** Fixed to the bottom. Apps menu, settings, and grouped counts of open documents and
folders, clicking a group unminimizes that group.

**Settings window.** Skin, colour theme, appearance (dark / light / auto), and
open-on-single-click vs open-on-double-click. Persisted to localStorage. The first-visit
click-mode prompt from the old site stays.

Skin is the headline control, so it gets the most space and a live preview rather than a label
in a select. Switching skin re-dresses the running desktop in place; it never reloads, and open
windows keep their position and stacking order. Give the user a reason to try all three.

**Apps menu.** Real this time. A launcher for the app roster below. The old site shipped a
full-screen overlay reading "No apps installed yet"; that does not return.

### App roster

Tier 1, ships at launch: Résumé viewer, Case study reader, Mail, Terminal, System Info.
Tier 2, after launch: Snake, Calculator, one more game.

Two apps carry rules that outlive the build plan:

**Mail** is compose-and-send only, with an Inbox holding nothing but the auto-reply. It is the
only app with a trust boundary. Validation is server-side, always; client-side validation is UX,
not a control. Turnstile plus honeypot plus Worker-side rate limiting. Never echo submitted
content back into HTML unescaped. The send endpoint sets `prerender = false`.

**Calculator** carries a gag paywall: a "Calculator Pro" upsell at $499.99 with a working
escape hatch. **Never render a fake payment form, and never render a field that looks like it
takes card details.** That is the line between a joke and a dark pattern. If Stripe is added
later it must be Stripe Checkout, hosted and real, with a real product description, terms, and
a refund path, because at that point someone can actually be charged.

**Games** ship under their own names with their own art. Mechanics are not copyrightable;
names, character designs, and specific visual expression are. Tetris Holding and Bandai Namco
both enforce. Snake, 2048 (MIT licensed original), Minesweeper, and Solitaire are safe.

**Mobile.** Windows go full-screen with the same chrome. Tap opens directly, no
single/double distinction.

## Data model

Content is plain typed objects, not classes. The old site defined each shape twice: an
interface in the data file and a class in `models/` that re-declared every field and assigned
it in a constructor with no behavior. Do not carry that layer across.

- Types live in `src/lib/types/`, one concern per file. Never in a data file.
- Data lives in `src/lib/content/`, one file per collection.
- Content types: `about`, `company`, `experience`, `project`, `degree`, `publication`,
  `certification`, `skill`.
- Each content item carries a stable `slug` used for its route and as its window id.
- The directory tree is derived from the content collections, not hand-maintained alongside
  them.
- If any collection grows past a few hundred lines, move it to markdown or JSON and import it.
  The old site's `src/lib/data/projects.ts` reached 642 lines of prose compiled into the
  bundle.

## Porting from the old site

Nothing is imported. Everything is read across and rewritten. What is still needed, and when:

| What | Old site path | Needed by |
|---|---|---|
| Content data, roughly 1200 lines | `src/lib/data/*.ts` | Phase 3 |
| Fonts, Montserrat and Monofett `.ttf` | `src/assets/fonts/` | Phase 1, subset to woff2 |
| Company logos, 5 PNG | `src/assets/imgs/` | Phase 3 |
| 24 icon components | `src/assets/icons/` | Phase 1, redraw as one path map |
| Window, store, and layout markup | `src/components/`, `src/lib/store/` | Phase 1 and 2, reference only |

## Accessibility contract

The old site shipped zero `aria-*`, zero `role`, negative tabindex throughout, and buttons
nested three deep. It was mouse-only. Non-negotiable here:

- The window is a `<section>` (or `role="dialog"` where modal semantics apply) with
  `aria-label` set to its title, not a `<button>`. Focus on click via a handler on a
  non-interactive element or a dedicated focus affordance.
- Title bars are not buttons. Drag handles are `<div>` with pointer handlers plus keyboard
  move support, or drag is simply mouse-optional.
- Every icon-only control has an accessible name (`aria-label` or visually hidden text).
- Desktop and folder icons are a `role="grid"` / `role="listbox"` pattern, or plain links.
  Arrow keys move, Enter opens, Escape deselects. Never a bare `on:keydown` that fires on
  every key, which is what the old site did.
- Visible `:focus-visible` ring on everything focusable. Never remove the outline without
  replacing it.
- Open windows are reachable by keyboard. Escape closes the focused window.
- Real focus management: focus moves into a window when it opens and returns when it closes.
- All images have meaningful `alt`. Decorative images get `alt=""`.
- Colour contrast passes WCAG AA in every one of the themes, in both dark and light.
- Test with keyboard only and with a screen reader before calling anything done.

## Old site defect ledger

Every item below is a real defect found in the old site. None of them may reappear. Paths are
relative to the root of the `mosite-svelte-v2` repo.

### Correctness

| # | Where | Defect |
|---|---|---|
| 1 | `src/lib/store/global-directory-system-store-control.ts:59` | `originIndex === index;` is a comparison, not an assignment. `originIndex` stays `-1`, so line 66 runs `splice(-1, 1)` and deletes the last window in the store instead of the origin. Masked in normal use because the store is focus-ordered. |
| 2 | `src/lib/store/global-directory-system-store-control.ts:6` | `getGlobalDirectorySystemStore()` subscribes without unsubscribing. Called by nearly every mutator, including `moveWindow` on every mousemove, so subscribers leak at frame rate. |
| 3 | `+layout.svelte:20`, `ToolBar.svelte:15`, `WindowSidebar.svelte:18`, `DirectorySystemComponent.svelte:24`, `AppsMenu.svelte:8` | Component-scope `.subscribe()` with no teardown. One leak per component instance. |
| 4 | `WindowToolBar.svelte:43` vs `Window.svelte:91` | Toolbar is `h-[50px] sm:h-[30px]`, content is `h-[calc(100%-30px)]`. Below 640px the content overflows by 20px and is clipped. |
| 5 | `Window.svelte:28` | Width and height computed once in `onMount` and never recomputed, while position math uses live reactive dimensions. Resizing desyncs them. |
| 6 | `WindowSidebar.svelte:4` | `import {} from 'os';` in a browser component. Dead, and a build hazard. |
| 7 | `WindowSidebar.svelte` `calculateSize()` | Reads `unitDivisors[index + 1].divisor` with no bounds check. Throws past the GB row. |
| 8 | store mutators | Mutate a shared array in place, then `set()` the same reference. Works by accident, defeats equality checks. |
| 9 | store `goToOrigin` | `origin.tail = target` where `target.origin === origin` creates a reference cycle in state. |
| 10 | `DirectorySystemComponent.svelte` | Single-click open implemented with `setTimeout(..., 100)` racing against a mode re-check inside `onOpen`. |
| 11 | `DirectorySystemComponent.svelte` | Unkeyed `{#each}` with an unused index binding. DOM is recreated unnecessarily. |

### Discoverability

| # | Defect |
|---|---|
| 12 | All content mounts on click. Server HTML is a logo, one `h1`, and an empty grid. Projects and experience are invisible to search engines and link previews. |
| 13 | No Open Graph or Twitter card tags. Shared links render bare. |
| 14 | `keywords` meta tag present. Dead weight. |
| 15 | `<meta name="viewport">` missing `initial-scale=1`. |
| 16 | No sitemap, no robots.txt, no canonical, no structured data. |

### Accessibility

| # | Where | Defect |
|---|---|---|
| 17 | `Window.svelte:108`, `WindowToolBar.svelte:43` | Window is a `<button>` containing a toolbar `<button>` containing control `<button>`s. Invalid HTML, unpredictable in assistive tech. |
| 18 | codebase-wide | No `aria-*`, no `role`, no accessible names on icon-only controls. |
| 19 | commit history | Deliberate negative `tabindex` throughout, removing everything from the tab order. |
| 20 | `DirectoryContentContainerComponent.svelte` | `on:keydown={() => onSelect(name)}` with no key check, so Tab selects instead of navigating. No Enter or Space path to open. |
| 21 | codebase-wide | No visible focus styles. |
| 22 | `app.css` | No `prefers-reduced-motion` handling for the global `.transit` class or the 500ms window animations. |

### Performance and structure

| # | Where | Defect |
|---|---|---|
| 23 | `app.css` | `.transit` is `transition-all duration-300` applied to `body` and most elements. Animates layout properties. |
| 24 | `Window.svelte` | Position applied via `left`/`top` inline styles, forcing layout each frame, while `will-change-transform` is set and `transform` never used. |
| 25 | `WindowToolBar.svelte` | Each window registers its own global `mousemove`. N windows means N handlers plus N store writes per frame. |
| 26 | `Window.svelte` | Mouse events only. No touch or pointer support. |
| 27 | `Window.svelte:76-140` | Mobile and desktop branches duplicate the entire window markup for what is a sizing difference. |
| 28 | `MediaQuery.svelte` + `device-utils.ts` | Two parallel responsive systems alongside Tailwind breakpoints. `MediaQuery` reports `false` until mount, so SSR emits desktop then flips. |
| 29 | `device-utils.ts` | 2.5KB user-agent regex to answer a question `matchMedia` answers in one line. |
| 30 | `src/components/` | Sits outside `src/lib`, so files mix `$lib/...` imports with `../../assets/...` in the same module. |
| 31 | `src/lib/models/*.ts` | Eight classes that are pure data holders, each re-declaring an interface that lives in a data file. Roughly 350 lines with no behavior. |
| 32 | `src/lib/data/projects.ts` | 642 lines of prose content compiled into the bundle. |
| 33 | `app.html` + `+layout.svelte` | `data-theme="crimson"` hardcoded, saved theme applied after mount. Flash of the wrong theme. |
| 34 | `+layout.svelte` | Google Analytics injected via `{@html}` with no consent gate. |
| 35 | repo | No tests anywhere, including over the store logic that contained defect #1. |

## Definition of done

A change is not done until:

1. `bun run check` and `bun run lint` pass clean.
2. `bun test` passes, and any new store mutator or non-trivial branch has a test.
3. The affected page renders correctly with JavaScript disabled.
4. The affected UI is fully operable by keyboard, with visible focus.
5. Nothing in the defect ledger has been reintroduced.
