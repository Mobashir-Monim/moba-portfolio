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

	/**
	 * Called once the desktop is the thing on screen, whether that took a boot sequence, a skip, or
	 * nothing at all because this tab has already booted. 7.3 is its only caller: a window that
	 * opens itself has to open onto a desktop somebody can see, and this component is the only one
	 * that knows when that is.
	 *
	 * No timer between the two. A window that appears while you are already looking at the desktop
	 * reads as the machine finishing what it was doing; one that arrives two seconds later reads as
	 * something that jumped in front of what you had started doing. The frame's own 160ms scale is
	 * the whole of the arrival, and reduced motion takes even that.
	 */
	let { onready }: { onready?: () => void } = $props();

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
		onready?.();
	}

	$effect(() => {
		if (!document.documentElement.hasAttribute('data-boot')) {
			done = true;
			// The returning tab, the reduced-motion visitor, and anyone whose storage refused the
			// session key. All three are already looking at the desktop.
			onready?.();
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
