<script lang="ts">
	import type { Skin } from '$lib/appearance.svelte';

	let { skin }: { skin: Skin } = $props();
</script>

<!--
	A window drawn in a skin that is not the running one. `data-skin` is an attribute selector,
	not an `html` selector, so putting it on this element swaps every shape token inside it while
	the colour tokens keep inheriting from the theme on <html>. That is the split working: one
	markup tree, dressed twice, on the same page, with no script.

	Decorative by construction. The radio label beside it carries the name.
-->
<div class="preview" data-skin={skin} aria-hidden="true">
	<div class="bar"><span class="chip"></span></div>
	<div class="body">
		<span class="tile"></span>
		<span class="lines">
			<span class="line"></span>
			<span class="line short"></span>
		</span>
	</div>
</div>

<style>
	.preview {
		width: 100%;
		overflow: hidden;
		background: var(--window-bg);
		border: var(--bw-strong) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--elev-1);
	}

	.bar {
		display: flex;
		align-items: center;
		height: calc(var(--chrome-h) * 0.7);
		padding-inline: 0.375rem;
		background: var(--titlebar-pattern), var(--titlebar-bg);
		border-bottom: var(--bw) solid var(--c-line);
	}

	.chip {
		width: 45%;
		height: 60%;
		background: var(--titlebar-bg);
	}

	.body {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	/* The one flash of accent, so the preview shows what the skin does with the selection. */
	.tile {
		flex: none;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--c-select);
		border-radius: var(--r-sm);
	}

	.lines {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.3rem;
	}

	.line {
		height: 0.3rem;
		background: var(--c-fg-3);
		border-radius: var(--r-sm);
	}

	.line.short {
		width: 60%;
	}
</style>
