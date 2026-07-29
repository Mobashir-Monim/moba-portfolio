<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		title,
		focused = false,
		nav = false,
		canBack = false,
		canForward = false,
		onback,
		onforward,
		onminimize,
		onclose
	}: {
		title: string;
		/** Focused windows get the accent title bar and, in retro, the pinstripes. */
		focused?: boolean;
		/** Folder windows navigate. Document windows do not, so they omit the pair entirely. */
		nav?: boolean;
		canBack?: boolean;
		canForward?: boolean;
		onback?: () => void;
		onforward?: () => void;
		onminimize?: () => void;
		onclose?: () => void;
	} = $props();
</script>

<!--
	A div, not a button. Ledger #17: the old site nested a control button inside a toolbar button
	inside the window button, which is invalid HTML and unpredictable in assistive tech. The drag
	handlers land on this element in phase 2.4; nothing about it needs to be interactive to be
	draggable.
-->
<div class="titlebar" class:focused>
	{#if nav}
		<div class="group">
			<button type="button" class="control back" disabled={!canBack} onclick={onback}>
				<Icon name="chevron" size={14} />
				<span class="sr-only">Back</span>
			</button>
			<button type="button" class="control" disabled={!canForward} onclick={onforward}>
				<Icon name="chevron" size={14} />
				<span class="sr-only">Forward</span>
			</button>
		</div>
	{/if}

	<!-- The chip repaints the bar's own background behind the text, which is what keeps retro's
	     pinstripes from running through the title. In the other two skins it is the same paint as
	     the bar and therefore invisible. -->
	<h2 class="title"><span class="chip">{title}</span></h2>

	<div class="group">
		{#if onminimize}
			<button type="button" class="control" onclick={onminimize}>
				<Icon name="minimize" size={14} />
				<span class="sr-only">Minimize {title}</span>
			</button>
		{/if}
		{#if onclose}
			<button type="button" class="control" onclick={onclose}>
				<Icon name="close" size={14} />
				<span class="sr-only">Close {title}</span>
			</button>
		{/if}
	</div>
</div>

<style>
	/* Focused and idle differ only in these three, so every rule below reads one set of names and
	   the state lives in one place. */
	.titlebar {
		--_bg: var(--titlebar-bg-idle);
		--_fg: var(--titlebar-fg-idle);
		--_pattern: none;

		display: flex;
		align-items: stretch;
		gap: 0.25rem;
		height: var(--chrome-h);
		padding-inline: 0.375rem;
		/* Pattern first so it layers over the paint. `none` is a legal image layer, which is how
		   the skins that have no pattern opt out without a branch. */
		background: var(--_pattern), var(--_bg);
		color: var(--_fg);
		border-bottom: var(--bw) solid var(--c-line);
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
		transition:
			background-color var(--dur-fast) var(--ez-standard),
			color var(--dur-fast) var(--ez-standard);
	}

	.titlebar.focused {
		--_bg: var(--titlebar-bg);
		--_fg: var(--titlebar-fg);
		--_pattern: var(--titlebar-pattern);
	}

	.title {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: var(--title-align);
		font-size: inherit;
		font-weight: 600;
	}

	.chip {
		display: flex;
		align-items: center;
		max-width: 100%;
		padding-inline: 0.5rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		background: var(--_bg);
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.control {
		display: grid;
		place-items: center;
		align-self: center;
		width: 1.25rem;
		height: 1.25rem;
		color: inherit;
		background: var(--_bg);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		cursor: pointer;
		transition: opacity var(--dur-fast) var(--ez-standard);
	}

	/* Greyscale on purpose. Retro's accent budget is the title bar's paint and the selection
	   highlight, and a control that lights up accent on hover spends it a third time. */
	.control:hover:not(:disabled) {
		background: var(--c-surface-2);
	}

	.control:active:not(:disabled) {
		box-shadow: var(--bevel-in);
	}

	.control:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* The glyph points right, so back is the same glyph turned around. Four glyphs for four
	   angles is how an icon set gets to 24 entries. */
	.back :global(svg) {
		transform: rotate(180deg);
	}
</style>
