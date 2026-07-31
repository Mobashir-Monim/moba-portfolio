<script lang="ts">
	import { isDark, settings, update } from '$lib/appearance.svelte';
	import { APPS } from '$lib/apps';
	import BootScreen from '$lib/components/BootScreen.svelte';
	import AppContent from '$lib/components/apps/AppContent.svelte';
	import Desktop from '$lib/components/Desktop.svelte';
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import IconGrid from '$lib/components/IconGrid.svelte';
	import InfoSidebar from '$lib/components/InfoSidebar.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import ViewSwitcher from '$lib/components/ViewSwitcher.svelte';
	import Window from '$lib/components/Window.svelte';
	import FolderView from '$lib/components/views/FolderView.svelte';
	import { BRAND_NAMES, CHROME_NAMES } from '$lib/icons';
	import { BOOT_LINES, OS_NAME, OS_VERSION, OWNER, VIEW_LABEL, type View } from '$lib/os';
	import { nodes } from '$lib/tree';

	const COLOURS = [
		'--c-surface-0',
		'--c-surface-1',
		'--c-surface-2',
		'--c-surface-3',
		'--c-fg-1',
		'--c-fg-2',
		'--c-fg-3',
		'--c-line',
		'--c-line-strong',
		'--c-accent',
		'--c-accent-hover',
		'--c-on-accent',
		'--c-select',
		'--c-on-select',
		'--c-focus'
	];

	const SIZES = ['--fs-xs', '--fs-sm', '--fs-base', '--fs-lg', '--fs-xl', '--fs-2xl'];
	const FAMILIES = ['--ff-ui', '--ff-body', '--ff-mono'];
	const RADII = ['--r-sm', '--r-md', '--r-lg'];
	const WIDTHS = ['--bw', '--bw-strong'];
	const METRICS = [
		'--chrome-h',
		'--dock-h',
		'--icon-tile',
		'--icon-stroke',
		'--icon-cap',
		'--icon-join'
	];
	const MOTION = ['--dur-fast', '--dur-base', '--dur-slow', '--ez-standard', '--ez-out'];
	const TEXT_META = ['--lh-tight', '--lh-normal', '--tracking-ui'];
	/** The recipes that replaced the scoped skin rules CLAUDE.md budgeted for. */
	const CHROME = [
		'--window-bg',
		'--desktop-bg',
		'--sidebar-w',
		'--titlebar-pattern',
		'--title-align',
		'--bevel-out',
		'--bevel-in',
		'--path-prefix',
		'--sidebar-title-fg'
	];

	const ALL = [
		...COLOURS,
		...SIZES,
		...FAMILIES,
		...RADII,
		...WIDTHS,
		...METRICS,
		...MOTION,
		...TEXT_META,
		...CHROME
	];

	/** Resolved values, re-read whenever any axis changes. Empty with JavaScript off, which
	 *  costs the readouts and nothing else: the swatches themselves are pure CSS. */
	let resolved = $state<Record<string, string>>({});

	$effect(() => {
		void settings.skin;
		void settings.theme;
		void isDark();
		const style = getComputedStyle(document.documentElement);
		resolved = Object.fromEntries(ALL.map((t) => [t, style.getPropertyValue(t).trim()]));
	});

	/** The modal traps focus, so it has to be openable rather than permanently on the page. */
	let modal = $state(false);

	/** Every icon state at once. Nothing here is the real store; the desktop route is. */
	const DESKTOP = [
		{ name: 'Experience', kind: 'folder', selected: false, open: false },
		{ name: 'Projects', kind: 'folder', selected: true, open: false },
		{ name: 'Attainments', kind: 'folder', selected: false, open: true },
		{ name: 'About', kind: 'document', selected: false, open: false },
		{ name: 'Resume.pdf', kind: 'document', selected: true, open: true }
	] as const;

	/** The 1.1 scene, so the arrangement is checkable and not only the parts. */
	const SCENE_ROOT = [
		{ name: 'About Me', kind: 'document' },
		{ name: 'Experience', kind: 'folder' },
		{ name: 'Projects', kind: 'folder' },
		{ name: 'Attainments', kind: 'folder' }
	] as const;

	/**
	 * The four folder views, drawn over the real tree rather than over invented names: the list
	 * shows kind, size, and date, the gallery renders an item's actual write-up, and neither is
	 * checkable against placeholders. Each panel is live, so this is also where the views get
	 * clicked.
	 */
	const FOLDER = $derived(nodes.projects);
	let view = $state<View>('icon');
	let picked = $state<string | undefined>();

	const SCENE_FOLDER = [
		'bout',
		'blober',
		'lightsaml',
		'mongol-tori',
		'busso',
		'case-studies'
	] as const;

	/** What the dock is handed: one entry per open window, so it can group, badge, and list them. */
	const SCENE_DOCK = [
		{ id: 'projects', kind: 'folder', name: 'Projects' },
		{ id: 'lightsaml', kind: 'document', name: 'lightsaml' },
		{ id: 'busso', kind: 'document', name: 'busso' },
		{ id: 'bout', kind: 'document', name: 'bout' },
		{ id: 'app:terminal', kind: 'app', name: 'Terminal' }
	] as const;
