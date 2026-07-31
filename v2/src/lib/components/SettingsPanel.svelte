<script lang="ts">
	import {
		APPEARANCES,
		CLICK_MODES,
		SKINS,
		THEMES,
		WALLPAPERS,
		type Appearance,
		type ClickMode,
		type Settings,
		type Skin,
		type Theme,
		type Wallpaper
	} from '$lib/appearance.svelte';
	import SkinPreview from './SkinPreview.svelte';

	let {
		skin,
		theme,
		appearance,
		wallpaper,
		clickMode,
		dark = false,
		onchange
	}: {
		skin: Skin;
		theme: Theme;
		appearance: Appearance;
		wallpaper: Wallpaper;
		clickMode: ClickMode;
		/** Which polarity the theme swatches should render in. `auto` is not recoverable from
		 *  the DOM, so the caller resolves it. */
		dark?: boolean;
		/** Same shape as the store's `update`, so the caller can pass that function directly. */
		onchange: (patch: Partial<Settings>) => void;
	} = $props();

	// One id per instance, so two panels on a page cannot fight over a radio group name.
	const uid = $props.id();

	const APPEARANCE_HINT: Record<Appearance, string> = {
		light: 'Always light',
		dark: 'Always dark',
		auto: 'Follow the system'
	};

	const WALLPAPER_HINT: Record<Wallpaper, string> = {
		grove: 'Ranges behind a deep pine forest, in haze',
		'night-scene': 'A wind-bent tree against the sun, over low hills',
		'circuit-bottom': 'Board traces fanning out of the centre',
		hive: 'A honeycomb assembling itself toward the right edge',
		'abstract-symbols-1': 'Chevrons and drifts of small marks, top and bottom',
		'circuit-streak': 'Long wiring runs and junction dots, at two depths',
		'pixel-brush': 'Brushed strokes broken into pixels',
		none: 'Plain ground, whatever the skin makes of it'
	};

	const CLICK_HINT: Record<ClickMode, string> = {
		single: 'One click opens',
		double: 'Two clicks open, one selects'
	};
</script>

<!--
	Real radios throughout. They are keyboard-operable, they group and announce themselves, and
	they work with JavaScript off, none of which a div with a click handler manages. Skin is the
	headline control, so it gets the previews and the width; the rest are lists.
-->
<div class="panel">
	<fieldset class="field skins">
		<legend>Skin</legend>
		<p class="hint">Shape only. Switching redresses the desktop in place.</p>
		<div class="tiles">
			{#each SKINS as value (value)}
				<label class="tile" class:on={skin === value}>
					<input
						type="radio"
						name="{uid}-skin"
						{value}
						checked={skin === value}
						onchange={() => onchange({ skin: value })}
					/>
					<SkinPreview skin={value} />
					<span class="name">{value}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="field">
		<legend>Colour</legend>
		<div class="rows">
			{#each THEMES as value (value)}
				<label class="row" class:on={theme === value}>
					<input
						type="radio"
						name="{uid}-theme"
						{value}
						checked={theme === value}
						onchange={() => onchange({ theme: value })}
					/>
					<span class="swatch" data-theme={value} class:dark aria-hidden="true"></span>
					<span class="name">{value}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="field">
		<legend>Wallpaper</legend>
		<p class="hint">One scene, dressed by the skin and the colour above it.</p>
		<div class="rows">
			{#each WALLPAPERS as value (value)}
				<label class="row" class:on={wallpaper === value}>
					<input
						type="radio"
						name="{uid}-wallpaper"
						{value}
						checked={wallpaper === value}
						onchange={() => onchange({ wallpaper: value })}
					/>
					<span class="name">{value}</span>
					<span class="hint">{WALLPAPER_HINT[value]}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="field">
		<legend>Appearance</legend>
		<div class="rows">
			{#each APPEARANCES as value (value)}
				<label class="row" class:on={appearance === value}>
					<input
						type="radio"
						name="{uid}-appearance"
						{value}
						checked={appearance === value}
						onchange={() => onchange({ appearance: value })}
					/>
					<span class="name">{value}</span>
					<span class="hint">{APPEARANCE_HINT[value]}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="field">
		<legend>Opening</legend>
		<div class="rows">
			{#each CLICK_MODES as value (value)}
				<label class="row" class:on={clickMode === value}>
					<input
						type="radio"
						name="{uid}-click"
						{value}
						checked={clickMode === value}
						onchange={() => onchange({ clickMode: value })}
					/>
					<span class="name">{value} click</span>
					<span class="hint">{CLICK_HINT[value]}</span>
				</label>
			{/each}
		</div>
	</fieldset>
</div>

<style>
	.panel {
		display: grid;
		gap: 1rem;
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
	}

	.field {
		padding: 0.75rem;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-md);
	}

	legend {
		padding-inline: 0.25rem;
		font-weight: 600;
	}

	.hint {
		color: var(--c-fg-3);
		font-size: var(--fs-xs);
	}

	/* The intro line a field can carry, which is a direct child. A row's own hint is nested
	   inside its label, so the child combinator is what keeps the two apart. */
	.field > .hint {
		margin-bottom: 0.5rem;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.5rem;
	}

	.tile {
		position: relative;
		display: grid;
		gap: 0.375rem;
		padding: 0.5rem;
		background: var(--c-surface-1);
		border: var(--bw-strong) solid transparent;
		border-radius: var(--r-md);
		cursor: pointer;
	}

	.rows {
		display: grid;
		gap: 0.125rem;
	}

	.row {
		position: relative;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--r-sm);
		cursor: pointer;
	}

	/* The radio itself does the work and stays in the tab order; it is only moved off screen so
	   the tile can be the control. `sr-only` would collapse it and take the focus ring with it.

	   Its label is the containing block, which is what the two `position: relative` above are for.
	   Without them the nearest positioned ancestor is the window, so the input keeps its static
	   position against the window frame and does not move when the panel scrolls: the control you
	   can see slides away and the 1px box you cannot stays where it was. */
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.tile.on,
	.row.on {
		background: color-mix(in oklab, var(--c-select) 25%, transparent);
		box-shadow:
			1px 1px 0px var(--c-select),
			1px -1px 0px var(--c-select),
			-1px 1px 0px var(--c-select),
			-1px -1px 0px var(--c-select);
		color: var(--c-on-select);
	}

	.tile.on {
		border-color: var(--c-select);
	}

	.tile.on .name,
	.row.on .hint {
		color: inherit;
	}

	.tile:hover:not(.on),
	.row:hover:not(.on) {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	/* The ring has to land on the label, because that is the thing you can see. A 1px input
	   would draw the outline as a dot in the corner. */
	input:focus-visible {
		outline: none;
	}

	.tile:has(input:focus-visible),
	.row:has(input:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.name {
		text-transform: capitalize;
	}

	.swatch {
		width: 1rem;
		height: 1rem;
		flex: none;
		align-self: center;
		background: var(--c-accent);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
	}
</style>
