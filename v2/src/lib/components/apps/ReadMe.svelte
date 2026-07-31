<script lang="ts">
	import { settings } from '$lib/appearance.svelte';
	import { OS_NAME, OS_VERSION } from '$lib/os';
	import { windows } from '$lib/windows.svelte';

	/**
	 * The window that explains the desktop, opened once on a first visit and available from the
	 * launcher after that.
	 *
	 * It exists because of one sentence from the first person to see this site who had not built
	 * it: "my initial experience was this doesn't work". Three separate things were behind that,
	 * and 7.1 and 7.2 answer two of them. This is the third, plus the part of it that no default
	 * and no line of masthead copy can carry: the keyboard works, and nobody discovers arrow keys
	 * by guessing.
	 *
	 * Copy that can go stale is derived, not written. The opening line reads the click-mode setting
	 * rather than describing a default, because this window outlives whatever the visitor sets in
	 * Settings ten seconds later, and a help window that lies is worse than no help window.
	 */

	let { id }: { id: string } = $props();

	type Key = [key: string, does: string];

	/**
	 * The four keys, and each one is a promise something in this codebase actually keeps. Escape is
	 * two lines in `WindowFrame`, the arrows are `$lib/roving`, and Enter and Tab are the platform's
	 * own, which is the whole reason every icon on the desktop is an `<a>` and not a div.
	 */
	const KEYS: Key[] = [
		['Tab', 'Move between things'],
		['Arrow keys', 'Move between icons, rows, and files'],
		['Enter', 'Open whatever has focus'],
		['Escape', 'Drop a selection, or close the window']
	];
</script>

<div class="readme">
	<header>
		<h3>Welcome to {OS_NAME} {OS_VERSION}</h3>
		<!-- Short enough that the button at the end of this window lands above the fold at the
		     default window size, which is the one thing a window explaining itself owes. -->
		<p>
			A portfolio wearing a desktop. The folders hold the work, and every one of them is also a
			plain page.
		</p>
	</header>

	<section>
		<h4>Opening things</h4>
		<!-- Reads the setting rather than stating the default, so this stays true after someone
		     changes it. Settings calls the same two modes by the same two names. -->
		{#if settings.clickMode === 'single'}
			<p>One click opens anything: a folder, a file, a row in a list.</p>
		{:else}
			<p>Two clicks open, one selects. That is the current setting.</p>
		{/if}
		<p class="hint">Settings holds the other mode, three skins and four colour themes.</p>
	</section>

	<section>
		<h4>From the keyboard</h4>
		<dl>
			{#each KEYS as [key, does] (key)}
				<dt><kbd>{key}</kbd></dt>
				<dd>{does}</dd>
			{/each}
		</dl>
	</section>

	<!--
		A real button and a real close, not an acknowledgement the site records. Nothing is waiting
		on it: the visit is already marked, this window is already on the launcher, and Escape and
		the title bar control do exactly what this does. It is here because a window that explains
		itself should end with a way out that reads as one.
	-->
	<button type="button" onclick={() => windows.close(id)}>Got it</button>
</div>

<style>
	.readme {
		display: grid;
		gap: 0.75rem;
		justify-items: start;
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
	}

	h3 {
		font-size: var(--fs-lg);
		font-weight: 600;
	}

	h4 {
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	/* Prose measure, in the body face. The keyboard table below it is `--ff-ui` like the rest of
	   the chrome, which is the same split every content route already makes. */
	p {
		max-width: 52ch;
		font-family: var(--ff-body);
		line-height: var(--lh-normal);
	}

	header p {
		margin-top: 0.375rem;
	}

	.hint {
		margin-top: 0.5rem;
		color: var(--c-fg-3);
		font-size: var(--fs-xs);
	}

	section {
		width: 100%;
		padding: 0.75rem;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-md);
	}

	/* The same two-column term list System Info uses, so the two windows read as one machine. */
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.375rem 1rem;
		align-items: baseline;
	}

	/* `kbd` is the element for this and it is styled here rather than globally, because this is the
	   only place on the site that names a key. */
	kbd {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background: var(--c-surface-3);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-xs);
		box-shadow: var(--bevel-out);
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		white-space: nowrap;
	}

	dd {
		color: var(--c-fg-2);
	}

	/* The house button, the one the games' bars already use. */
	button {
		padding: 0.375rem 0.75rem;
		background: var(--c-surface-3);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	button:active {
		box-shadow: var(--bevel-in);
	}
</style>
