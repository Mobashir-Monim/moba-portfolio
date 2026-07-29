<script lang="ts">
	import { OS_NAME, OS_VERSION } from '$lib/os';

	let {
		progress = 0,
		lines = [],
		onskip
	}: {
		/** 0 to 100. The caller owns the clock; this component only draws. */
		progress?: number;
		/** POST lines already emitted, oldest first. */
		lines?: string[];
		onskip?: () => void;
	} = $props();

	const pct = $derived(Math.min(100, Math.max(0, progress)));
</script>

<!--
	Skippable, and never in the way: the boot screen sits over content that already exists in the
	DOM rather than standing in for it, so a crawler and a reader with JavaScript off see the page
	underneath. That is the whole of ledger #12 in one decision.
-->
<div class="boot">
	<div class="stack">
		<p class="logo">{OS_NAME}</p>
		<p class="version">Version {OS_VERSION}</p>

		<div
			class="track"
			role="progressbar"
			aria-label="Starting {OS_NAME}"
			aria-valuenow={Math.round(pct)}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<div class="fill" style:width="{pct}%"></div>
		</div>

		<!-- `aria-live` off on purpose: a screen reader announcing every POST line is noise, and
		     the progress bar above already reports the thing that matters. -->
		<ul class="post">
			{#each lines as line, i (i)}
				<li>{line}</li>
			{/each}
		</ul>

		{#if onskip}
			<button type="button" class="skip" onclick={onskip}>Skip</button>
		{/if}
	</div>
</div>

<style>
	.boot {
		display: grid;
		place-items: center;
		padding: 2rem;
		background: var(--desktop-bg);
		color: var(--c-fg-1);
	}

	.stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: min(28rem, 100%);
	}

	/* `--ff-ui` is the chrome face, so this reads as a POST banner in retro's Geneva, as a
	   systems tool in modern's monospace, and as Montserrat in glass, with no branch. */
	.logo {
		font-family: var(--ff-ui);
		font-size: var(--fs-2xl);
		font-weight: 700;
		line-height: var(--lh-tight);
		letter-spacing: var(--tracking-ui);
	}

	.version {
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		color: var(--c-fg-3);
	}

	.track {
		width: 100%;
		height: 0.75rem;
		margin-top: 0.5rem;
		overflow: hidden;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		/* Retro's thermometer is a recessed well with a solid bar in it. The other two skins
		   resolve this to `none` and get a flat track. */
		box-shadow: var(--bevel-in);
	}

	/* `--c-select`, not `--c-accent`: the selection highlight is inside every skin's accent
	   budget, retro's included, and System 7's thermometer filled with exactly that colour. */
	.fill {
		height: 100%;
		background: var(--c-select);
		transition: width var(--dur-base) var(--ez-standard);
	}

	.post {
		width: 100%;
		min-height: 6rem;
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		line-height: var(--lh-normal);
		color: var(--c-fg-2);
	}

	.skip {
		padding: 0.375rem 1rem;
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		color: var(--c-fg-1);
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		cursor: pointer;
	}

	.skip:active {
		box-shadow: var(--bevel-in);
	}
</style>
