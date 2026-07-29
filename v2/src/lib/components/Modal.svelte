<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		title,
		onclose,
		children,
		actions,
		class: klass = ''
	}: {
		title: string;
		onclose?: () => void;
		children: Snippet;
		/** Buttons for the footer. Omit and the footer is not rendered at all. */
		actions?: Snippet;
		class?: string;
	} = $props();

	// Unique per instance, so two modals on the same page cannot both claim the same heading.
	const headingId = $props.id();
</script>

<!--
	The shell only. Focus trapping, Escape, restoring focus to the opener, and the transition all
	belong to phase 2, where the state that decides whether this is mounted lives.

	`aria-modal` plus a labelled dialog is the whole contract here; the backdrop is not
	interactive, because a click target that is invisible to the keyboard is not a way out.
	The close control is.
-->
<div class="backdrop {klass}">
	<!-- A div, not a section: `role="dialog"` on a landmark element is the one case where the
	     semantic tag and the role fight, and the role is the one that matters here. -->
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby={headingId}>
		<header>
			<h2 id={headingId}>{title}</h2>
			{#if onclose}
				<button type="button" class="close" onclick={onclose}>
					<Icon name="close" size={14} />
					<span class="sr-only">Close {title}</span>
				</button>
			{/if}
		</header>

		<div class="content">{@render children()}</div>

		{#if actions}
			<footer>{@render actions()}</footer>
		{/if}
	</div>
</div>

<style>
	.backdrop {
		display: grid;
		place-items: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--c-surface-0) 70%, transparent);
	}

	.modal {
		display: flex;
		flex-direction: column;
		width: min(30rem, 100%);
		max-height: 100%;
		overflow: hidden;
		background: var(--window-bg);
		backdrop-filter: blur(var(--bl-chrome));
		color: var(--c-fg-1);
		border: var(--bw-strong) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--elev-2);
	}

	header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--titlebar-bg);
		color: var(--titlebar-fg);
		border-bottom: var(--bw) solid var(--c-line);
	}

	h2 {
		flex: 1;
		min-width: 0;
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		font-weight: 600;
		letter-spacing: var(--tracking-ui);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.close {
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		color: inherit;
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		cursor: pointer;
	}

	.close:active {
		box-shadow: var(--bevel-in);
	}

	.content {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 1rem;
		font-family: var(--ff-body);
		font-size: var(--fs-base);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--c-surface-2);
		border-top: var(--bw) solid var(--c-line);
	}
</style>
