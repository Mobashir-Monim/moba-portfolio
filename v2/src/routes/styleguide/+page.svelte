<script lang="ts">
	import {
		APPEARANCES,
		SKINS,
		THEMES,
		isDark,
		settings,
		update,
		type Appearance,
		type Skin,
		type Theme
	} from '$lib/appearance.svelte';
	import { OS_NAME, OS_VERSION } from '$lib/os';

	const COLOURS = [
		'--c-surface-0',
		'--c-surface-1',
		'--c-surface-2',
		'--c-surface-3',
		'--c-fg-1',
		'--c-fg-2',
		'--c-fg-3',
		'--c-line',
		'--c-line-strong',
		'--c-accent',
		'--c-accent-hover',
		'--c-on-accent',
		'--c-select',
		'--c-on-select',
		'--c-focus'
	];

	const SIZES = ['--fs-xs', '--fs-sm', '--fs-base', '--fs-lg', '--fs-xl', '--fs-2xl'];
	const FAMILIES = ['--ff-ui', '--ff-body', '--ff-mono'];
	const RADII = ['--r-sm', '--r-md', '--r-lg'];
	const WIDTHS = ['--bw', '--bw-strong'];
	const METRICS = ['--chrome-h', '--dock-h', '--icon-tile', '--icon-stroke'];
	const MOTION = ['--dur-fast', '--dur-base', '--dur-slow', '--ez-standard', '--ez-out'];
	const TEXT_META = ['--lh-tight', '--lh-normal', '--tracking-ui'];

	const ALL = [
		...COLOURS,
		...SIZES,
		...FAMILIES,
		...RADII,
		...WIDTHS,
		...METRICS,
		...MOTION,
		...TEXT_META
	];

	/** Resolved values, re-read whenever any axis changes. Empty with JavaScript off, which
	 *  costs the readouts and nothing else: the swatches themselves are pure CSS. */
	let resolved = $state<Record<string, string>>({});

	$effect(() => {
		void settings.skin;
		void settings.theme;
		void settings.appearance;
		const style = getComputedStyle(document.documentElement);
		resolved = Object.fromEntries(ALL.map((t) => [t, style.getPropertyValue(t).trim()]));
	});
</script>