</script>

<svelte:head>
	<title>Styleguide | {OS_NAME} {OS_VERSION}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-4xl px-6 py-10">
	<header class="mb-10">
		<h1 class="text-2xl font-semibold">{OS_NAME} {OS_VERSION} styleguide</h1>
		<p class="mt-2 text-fg-2">
			Skins own shape, themes own colour, appearance owns ground polarity. Three axes, 24
			combinations, every one of which has to pass AA.
		</p>
	</header>

	<section aria-labelledby="axes" class="mb-12">
		<h2 id="axes" class="mb-4 text-xl font-semibold">Axes, and the settings panel</h2>
		<p class="mb-4 text-sm text-fg-2">
			This is the real <code>SettingsPanel</code>, not a switcher built for the styleguide. Every
			section below re-dresses as you change it, which is the only honest way to check that a skin
			swap is a token swap. The skin tiles are live previews rendered under a nested
			<code>data-skin</code>, so three skins are on screen at once.
		</p>
		<SettingsPanel
			skin={settings.skin}
			theme={settings.theme}
			appearance={settings.appearance}
			wallpaper={settings.wallpaper}
			clickMode={settings.clickMode}
			dark={isDark()}
			onchange={update}
		/>
	</section>

	<section aria-labelledby="colour" class="mb-12">
		<h2 id="colour" class="mb-4 text-xl font-semibold">Colour, theme-owned</h2>
		<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each COLOURS as token (token)}
				<li class="rounded-md border border-line bg-surface-1 p-2">
					<span
						class="mb-2 block h-10 rounded-sm border border-line-strong"
						style="background: var({token})"
					></span>
					<code class="block text-xs">{token}</code>
					<span class="text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="type" class="mb-12">
		<h2 id="type" class="mb-4 text-xl font-semibold">Type, skin-owned</h2>

		<ul class="mb-6 space-y-2">
			{#each FAMILIES as token (token)}
				<li class="rounded-md border border-line bg-surface-1 p-3">
					<code class="text-xs text-fg-3">{token}</code>
					<p style="font-family: var({token})">
						{OS_NAME}
						{OS_VERSION}: the quick brown fox jumps over the lazy dog, 0123456789
					</p>
					<span class="text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</li>
			{/each}
		</ul>

		<p class="mb-2 text-sm text-fg-2">
			Only <code>glass</code> pays for a face, Montserrat as a variable font. The row below is the
			weight axis: if it renders as three identical lines under <code>glass</code>, the variable
			axis did not load and the browser is synthesising the bolds.
		</p>
		<ul class="mb-6 space-y-1">
			{#each [400, 600, 700] as weight (weight)}
				<li class="flex items-baseline gap-4">
					<code class="w-24 shrink-0 text-xs text-fg-3">{weight}</code>
					<span style="font-family: var(--ff-body); font-weight: {weight}">
						Mnemos remembers every window you opened
					</span>
				</li>
			{/each}
		</ul>

		<ul class="mb-6 space-y-1">
			{#each SIZES as token (token)}
				<li class="flex items-baseline gap-4">
					<code class="w-24 shrink-0 text-xs text-fg-3">{token}</code>
					<span class="w-16 shrink-0 text-xs text-fg-3">{resolved[token] ?? ''}</span>
					<span style="font-size: var({token})">Mnemos remembers</span>
				</li>
			{/each}
		</ul>

		<dl class="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
			{#each TEXT_META as token (token)}
				<dt><code class="text-xs text-fg-3">{token}</code></dt>
				<dd>{resolved[token] ?? ''}</dd>
			{/each}
		</dl>
	</section>

	<section aria-labelledby="shape" class="mb-12">
		<h2 id="shape" class="mb-4 text-xl font-semibold">Shape, skin-owned</h2>

		<div class="mb-6 flex flex-wrap gap-4">
			{#each RADII as token (token)}
				<div class="text-center">
					<span
						class="mb-1 block size-20 border border-line-strong bg-surface-2"
						style="border-radius: var({token})"
					></span>
					<code class="text-xs text-fg-3">{token}</code>
					<span class="block text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</div>
			{/each}
			{#each WIDTHS as token (token)}
				<div class="text-center">
					<span
						class="mb-1 block size-20 bg-surface-2"
						style="border: var({token}) solid var(--c-line-strong)"
					></span>
					<code class="text-xs text-fg-3">{token}</code>
					<span class="block text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</div>
			{/each}
		</div>

		<dl class="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
			{#each METRICS as token (token)}
				<dt><code class="text-xs text-fg-3">{token}</code></dt>
				<dd>{resolved[token] ?? ''}</dd>
			{/each}
		</dl>
	</section>

	<section aria-labelledby="icons" class="mb-12">
		<h2 id="icons" class="mb-4 text-xl font-semibold">Icons, chrome is skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			Chrome glyphs carry one path per skin, stroked in <code>currentColor</code> at
			<code>--icon-stroke</code>. All three ship in the markup and CSS picks, so switching skin
			redraws them with no script and they are still correct with JavaScript off. Retro's close and
			collapse boxes are System 7's, which is why neither of them is an X.
		</p>

		<ul class="mb-8 flex flex-wrap gap-3">
			{#each CHROME_NAMES as name (name)}
				<li
					class="flex w-28 flex-col items-center gap-2 rounded-md border border-line bg-surface-1 p-3"
				>
					<Icon {name} size={32} />
					<code class="text-xs text-fg-3">{name}</code>
				</li>
			{/each}
		</ul>

		<p class="mb-2 text-sm text-fg-2">
			The same glyph down the sizes it is actually used at: dock and title bar at 16, sidebar at 20,
			desktop tile at 48.
		</p>
		<ul class="mb-8 flex flex-wrap items-end gap-6">
			{#each [16, 20, 32, 48] as size (size)}
				<li class="flex flex-col items-center gap-2">
					<Icon name="folder" {size} />
					<code class="text-xs text-fg-3">{size}</code>
				</li>
			{/each}
		</ul>

		<h3 class="mb-2 text-lg font-semibold">Brand marks, one variant</h3>
		<p class="mb-4 text-sm text-fg-2">
			Filled, on the grid each was drawn on. A logo stroked at a hairline stops being the logo, so
			these do not follow the skin.
		</p>
		<ul class="flex flex-wrap gap-3">
			{#each BRAND_NAMES as name (name)}
				<li
					class="flex w-28 flex-col items-center gap-2 rounded-md border border-line bg-surface-1 p-3"
				>
					<Icon {name} size={32} />
					<code class="text-xs text-fg-3">{name}</code>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="elevation" class="mb-12">
		<h2 id="elevation" class="mb-4 text-xl font-semibold">Elevation, skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			A focused window has to read as above an unfocused one in every skin. Retro does it with a
			hard offset shadow rather than a blur, because System 7 had no blur.
		</p>
		<div class="flex flex-wrap gap-8 p-4">
			<div
				class="grid size-40 place-items-center rounded-lg border border-line bg-surface-1 text-sm shadow-window"
			>
				--elev-1
			</div>
			<div
				class="grid size-40 place-items-center rounded-lg border border-line bg-surface-1 text-sm shadow-window-focus"
			>
				--elev-2
			</div>
		</div>
	</section>

	<section aria-labelledby="motion" class="mb-12">
		<h2 id="motion" class="mb-4 text-xl font-semibold">Motion, skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			Retro is 0ms on purpose. Reduced motion collapses all of these to instant, site-wide.
		</p>
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
			{#each MOTION as token (token)}
				<dt><code class="text-xs text-fg-3">{token}</code></dt>
				<dd>{resolved[token] ?? ''}</dd>
			{/each}
		</dl>
	</section>

	<section aria-labelledby="budget" class="mb-12">
		<h2 id="budget" class="mb-4 text-xl font-semibold">Accent budget, skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			How much of the theme accent each skin is allowed to spend. Modern spends it throughout, retro
			spends it on the title bar and the selection only, glass spends it as gradient stops.
		</p>
		<div class="flex flex-wrap gap-4">
			<div class="w-64 overflow-hidden rounded-md border border-line">
				<div
					class="flex items-center px-3 text-sm"
					style="background: var(--titlebar-bg); color: var(--titlebar-fg); height: var(--chrome-h)"
				>
					Focused
				</div>
				<div class="bg-surface-1 p-3 text-sm">Window body on --c-surface-1</div>
			</div>
			<div class="w-64 overflow-hidden rounded-md border border-line">
				<div
					class="flex items-center px-3 text-sm"
					style="background: var(--titlebar-bg-idle); color: var(--titlebar-fg-idle); height: var(--chrome-h)"
				>
					Unfocused
				</div>
				<div class="bg-surface-1 p-3 text-sm">Window body on --c-surface-1</div>
			</div>
			<p class="w-64 rounded-md border border-line bg-surface-1 p-3 text-sm">
				Selected text renders like <mark class="bg-select text-on-select">this</mark>. Tab to any
				control above to see the focus ring at --ring.
			</p>
		</div>
	</section>

	<section aria-labelledby="chrome" class="mb-12">
		<h2 id="chrome" class="mb-4 text-xl font-semibold">Chrome recipes, skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			The five things <code>CLAUDE.md</code> budgeted a scoped
			<code>[data-skin]</code> rule for, and which all turned out to be tokens: retro's pinstripe,
			its dithered desktop, its bevels, its selection by inversion, and glass's blur. There are no
			scoped skin rules in <code>app.css</code> yet.
		</p>
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
			{#each CHROME as token (token)}
				<dt><code class="text-xs text-fg-3">{token}</code></dt>
				<dd class="truncate">{resolved[token] ?? ''}</dd>
			{/each}
		</dl>
	</section>

	<section aria-labelledby="window" class="mb-12">
		<h2 id="window" class="mb-4 text-xl font-semibold">Window chrome</h2>
		<p class="mb-4 text-sm text-fg-2">
			A <code>&lt;section&gt;</code> with an accessible name, a title bar that is a
			<code>&lt;div&gt;</code>, and controls that are the only buttons in the tree. Ledger #17 was
			three buttons nested inside each other. Body height comes from flex, not from
			<code>calc(100% - 30px)</code>, which is ledger #4. Folder windows carry nav and the info
			panel; document windows carry neither.
		</p>

		<div class="mb-4 h-80">
			<Window
				title="Projects"
				focused
				nav
				path="Projects"
				canBack
				onback={() => {}}
				onforward={() => {}}
				onminimize={() => {}}
				onclose={() => {}}
				class="h-full"
			>
				{#snippet sidebar()}
					<InfoSidebar
						name="Projects"
						kind="folder"
						size={412_734}
						items={12}
						modified="2026-03"
						author={OWNER}
					/>
				{/snippet}
				<h3 class="mb-2 text-lg font-semibold">Focused, folder</h3>
				<p class="text-fg-2">
					Nav pair, info panel, elevation at <code>--elev-2</code>. The panel sits beside the
					content above 32rem of window width and stacks under it below, from one container query
					and one markup tree. Ledger #27 was a second copy of all of this for mobile.
				</p>
			</Window>
		</div>

		<div class="h-56">
			<Window title="About.mdoc" onminimize={() => {}} onclose={() => {}} class="h-full">
				<h3 class="mb-2 text-lg font-semibold">Unfocused, document</h3>
				<p class="text-fg-2">
					Idle title bar, no pinstripes in retro, elevation drops to <code>--elev-1</code>. No nav,
					no info panel.
				</p>
			</Window>
		</div>
	</section>

	<section aria-labelledby="desktop" class="mb-12">
		<h2 id="desktop" class="mb-4 text-xl font-semibold">Icon states, both layouts</h2>
		<p class="mb-4 text-sm text-fg-2">
			Icons are plain links, which is what makes them work with JavaScript off and what gives them
			Enter for free. Ledger #20 was a bare <code>on:keydown</code> on a div, so Tab selected and nothing
			opened. Rest, selected, open, rest, selected and open. Hover the first one; selection reads as an
			inversion in retro only because its radius is 0.
		</p>
		<p class="mb-4 text-sm text-fg-2">
			One tile, both places. The desktop centres its grid under the mark and scales the tile with
			the viewport; a folder window packs from the start and keeps the base size, since a folder
			window is narrow whatever the display is. Same component, two declarations of one token.
		</p>
		<Desktop class="mb-4 rounded-md border border-line">
			<IconGrid>
				{#each DESKTOP as item (item.name)}
					<DesktopIcon
						name={item.name}
						href="#desktop"
						kind={item.kind}
						open={item.open}
						selected={item.selected}
					/>
				{/each}
			</IconGrid>
		</Desktop>
		<IconGrid class="rounded-md border border-line bg-surface-1 p-4">
			{#each DESKTOP as item (item.name)}
				<DesktopIcon
					name={item.name}
					href="#desktop"
					kind={item.kind}
					open={item.open}
					selected={item.selected}
				/>
			{/each}
		</IconGrid>
	</section>

	<section aria-labelledby="views" class="mb-12">
		<h2 id="views" class="mb-4 text-xl font-semibold">Folder views</h2>
		<p class="mb-4 text-sm text-fg-2">
			The four a Finder window offers, over one set of items and one set of callbacks, so the window
			never learns which is on screen and the plain routes keep taking the default. Icons and list
			honour the click-mode setting; columns and gallery always pick on one click and open on two,
			because in those two picking is the navigation.
		</p>
		<p class="mb-4 text-sm text-fg-2">
			Columns anchor at the folder you are in rather than at the root: this tree has no parent map
			by design, since a project is listed under both its experience and under Projects. Gallery
			previews the item's real write-up, because nothing here has a thumbnail and a large generic
			icon would be a dead pane.
		</p>

		<div class="mb-4 flex items-center gap-3">
			<ViewSwitcher {view} onview={(next) => (view = next)} />
			<span class="text-sm text-fg-3">{VIEW_LABEL[view]}</span>
		</div>

		<div class="rounded-md border border-line bg-surface-1 p-4">
			<FolderView
				node={FOLDER}
				{view}
				selected={picked}
				onselect={(child) => (picked = child.id)}
				onopen={(child) => (picked = child.id)}
			/>
		</div>
	</section>

	<section aria-labelledby="composition" class="mb-12">
		<h2 id="composition" class="mb-4 text-xl font-semibold">Desktop composition</h2>
		<p class="mb-4 text-sm text-fg-2">
			The whole scene, and the reason this section exists. Every component above passed on its own
			while the desktop they compose into did not match the drawing the direction was chosen from:
			the icons were a grid instead of a list, the title bar's controls were on the wrong side, and
			the path row was missing entirely. A parts list cannot catch an arrangement, so the
			arrangement is checked here.
		</p>
		<div class="relative h-[30rem] overflow-hidden rounded-md border border-line">
			<Desktop class="h-full">
				<IconGrid>
					{#each SCENE_ROOT as item (item.name)}
						<DesktopIcon name={item.name} href="#composition" kind={item.kind} />
					{/each}
				</IconGrid>
			</Desktop>

			<div class="absolute top-6 left-[26%] h-[21rem] w-[70%]">
				<Window
					title="Projects"
					focused
					nav
					path="Projects"
					onminimize={() => {}}
					onclose={() => {}}
					class="h-full"
				>
					{#snippet sidebar()}
						<InfoSidebar
							name="lightsaml"
							kind="document"
							size={18_841}
							modified="2024-11"
							author={OWNER}
						/>
					{/snippet}
					<IconGrid>
						{#each SCENE_FOLDER as name (name)}
							<DesktopIcon
								{name}
								href="#composition"
								kind={name === 'case-studies' ? 'folder' : 'document'}
								selected={name === 'lightsaml'}
							/>
						{/each}
					</IconGrid>
				</Window>
			</div>

			<div class="absolute inset-x-0 bottom-3 flex justify-center">
				<Dock open={SCENE_DOCK} onsettings={() => {}} />
			</div>
		</div>
	</section>

	<section aria-labelledby="dock" class="mb-12">
		<h2 id="dock" class="mb-4 text-xl font-semibold">Dock</h2>
		<p class="mb-4 text-sm text-fg-2">
			Apps, settings, then one group per kind of open window: folders, documents, and apps, each a
			glyph with its count badged on it. A group at zero is absent rather than empty. Apps opens the
			launcher, and is disabled when the roster it is handed is empty, which is the second dock
			below.
		</p>
		<p class="mb-4 text-sm text-fg-2">
			Clicking a group brings the whole kind back. Right-clicking it, or pressing Shift+F10 on it,
			opens a menu of the windows in that group so one can be picked out by name. Both the launcher
			and that menu are native popovers, so they live in the top layer and position themselves
			against the viewport rather than against the dock they belong to. On the desktop that is
			exact, since the dock is fixed to the bottom too. Here they open above where a real dock would
			be.
		</p>
		<div class="flex flex-wrap items-end gap-6">
			<Dock open={SCENE_DOCK} apps={APPS} onlaunch={() => {}} onsettings={() => {}} />
			<Dock onsettings={() => {}} />
		</div>
	</section>

	<section aria-labelledby="boot" class="mb-12">
		<h2 id="boot" class="mb-4 text-xl font-semibold">Boot screen</h2>
		<p class="mb-4 text-sm text-fg-2">
			The sharpest skin test in phase 1: a POST sequence in retro, a systems tool in modern, and
			something other than a soft gradient in glass. The thermometer is a recessed well in retro and
			a flat track elsewhere, from <code>--bevel-in</code> resolving to <code>none</code>.
		</p>
		<BootScreen progress={62} lines={BOOT_LINES.slice(0, 4)} onskip={() => {}} />
	</section>

	<section aria-labelledby="apps" class="mb-12">
		<h2 id="apps" class="mb-4 text-xl font-semibold">Apps</h2>
		<p class="mb-4 text-sm text-fg-2">
			An app is a window with no node behind it: no route, no sitemap entry, no info sidebar. One
			dispatcher stands between an id and the app, the way <code>NodeContent</code> does for content types,
			so the window frame never learns which app it is holding.
		</p>
		<p class="mb-4 text-sm text-fg-2">
			System Info reads its numbers rather than storing them. Versions come from
			<code>package.json</code> at build time, the weight comes from the browser's own resource timings,
			and the dress comes from the settings store, so the panel above changes it. Lighthouse scores are
			absent until 6.1 has run Lighthouse.
		</p>
		<div class="grid gap-4 md:grid-cols-2">
			{#each APPS as item (item.id)}
				<Window title={item.name} class="h-96">
					<AppContent id={item.id} />
				</Window>
			{/each}
		</div>
	</section>

	<section aria-labelledby="modal" class="mb-12">
		<h2 id="modal" class="mb-4 text-xl font-semibold">Modal shell</h2>
		<p class="mb-4 text-sm text-fg-2">
			<code>role="dialog"</code> with <code>aria-modal</code> and a heading it points at. The backdrop
			is not a click target: an escape route that only a mouse can reach is not an escape route. Tab cycles
			inside it, Escape closes it, and focus returns to the button below. It opens rather than sitting
			on the page, because a trapped dialog cannot be a swatch.
		</p>
		<button
			type="button"
			class="rounded-sm border border-line-strong bg-surface-1 px-3 py-1 text-sm"
			onclick={() => (modal = true)}
		>
			Open the modal
		</button>
		{#if modal}
			<Modal class="fixed inset-0 z-50" title="Open on one click?" onclose={() => (modal = false)}>
				{#snippet actions()}
					<button
						type="button"
						class="rounded-sm border border-line-strong bg-surface-1 px-3 py-1 text-sm"
						onclick={() => (modal = false)}
					>
						Two clicks
					</button>
					<button
						type="button"
						class="rounded-sm border border-line-strong bg-accent px-3 py-1 text-sm text-on-accent"
						onclick={() => (modal = false)}
					>
						One click
					</button>
				{/snippet}
				<p>
					{OS_NAME} can open an item on a single click, or select on one and open on two, the way a desktop
					usually does. You can change this later in Settings.
				</p>
			</Modal>
		{/if}
	</section>
</div>
