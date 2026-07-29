<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { OS_NAME } from '$lib/os';

	/**
	 * The one page `CLAUDE.md` asks for a voice in and no earlier task built. Until now a wrong URL
	 * got SvelteKit's bare error page, which reads to a crawler as a soft 404 and to a visitor as
	 * a different site.
	 *
	 * The voice is the shell's, because that is the one Terminal (4.4) will speak in too, and a
	 * missing path is a missing file in an OS that is a filesystem.
	 */
	const reason = $derived(
		page.status === 404 ? 'No such file or directory' : (page.error?.message ?? 'Unknown error')
	);
</script>

<svelte:head>
	<title>{page.status} | {OS_NAME}</title>
	<!-- An error page that indexes is a page claiming to be content. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="grid min-h-dvh place-items-center px-6 py-10">
	<div class="grid w-full max-w-lg gap-4">
		<pre
			class="overflow-x-auto rounded-md border border-line bg-surface-1 p-4 font-mono text-sm"><span
				class="text-fg-3">{OS_NAME.toLowerCase()}:</span
			> ls {page.url.pathname}
{OS_NAME.toLowerCase()}: <span class="text-accent">{page.status}</span>: {reason}</pre>

		<p class="text-fg-2">
			Nothing is mounted at that path. The desktop is the whole filesystem, so whatever you were
			after is one click from the root.
		</p>

		<p>
			<a href={resolve('/')} class="font-ui text-sm underline underline-offset-4">
				Back to the desktop
			</a>
		</p>
	</div>
</main>
