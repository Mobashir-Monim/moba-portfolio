<script lang="ts">
	import Boot from '$lib/components/Boot.svelte';
	import Desktop from '$lib/components/Desktop.svelte';
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import Head from '$lib/components/Head.svelte';
	import WindowLayer from '$lib/components/WindowLayer.svelte';
	import { APP_KIND, APPS, SETTINGS_ID } from '$lib/apps';
	import { about } from '$lib/content/about';
	import { graph, PERSON as person } from '$lib/seo';
	import { nodes, root, summary } from '$lib/tree';
	import { windows } from '$lib/windows.svelte';

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
	<!--
		The page still needs a heading, and the desktop in the 1.1 mockups carries no masthead.
		Visually hidden resolves both: the name is the boot screen's job, and the corner block that
		used to be here was invented rather than drawn.
	-->
	<h1 class="sr-only">{person}, {about.title}</h1>

	<Desktop class="ground">
		{#each root as id (id)}
			{@const item = nodes[id]}
			<DesktopIcon
				name={item.name}
				href={item.href}
				kind={item.kind}
				layout="row"
				selected={selected === id}
				open={windows.byId(id) !== undefined}
				onopen={() => windows.open(id, item.kind)}
				onselect={() => (selected = id)}
			/>
		{/each}
	</Desktop>

	<WindowLayer />

	<div class="dock-slot">
		<Dock
			folders={windows.counts.folder}
			documents={windows.counts.document}
			apps={APPS}
			onlaunch={(id) => windows.open(id, APP_KIND)}
			onsettings={() => windows.open(SETTINGS_ID, APP_KIND)}
			onfolders={() => windows.restoreKind('folder')}
			ondocuments={() => windows.restoreKind('document')}
		/>
	</div>
</div>

<!-- Over the desktop, never instead of it: the content beneath already exists in the DOM, which
     is the whole of ledger #12 held to even here. -->
<Boot />

<style>
	.shell {
		position: relative;
		min-height: 100dvh;
		overflow: hidden;
	}

	/* The ground fills the shell so the dither and the wash cover the viewport, not just the
	   rows of icons. */
	.shell :global(.ground) {
		min-height: 100dvh;
		padding-bottom: calc(var(--dock-h) + 2rem);
	}

	.dock-slot {
		position: fixed;
		inset-block-end: 0.75rem;
		inset-inline: 0;
		display: flex;
		justify-content: center;
		padding-inline: 0.75rem;
	}
</style>
