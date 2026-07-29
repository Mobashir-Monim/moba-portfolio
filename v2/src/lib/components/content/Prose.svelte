<script lang="ts">
	let { paragraphs }: { paragraphs: string[] } = $props();
</script>

<!--
	Real paragraphs, one element each. The content layer already split them on the blank lines in
	the markdown, so nothing here parses and nothing here reaches for `{@html}`.
-->
<div class="grid gap-3 text-fg-2">
	{#each paragraphs as paragraph, i (i)}
		<p>{paragraph}</p>
	{/each}
</div>
