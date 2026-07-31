<script lang="ts">
	import Boot from '$lib/components/Boot.svelte';
	import Desktop from '$lib/components/Desktop.svelte';
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import Head from '$lib/components/Head.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import IconGrid from '$lib/components/IconGrid.svelte';
	import WindowLayer from '$lib/components/WindowLayer.svelte';
	import { app, APP_KIND, APPS, SETTINGS_ID } from '$lib/apps';
	import { about } from '$lib/content/about';
	import { OS_NAME, OS_VERSION } from '$lib/os';
	import { graph, PERSON as person } from '$lib/seo';
	import { node, nodes, root, summary } from '$lib/tree';
	import { current, windows } from '$lib/windows.svelte';

	/** Desktop selection. Purely a view state, and the desktop has no sidebar to feed. */
	let selected = $state<string | undefined>();

	/**
	 * Escape deselects, the last of the four keys the grid pattern owes. On `<svelte:window>` so
	 * that it works wherever focus is on the desktop, and safe there because every open window
	 * stops its own Escape before it reaches this: inside a window the key closes the window.
	 */
	function onkeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') selected = undefined;
	}

	const aboutNode = nodes[about.slug];

	/**
	 * What the dock draws, which is one entry per open window rather than a count per kind. The
	 * name is the window's current title, the same string its title bar carries, so the context
	 * menu names what you would actually be looking at and not what the window was opened from.
	 */
	const openWindows = $derived(
		windows.all.map((w) => ({
			id: w.id,
			kind: w.kind,
			name: app(w.id)?.name ?? node(current(w))?.name ?? w.id
		}))
	);
</script>

<!-- The root graph is the person and the site and nothing else. Every other page carries the same
     two nodes and adds its own, so the whole site describes one person rather than thirty. -->
<Head title="{person}, {about.title}" description={summary(aboutNode)} path="/" jsonld={graph()} />

<!--
	The shell. Everything it opens is a real route with its own server-rendered HTML, so this page
	is a presentation layer over that content and not the only place it exists (ledger #12).

	With JavaScript off every icon is the link it looks like and the site is a plain, navigable
	document. With JavaScript on the same click opens a window instead.
-->
<svelte:window {onkeydown} />

<div class="shell">
	<Desktop class="ground" scene>
		{#snippet masthead()}
			<!--
				The mark, and under it the heading the page owes anyway. It used to be visually hidden
				with the icons in a column down the left edge, which on a wide screen is where nobody
				looks: the four places to go were the entire product and half the visitors never found
				them. Centring the pair puts both where the eye already is, and the `h1` stops being a
				thing only a crawler reads.

				A drawn mark rather than the name set large: a wordmark in the chrome face is what the
				boot screen already is, and repeating it here made the desktop read as a second boot
				screen. The tile is where the skins differ, and the glyph is deliberately not skinned,
				because the OS sits above the skin.

				The line under the heading is 7.2, and it is one sentence answering the first thing the
				first visitor said: nothing on the page told them what they were looking at, so four
				folder icons under a name and a job title read as links to four pages, and a page that
				opens a window instead read as a page that broke. It names the metaphor and stops
				there. What to do about it is the welcome window's sentence, because that one has to
				change with the click-mode setting and this one has to be true in every skin, in every
				mode, forever.
			-->
			<div class="masthead">
				<span class="mark"><Icon name="logo" label={OS_NAME} size="var(--logo-glyph)" /></span>
				<h1>{person}, {about.title}</h1>
				<p class="tagline">{OS_NAME} {OS_VERSION}, a desktop in your browser</p>
			</div>
		{/snippet}

		<IconGrid>
			{#each root as id (id)}
				{@const item = nodes[id]}
				<DesktopIcon
					name={item.name}
					href={item.href}
					kind={item.kind}
					selected={selected === id}
					open={windows.byId(id) !== undefined}
					onopen={() => windows.open(id, item.kind)}
					onselect={() => (selected = id)}
				/>
			{/each}
		</IconGrid>
	</Desktop>

	<WindowLayer />

	<div class="dock-slot">
		<Dock
			open={openWindows}
			apps={APPS}
			onlaunch={(id) => windows.open(id, APP_KIND)}
			onsettings={() => windows.open(SETTINGS_ID, APP_KIND)}
			onrestore={(id) => windows.restore(id)}
			onrestorekind={(kind) => windows.restoreKind(kind)}
		/>
	</div>
</div>

<!-- Over the desktop, never instead of it: the content beneath already exists in the DOM, which
     is the whole of ledger #12 held to even here. -->
<Boot />

<style>
	/* `clip` rather than `hidden` for the reason spelled out in Window.svelte: a hidden box is
	   still scrollable by script, so it can be scrolled out from under its own fixed dock by
	   nothing more than focusing something inside a window. */
	.shell {
		position: relative;
		min-height: 100dvh;
		overflow: clip;
	}

	/* The ground fills the shell so the dither and the wash cover the viewport, not just the
	   rows of icons. */
	.shell :global(.ground) {
		min-height: 100dvh;
		padding-bottom: calc(var(--dock-h) + 2rem);
	}

	.masthead {
		--logo-glyph: 2.75rem;

		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.875rem;
		text-align: center;
	}

	/*
	   The tile, which is the whole of what the skins get to say about the logo: `--r-lg` squares it
	   off in retro and rounds it hard in glass, `--elev-1` is a hard 2px offset there and a soft
	   blur here, and the bevel resolves to `none` in the two skins that have no bevels.

	   Inverted, and that is what makes it read as a mark rather than as a letter someone set large:
	   a solid tile with the glyph knocked out of it is what an application icon has always been.
	   `--c-fg-1` on `--c-surface-1` is the pair table's own 4.5:1 guarantee read backwards, so it
	   holds in both polarities, and it flips with them: a black tile in light, a white one in dark.

	   No accent, in any skin. A coloured mark would be a third place retro spends a budget that
	   stops at the title bar and the selection, and the OS sits above the skin anyway.
	*/
	.mark {
		display: grid;
		place-items: center;
		width: calc(var(--logo-glyph) + 1.75rem);
		height: calc(var(--logo-glyph) + 1.75rem);
		color: var(--c-surface-1);
		background: var(--c-fg-1);
		border-radius: var(--r-lg);
		box-shadow: var(--elev-1);
	}

	@media (min-width: 48rem) {
		.masthead {
			--logo-glyph: 3.5rem;
		}
	}

	.masthead h1 {
		color: var(--c-fg-2);
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		font-weight: 400;
		letter-spacing: var(--tracking-ui);
	}

	/*
	   Smaller than the heading and quieter, because it is the caption to it and not a second
	   heading. `--c-fg-2` rather than `--c-fg-3`: this line sits over the wallpaper, where 6.2's
	   whole finding was that the muted token is the one that runs out of contrast first, and a
	   sentence nobody can read explains nothing.

	   The gap is tightened against the heading so the two read as one block rather than as a
	   heading and an unrelated line under it.
	*/
	.masthead .tagline {
		margin-top: -0.5rem;
		color: var(--c-fg-2);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
	}

	/*
	   Fixed to the middle and exactly as wide as it is, not a full-width strip with the dock
	   centred inside it. The strip was a transparent band across the bottom of the screen that
	   still swallowed every press that landed on it, so the desktop under it was dead to the
	   pointer for the strip's whole width.
	*/
	.dock-slot {
		position: fixed;
		inset-block-end: 0.75rem;
		inset-inline-start: 50%;
		translate: -50%;
		max-width: calc(100vw - 1.5rem);
	}
</style>
