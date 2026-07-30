<script lang="ts">
	import { formatSize } from '$lib/fs';
	import { FILE_TYPE, PERMISSIONS, type NodeKind } from '$lib/os';

	let {
		name,
		kind,
		size,
		author,
		modified,
		items
	}: {
		name: string;
		kind: NodeKind;
		/** Bytes. Invented, like the rest of the filesystem, but formatted like a real one. */
		size: number;
		author: string;
		/** Already formatted. The sidebar does not own a date format. */
		modified: string;
		/** Folders only. A document has no contents to count. */
		items?: number;
	} = $props();

	// Field names and order are the 1.1 mockups': Kind, Size, Perms, Owner, Modified. `Contains`
	// is the one addition, because no mockup ever shows a folder selected and a folder with no
	// item count is a sidebar that has less to say than the icon beside it.
	const rows = $derived([
		['Kind', FILE_TYPE[kind]],
		['Size', formatSize(size)],
		...(items === undefined ? [] : [['Contains', `${items} item${items === 1 ? '' : 's'}`]]),
		['Perms', PERMISSIONS],
		['Owner', author],
		['Modified', modified]
	] as const);
</script>

<div class="info">
	<!-- The filename alone, in `--sidebar-title-fg`. No glyph: the icon it describes is already
	     on screen and selected, so repeating it at 40px spends the panel's best space saying
	     nothing new. -->
	<p class="name">{name}</p>

	<dl>
		{#each rows as [label, value] (label)}
			<dt>{label}</dt>
			<dd>{value}</dd>
		{/each}
	</dl>
</div>

<style>
	.info {
		padding: 0.75rem;
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
	}

	.name {
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
		border-bottom: var(--bw) solid var(--c-line);
		color: var(--sidebar-title-fg);
		font-size: var(--fs-sm);
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.75rem;
	}

	dt {
		color: var(--c-fg-3);
	}

	dd {
		text-align: end;
		color: var(--c-fg-1);
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}
</style>
