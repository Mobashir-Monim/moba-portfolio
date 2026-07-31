<script lang="ts">
	import {
		back,
		clear,
		digit,
		dot,
		equals,
		negate,
		operate,
		START,
		type Calc,
		type Op
	} from '$lib/calc';

	/**
	 * The keypad and the screen. Every rule lives in `$lib/calc`, including the one this app is
	 * built around: division is a Pro feature.
	 */

	let calc = $state<Calc>(START);

	/** The upsell, which is the point of the app. Shown on open, dismissed by using the thing. */
	let paywall = $state(true);

	/** Whether the visitor has tried to pay, which is the only thing pressing Unlock changes. */
	let tried = $state(false);

	const KEYS: Record<string, () => void> = {
		Enter: () => (calc = equals(calc)),
		'=': () => (calc = equals(calc)),
		Backspace: () => (calc = back(calc)),
		Delete: () => (calc = clear()),
		c: () => (calc = clear()),
		C: () => (calc = clear()),
		'*': () => (calc = operate(calc, '×')),
		'/': () => (calc = operate(calc, '÷')),
		'+': () => (calc = operate(calc, '+')),
		'-': () => (calc = operate(calc, '-')),
		'.': () => (calc = dot(calc))
	};

	function onkeydown(event: KeyboardEvent): void {
		// The overlay owns the keyboard while it is up, and Escape stays the window's either way.
		if (paywall || event.metaKey || event.ctrlKey || event.altKey) return;

		const key = event.key;
		const handler = key >= '0' && key <= '9' ? () => (calc = digit(calc, key)) : KEYS[key];
		if (!handler) return;

		// `/` opens quick-find in some browsers and Backspace used to navigate back in others.
		event.preventDefault();
		handler();
	}
</script>

