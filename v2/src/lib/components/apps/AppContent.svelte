<script lang="ts">
	import { isDark, settings, update } from '$lib/appearance.svelte';
	import {
		CALCULATOR_ID,
		SETTINGS_ID,
		SNAKE_ID,
		SYSINFO_ID,
		TERMINAL_ID,
		TILES_ID
	} from '$lib/apps';
	import SettingsPanel from '../SettingsPanel.svelte';
	import Calculator from './Calculator.svelte';
	import Snake from './Snake.svelte';
	import SystemInfo from './SystemInfo.svelte';
	import Terminal from './Terminal.svelte';
	import Tiles from './Tiles.svelte';

	let { id }: { id: string } = $props();
</script>

<!--
	The one component that stands between an app id and the app, which is what `NodeContent` is for
	content types. `WindowFrame` had a branch for the only app that existed; a second one would have
	made it two, and a third makes it the shape ledger #27 describes.

	A branch per app rather than a lookup table, because each one takes different props: the
	settings panel is driven by the store and System Info takes none. `apps.test.ts` is what holds
	this file to the roster, since a missing case here is an empty window rather than an error.
-->
{#if id === SETTINGS_ID}
	<SettingsPanel
		skin={settings.skin}
		theme={settings.theme}
		appearance={settings.appearance}
		clickMode={settings.clickMode}
		dark={isDark()}
		onchange={update}
	/>
{:else if id === TERMINAL_ID}
	<Terminal />
{:else if id === SYSINFO_ID}
	<SystemInfo />
{:else if id === SNAKE_ID}
	<Snake />
{:else if id === CALCULATOR_ID}
	<Calculator />
{:else if id === TILES_ID}
	<Tiles />
{/if}
