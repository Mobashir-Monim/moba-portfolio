<script lang="ts">
	import Boot from '$lib/components/Boot.svelte';
	import Desktop from '$lib/components/Desktop.svelte';
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import WindowLayer from '$lib/components/WindowLayer.svelte';
	import { about } from '$lib/content/about';
	import { SETTINGS_ID } from '$lib/os';
	import { nodes, root, summary } from '$lib/tree';
	import { windows } from '$lib/windows.svelte';

	/** Desktop selection. Purely a view state, and the desktop has no sidebar to feed. */
	let selected = $state<string | undefined>();

	const person = `${about.person.first} ${about.person.last}`;
</script>

<svelte:head>
	<title>{person}, {about.title}</title>
	<meta name="description" content={summary(nodes[about.slug])} />
</svelte:head>

<!--
	The shell. Everything it opens is a real route with its own server-rendered HTML, so this page
	is a presentation layer over that content and not the only place it exists (ledger #12).

	With JavaScript off every icon is the link it looks like and the site is a plain, navigable
	document. With JavaScript on the same click opens a window instead.
-->
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
			onsettings={() => windows.open(SETTINGS_ID, 'document')}
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
