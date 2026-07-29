<script lang="ts">
	import type { Skill } from '$lib/types/skill';

	let { skills, label = 'Skills' }: { skills: Skill[]; label?: string } = $props();
</script>

{#if skills.length > 0}
	<section class="grid gap-2">
		<h3 class="font-ui text-sm font-semibold">{label}</h3>
		<!-- A list, because it is one. Screen readers announce the count, which is the useful part. -->
		<ul class="flex flex-wrap gap-1.5">
			{#each skills as skill (skill.name)}
				<li
					class="rounded-sm border border-line bg-surface-2 px-2 py-0.5 font-ui text-xs text-fg-2"
				>
					{skill.name}
				</li>
			{/each}
		</ul>
	</section>
{/if}