<svelte:head>
	<title>Styleguide | {OS_NAME} {OS_VERSION}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-4xl px-6 py-10">
	<header class="mb-10">
		<h1 class="text-2xl font-semibold">{OS_NAME} {OS_VERSION} styleguide</h1>
		<p class="mt-2 text-fg-2">
			Skins own shape, themes own colour, appearance owns ground polarity. Three axes, 24
			combinations, every one of which has to pass AA.
		</p>
	</header>

	<section aria-labelledby="axes" class="mb-12">
		<h2 id="axes" class="mb-4 text-xl font-semibold">Axes</h2>
		<div class="flex flex-wrap gap-8">
			<fieldset>
				<legend class="mb-2 text-sm text-fg-3">Skin (shape)</legend>
				<div class="flex flex-col gap-1">
					{#each SKINS as skin (skin)}
						<label class="flex items-center gap-2">
							<input
								type="radio"
								name="skin"
								value={skin}
								checked={settings.skin === skin}
								onchange={() => update({ skin: skin as Skin })}
							/>
							{skin}
						</label>
					{/each}
				</div>
			</fieldset>

			<fieldset>
				<legend class="mb-2 text-sm text-fg-3">Theme (colour)</legend>
				<div class="flex flex-col gap-1">
					{#each THEMES as theme (theme)}
						<label class="flex items-center gap-2">
							<input
								type="radio"
								name="theme"
								value={theme}
								checked={settings.theme === theme}
								onchange={() => update({ theme: theme as Theme })}
							/>
							<span
								data-theme={theme}
								class:dark={isDark()}
								class="size-4 shrink-0 rounded-full border border-line-strong"
								style="background: var(--c-accent)"
							></span>
							{theme}
						</label>
					{/each}
				</div>
			</fieldset>

			<fieldset>
				<legend class="mb-2 text-sm text-fg-3">Appearance</legend>
				<div class="flex flex-col gap-1">
					{#each APPEARANCES as appearance (appearance)}
						<label class="flex items-center gap-2">
							<input
								type="radio"
								name="appearance"
								value={appearance}
								checked={settings.appearance === appearance}
								onchange={() => update({ appearance: appearance as Appearance })}
							/>
							{appearance}
						</label>
					{/each}
				</div>
			</fieldset>
		</div>
	</section>

	<section aria-labelledby="colour" class="mb-12">
		<h2 id="colour" class="mb-4 text-xl font-semibold">Colour, theme-owned</h2>
		<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each COLOURS as token (token)}
				<li class="rounded-md border border-line bg-surface-1 p-2">
					<span
						class="mb-2 block h-10 rounded-sm border border-line-strong"
						style="background: var({token})"
					></span>
					<code class="block text-xs">{token}</code>
					<span class="text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="type" class="mb-12">
		<h2 id="type" class="mb-4 text-xl font-semibold">Type, skin-owned</h2>

		<ul class="mb-6 space-y-2">
			{#each FAMILIES as token (token)}
				<li class="rounded-md border border-line bg-surface-1 p-3">
					<code class="text-xs text-fg-3">{token}</code>
					<p style="font-family: var({token})">
						{OS_NAME}
						{OS_VERSION}: the quick brown fox jumps over the lazy dog, 0123456789
					</p>
					<span class="text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</li>
			{/each}
		</ul>

		<p class="mb-2 text-sm text-fg-2">
			Only <code>glass</code> pays for a face, Montserrat as a variable font. The row below is the
			weight axis: if it renders as three identical lines under <code>glass</code>, the variable
			axis did not load and the browser is synthesising the bolds.
		</p>
		<ul class="mb-6 space-y-1">
			{#each [400, 600, 700] as weight (weight)}
				<li class="flex items-baseline gap-4">
					<code class="w-24 shrink-0 text-xs text-fg-3">{weight}</code>
					<span style="font-family: var(--ff-body); font-weight: {weight}">
						Mnemos remembers every window you opened
					</span>
				</li>
			{/each}
		</ul>

		<ul class="mb-6 space-y-1">
			{#each SIZES as token (token)}
				<li class="flex items-baseline gap-4">
					<code class="w-24 shrink-0 text-xs text-fg-3">{token}</code>
					<span class="w-16 shrink-0 text-xs text-fg-3">{resolved[token] ?? ''}</span>
					<span style="font-size: var({token})">Mnemos remembers</span>
				</li>
			{/each}
		</ul>

		<dl class="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
			{#each TEXT_META as token (token)}
				<dt><code class="text-xs text-fg-3">{token}</code></dt>
				<dd>{resolved[token] ?? ''}</dd>
			{/each}
		</dl>
	</section>

	<section aria-labelledby="shape" class="mb-12">
		<h2 id="shape" class="mb-4 text-xl font-semibold">Shape, skin-owned</h2>

		<div class="mb-6 flex flex-wrap gap-4">
			{#each RADII as token (token)}
				<div class="text-center">
					<span
						class="mb-1 block size-20 border border-line-strong bg-surface-2"
						style="border-radius: var({token})"
					></span>
					<code class="text-xs text-fg-3">{token}</code>
					<span class="block text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</div>
			{/each}
			{#each WIDTHS as token (token)}
				<div class="text-center">
					<span
						class="mb-1 block size-20 bg-surface-2"
						style="border: var({token}) solid var(--c-line-strong)"
					></span>
					<code class="text-xs text-fg-3">{token}</code>
					<span class="block text-xs text-fg-3">{resolved[token] ?? ''}</span>
				</div>
			{/each}
		</div>

		<dl class="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
			{#each METRICS as token (token)}
				<dt><code class="text-xs text-fg-3">{token}</code></dt>
				<dd>{resolved[token] ?? ''}</dd>
			{/each}
		</dl>
	</section>

	<section aria-labelledby="elevation" class="mb-12">
		<h2 id="elevation" class="mb-4 text-xl font-semibold">Elevation, skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			A focused window has to read as above an unfocused one in every skin. Retro does it with a
			hard offset shadow rather than a blur, because System 7 had no blur.
		</p>
		<div class="flex flex-wrap gap-8 p-4">
			<div
				class="grid size-40 place-items-center rounded-lg border border-line bg-surface-1 text-sm shadow-window"
			>
				--elev-1
			</div>
			<div
				class="grid size-40 place-items-center rounded-lg border border-line bg-surface-1 text-sm shadow-window-focus"
			>
				--elev-2
			</div>
		</div>
	</section>

	<section aria-labelledby="motion" class="mb-12">
		<h2 id="motion" class="mb-4 text-xl font-semibold">Motion, skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			Retro is 0ms on purpose. Reduced motion collapses all of these to instant, site-wide.
		</p>
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
			{#each MOTION as token (token)}
				<dt><code class="text-xs text-fg-3">{token}</code></dt>
				<dd>{resolved[token] ?? ''}</dd>
			{/each}
		</dl>
	</section>

	<section aria-labelledby="budget" class="mb-12">
		<h2 id="budget" class="mb-4 text-xl font-semibold">Accent budget, skin-owned</h2>
		<p class="mb-4 text-sm text-fg-2">
			How much of the theme accent each skin is allowed to spend. Modern spends it throughout, retro
			spends it on the title bar and the selection only, glass spends it as gradient stops.
		</p>
		<div class="flex flex-wrap gap-4">
			<div class="w-64 overflow-hidden rounded-md border border-line">
				<div
					class="flex items-center px-3 text-sm"
					style="background: var(--titlebar-bg); color: var(--titlebar-fg); height: var(--chrome-h)"
				>
					Focused
				</div>
				<div class="bg-surface-1 p-3 text-sm">Window body on --c-surface-1</div>
			</div>
			<div class="w-64 overflow-hidden rounded-md border border-line">
				<div
					class="flex items-center px-3 text-sm"
					style="background: var(--titlebar-bg-idle); color: var(--titlebar-fg-idle); height: var(--chrome-h)"
				>
					Unfocused
				</div>
				<div class="bg-surface-1 p-3 text-sm">Window body on --c-surface-1</div>
			</div>
			<p class="w-64 rounded-md border border-line bg-surface-1 p-3 text-sm">
				Selected text renders like <mark class="bg-select text-on-select">this</mark>. Tab to any
				control above to see the focus ring at --ring.
			</p>
		</div>
	</section>
</div>
