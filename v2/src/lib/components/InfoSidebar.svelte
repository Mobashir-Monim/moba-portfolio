<script lang="ts">
	import { formatSize } from '$lib/fs';
	import { FILE_TYPE, PERMISSIONS, type Kind } from '$lib/os';
	import Icon from './Icon.svelte';

	let {
		name,
		kind,
		size,
		author,
		modified,
		items
	}: {
		name: string;
		kind: Kind;
		/** Bytes. Invented, like the rest of the filesystem, but formatted like a real one. */
		size: number;
		author: string;
		/** Already formatted. The sidebar does not own a date format. */
		modified: string;
		/** Folders only. A document has no contents to count. */
		items?: number;
	} = $props();

	const rows = $derived([
		['Kind', FILE_TYPE[kind]],
		['Size', formatSize(size)],
		...(items === undefined ? [] : [['Contains', `${items} item${items === 1 ? '' : 's'}`]]),
		['Modified', modified],
		['Permissions', PERMISSIONS],
		['Author', author]
	] as const);
</script>

<div class="info">
	<div class="head">
		<Icon name={kind} size={40} />
		<p class="name">{name}</p>
	</div>

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

	.head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding-bottom: 0.75rem;
		margin-bottom: 0.75rem;
		border-bottom: var(--bw) solid var(--c-line);
		text-align: center;
	}

	.name {
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
