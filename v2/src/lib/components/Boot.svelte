<script lang="ts">
	import { BOOT_LINES, BOOT_STEP_MS } from '$lib/os';
	import BootScreen from './BootScreen.svelte';

	/**
	 * The clock behind `BootScreen`, which only draws.
	 *
	 * Whether this runs at all was decided before first paint by the script in `app.html`, which
	 * sets `data-boot` on `<html>` when this tab has not booted yet and does not prefer reduced
	 * motion. The markup below is server-rendered either way and CSS hides it when the attribute
	 * is absent, so neither a first visit nor a return flashes the wrong screen for a frame.
	 *
	 * Reduced motion is checked there rather than here on purpose: the boot screen is the
	 * animation, so honouring the preference means never painting it, and a component cannot
	 * decide that until after the paint it was supposed to prevent.
	 */

	const KEY = 'mobos.booted';

	let step = $state(0);
	let done = $state(false);

	const progress = $derived((step / BOOT_LINES.length) * 100);
	const lines = $derived(BOOT_LINES.slice(0, step));

	function finish(): void {
		done = true;
		try {
			sessionStorage.setItem(KEY, '1');
		} catch {
			/* Then it boots again next load, which is the flourish working twice, not a fault. */
		}
		// Drop the attribute so the CSS that was showing this stops, even mid-outro.
		document.documentElement.removeAttribute('data-boot');
	}

	$effect(() => {
		if (!document.documentElement.hasAttribute('data-boot')) {
			done = true;
			return;
		}

		const timer = setInterval(() => {
			step += 1;
			if (step >= BOOT_LINES.length) finish();
		}, BOOT_STEP_MS);

		return () => clearInterval(timer);
	});
</script>

{#if !done}
	<div class="layer">
		<BootScreen {progress} {lines} onskip={finish} />
	</div>
{/if}

<style>
	/*
		Hidden by default and shown only under `[data-boot]`. The server cannot read
		sessionStorage, so it always renders this; the pre-paint script is what decides whether it
		is ever seen. Ledger #33 is the same mistake in a different costume: deciding after mount
		what the first paint should have known.
	*/
	.layer {
		display: none;
		position: fixed;
		inset: 0;
		z-index: 10;
	}

	:global(html[data-boot]) .layer {
		display: grid;
	}

	.layer > :global(*) {
		min-height: 100%;
	}
</style>