<!-- The handler sits on a plain wrapper rather than a focusable element: every key on this pad is
     already a real button, so a keystroke arrives here by bubbling from whichever one has focus,
     and the app is fully operable by Tab and Enter with this handler deleted. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="calc" {onkeydown}>
	<!-- `<output>` is a live region by default, so a refusal is spoken rather than only drawn. -->
	<output class="screen">
		<span class="value">{calc.display}</span>
		<span class="note">{calc.note ?? ''}</span>
	</output>

	<!-- `inert` while the upsell is up, or Tab walks straight through the panel into the keypad
	     behind it. The keydown guard covers typing; this covers the tab order, and both are the
	     platform's rather than a focus trap of our own. -->
	<div class="pad" inert={paywall}>
		{@render key('C', () => (calc = clear()), 'fn')}
		{@render key('±', () => (calc = negate(calc)), 'fn', 'Negate')}
		{@render key('⌫', () => (calc = back(calc)), 'fn', 'Delete')}
		{@render op('÷')}

		{@render key('7', () => (calc = digit(calc, '7')))}
		{@render key('8', () => (calc = digit(calc, '8')))}
		{@render key('9', () => (calc = digit(calc, '9')))}
		{@render op('×')}

		{@render key('4', () => (calc = digit(calc, '4')))}
		{@render key('5', () => (calc = digit(calc, '5')))}
		{@render key('6', () => (calc = digit(calc, '6')))}
		{@render op('-')}

		{@render key('1', () => (calc = digit(calc, '1')))}
		{@render key('2', () => (calc = digit(calc, '2')))}
		{@render key('3', () => (calc = digit(calc, '3')))}
		{@render op('+')}

		{@render key('0', () => (calc = digit(calc, '0')), 'wide')}
		{@render key('.', () => (calc = dot(calc)), '', 'Decimal point')}
		{@render key('=', () => (calc = equals(calc)), 'eq', 'Equals')}
	</div>

	{#if paywall}
		<!--
			The gag, and the line it does not cross: there is no form here, no field, and nothing that
			looks like one. The spec is explicit, and the reason is not squeamishness. A convincing
			payment form is how people get trained to type card numbers into whatever asks, and a joke
			is not worth teaching that. Unlock leads to an in-world dead end and nowhere else.

			If this ever takes money it becomes Stripe Checkout, hosted and real, with a product
			description, terms, and a refund path, because at that point someone can actually be
			charged.
		-->
		<div class="upsell">
			<div class="panel">
				<p class="badge">Calculator Pro</p>
				{#if tried}
					<h3>Purchase unavailable</h3>
					<p class="pitch">
						No payment processor is installed on this machine, so nothing can be charged. That is
						true of the whole system, which is a portfolio wearing an operating system as a coat.
					</p>
				{:else}
					<h3>Unlock division for $499.99</h3>
					<p class="pitch">One time. Per device. Division only. Everything else is already free.</p>
					<ul>
						<li>Divide one number by another number</li>
						<li>Priority support, from the person whose site this is</li>
						<li>No advertisements, same as the free version</li>
					</ul>
				{/if}

				<div class="actions">
					{#if !tried}
						<button type="button" class="buy" onclick={() => (tried = true)}>Unlock Pro</button>
					{/if}
					<button type="button" onclick={() => (paywall = false)}>Continue with Basic</button>
				</div>
			</div>
		</div>
	{/if}
</div>

{#snippet key(label: string, press: () => void, kind = '', name = label)}
	<button type="button" class={kind} aria-label={name} onclick={press}>{label}</button>
{/snippet}

{#snippet op(symbol: Op)}
	<button
		type="button"
		class="op"
		aria-label={symbol}
		onclick={() => (calc = operate(calc, symbol))}
	>
		{symbol}{#if symbol === '÷'}<span class="pro" aria-hidden="true">PRO</span>{/if}
	</button>
{/snippet}

<style>
	.calc {
		position: relative;
		display: grid;
		gap: 0.75rem;
		align-content: start;
		max-width: 22rem;
		margin-inline: auto;
		font-family: var(--ff-ui);
		letter-spacing: var(--tracking-ui);
	}

	.screen {
		display: grid;
		gap: 0.25rem;
		padding: 0.75rem;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--bevel-in);
		text-align: end;
	}

	.value {
		font-family: var(--ff-mono);
		font-size: var(--fs-2xl);
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}

	/* Reserves its line whether or not there is a note, so the pad does not jump when one lands. */
	.note {
		min-height: 1lh;
		color: var(--c-fg-3);
		font-size: var(--fs-xs);
	}

	.pad {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.375rem;
	}

	button {
		padding: 0.625rem 0.5rem;
		background: var(--c-surface-3);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		color: inherit;
		font: inherit;
		font-size: var(--fs-lg);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}

	button:active {
		box-shadow: var(--bevel-in);
	}

	.fn,
	.op {
		background: var(--c-surface-1);
	}

	.eq {
		background: var(--c-select);
		color: var(--c-on-select);
	}

	.wide {
		grid-column: span 2;
	}

	/* The one key that is not what it appears to be, marked as such before it is pressed. */
	.op .pro {
		display: block;
		font-size: 0.5rem;
		letter-spacing: 0.08em;
		color: var(--c-fg-3);
	}

	.upsell {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0.5rem;
		background: color-mix(in oklab, var(--c-surface-0) 85%, transparent);
	}

	.panel {
		display: grid;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--c-surface-1);
		border: var(--bw-strong) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--elev-2);
		font-size: var(--fs-sm);
	}

	.badge {
		color: var(--c-accent);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	h3 {
		font-size: var(--fs-lg);
		font-weight: 600;
	}

	.pitch {
		color: var(--c-fg-2);
	}

	ul {
		display: grid;
		gap: 0.125rem;
		padding-inline-start: 1.1rem;
		list-style: disc;
		color: var(--c-fg-2);
		font-size: var(--fs-xs);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.actions button {
		flex: 1;
		font-size: var(--fs-sm);
	}

	.buy {
		background: var(--c-accent);
		color: var(--c-on-accent);
	}
</style>
