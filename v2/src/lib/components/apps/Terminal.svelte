<script lang="ts">
	import { update } from '$lib/appearance.svelte';
	import { BANNER, complete, HOME, prompt, run } from '$lib/terminal';
	import { windows } from '$lib/windows.svelte';

	/**
	 * The screen and the keyboard. Everything a command means lives in `$lib/terminal`, which is
	 * pure, so this file only ever does three things: echo, apply the effect the shell handed back,
	 * and hold the history.
	 */

	let log = $state<string[]>([...BANNER]);
	let cwd = $state(HOME);
	let value = $state('');

	/** Submitted commands, oldest first. The arrow keys walk it; `cursor` is -1 while typing fresh. */
	let history = $state<string[]>([]);
	let cursor = $state(-1);

	let field = $state<HTMLInputElement>();

	/**
	 * The window puts focus on its own `<section>` when it opens, which is right for every other
	 * window and wrong for this one: a terminal that needs a Tab press before it takes a key is not
	 * a terminal. Taking it here is the exception, and it is safe because the section is still the
	 * ancestor, so Escape still closes the window and the frame still counts as focused.
	 *
	 * A frame later, and that is load-bearing. A child's effect runs before its parent's, so doing
	 * this inline hands the keyboard straight back to `WindowFrame`, which is what the first pass
	 * shipped. It cannot be fixed on the other side either: the frame reads `document.activeElement`
	 * to know where to return focus when the window closes, so a window whose content had already
	 * taken it would record itself as its own opener.
	 */
	$effect(() => {
		const frame = requestAnimationFrame(() => field?.focus());
		return () => cancelAnimationFrame(frame);
	});

	/**
	 * Pressing anywhere puts the cursor back in the prompt. That matters most after `open`, which
	 * raises the window it just opened, so coming back to this one lands on the window's `<section>`
	 * and the next keystroke would go nowhere.
	 *
	 * On pointerup, and the two obvious alternatives are both wrong here:
	 *
	 * - `click` never fires. Taking focus scrolls the window body under the pointer, so the release
	 *   lands on a different element than the press, and a click across two targets is not
	 *   dispatched at all.
	 * - `pointerdown` fires, but the mousedown that follows it focuses the nearest focusable
	 *   ancestor, which is the window's own `<section>`, so the prompt loses focus a moment after
	 *   taking it.
	 *
	 * Not while there is a selection, or dragging across the output to copy it would end by
	 * throwing the selection away.
	 *
	 * Pointer-only, the same call the spec allows for drag and resize: Tab reaches the input in
	 * one press, so nothing here is reachable only this way.
	 */
	function refocus(): void {
		if (!getSelection()?.toString()) field?.focus();
	}

	/**
	 * Asking the prompt to bring itself into view, which scrolls whichever container it is in with
	 * no measurement and no listener. Instant by default, which is also what reduced motion wants.
	 */
	function follow(): void {
		field?.scrollIntoView({ block: 'end' });
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();

		const input = value;
		value = '';
		cursor = -1;

		const result = run(input, cwd);
		log = [...log, prompt(cwd) + input, ...result.lines];
		cwd = result.cwd;

		switch (result.effect?.do) {
			case 'clear':
				log = [];
				break;
			case 'open':
				windows.open(result.effect.id, result.effect.kind);
				break;
			case 'theme':
				update({ theme: result.effect.theme });
				break;
		}

		if (input.trim()) history = [...history, input];
		follow();
	}

	/** Back through the history, then forward out of it again into the line you were typing. */
	function recall(step: 1 | -1): void {
		if (history.length === 0) return;

		const next = cursor < 0 ? (step < 0 ? history.length - 1 : -1) : cursor + step;
		cursor = next >= history.length || next < 0 ? -1 : next;
		value = cursor < 0 ? '' : history[cursor];
	}

	function expand(): void {
		const candidates = complete(value, cwd);
		if (candidates.length === 0) return;

		if (candidates.length > 1) {
			// What every shell does with an ambiguous word: show the choices and leave the line alone.
			log = [...log, prompt(cwd) + value, candidates.join('  ')];
			follow();
			return;
		}

		// A directory keeps the cursor on the same word, so the next Tab walks into it.
		const only = candidates[0];
		const cut = value.lastIndexOf(' ');
		value = value.slice(0, cut + 1) + only + (only.endsWith('/') ? '' : ' ');
	}

	function onkeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			recall(event.key === 'ArrowUp' ? -1 : 1);
		} else if (event.key === 'Tab') {
			// The one key worth taking off the tab order, and only while there is something to say
			// about it: an empty prompt still tabs out of the window.
			if (!value) return;
			event.preventDefault();
			expand();
		}
	}
</script>

<!-- The ignored rule is the trade `refocus` documents: this is a convenience for a pointer, and
     the keyboard already has a shorter path to the same place. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="term" onpointerup={refocus}>
	<!-- `role="log"` rather than a bare `aria-live`, because that is what this is: output appended
	     to the end, read in order, with the earlier lines still meaningful. -->
	<div class="out" role="log">
		{#each log as line, i (i)}
			<p class="line">{line}</p>
		{/each}
	</div>

	<form class="row" onsubmit={submit}>
		<span class="prompt" aria-hidden="true">{prompt(cwd)}</span>
		<input
			bind:this={field}
			bind:value
			{onkeydown}
			aria-label="{prompt(cwd)} command"
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
		/>
	</form>
</div>

<style>
	/* The terminal owns its scrolling rather than letting the window body do it. Both would work
	   for reading, but only this one is stable under the pointer: when the body scrolls, taking
	   focus shifts the content between press and release, so the release lands on the body's own
	   padding, outside this element, and `refocus` never hears it. */
	.term {
		display: grid;
		align-content: start;
		height: 100%;
		overflow: auto;
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
		line-height: var(--lh-normal);
	}

	/* Output is preformatted: `help` and `contact` line their columns up with spaces, and a long
	   URL has nowhere to break that is not mid-token. */
	.line {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		min-height: 1lh;
	}

	.row {
		display: flex;
		min-width: 0;
	}

	.prompt {
		white-space: pre;
		color: var(--c-fg-3);
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0;
		background: none;
		border: 0;
		color: inherit;
		font: inherit;
		caret-color: var(--c-accent);
	}

	/* The outline is removed and replaced rather than just removed, which is what the contract in
	   the spec asks: a caret sitting in a prompt is the indicator a terminal has always used,
	   and the prompt itself lights up with it. A ring drawn around a full-width bare input would
	   be a box around the rest of the line. */
	input:focus {
		outline: none;
	}

	.row:focus-within .prompt {
		color: var(--c-accent);
	}
</style>
