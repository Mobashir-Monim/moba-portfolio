import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

/**
 * What System Info reports about the machine it runs on. Injected rather than written down: a
 * hardcoded version goes stale on the next `bun update`, and the joke curdles the moment one of
 * these numbers is wrong.
 *
 * This dumps every dev dependency and lets `$lib/build` pick and label. The config has no
 * business deciding what a reader of that window sees.
 */
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const versions: Record<string, string> = {};
for (const [name, range] of Object.entries(pkg.devDependencies as Record<string, string>)) {
	versions[name] = range.replace(/^[\^~]/, '');
}

/**
 * Bun's own version, which is nothing's dependency and so appears in no manifest.
 *
 * Asked of the binary rather than read off `process.versions`, because `bun run dev` honours the
 * shebang on vite's bin and that shebang says node: this file is evaluated by Node even in a
 * repo that has no npm in it. Empty if bun is not on PATH, and `$lib/build` drops the row rather
 * than printing a blank one.
 */
try {
	versions.bun = execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim();
} catch {
	versions.bun = '';
}

export default defineConfig({
	define: {
		/**
		 * The day, not the minute. SvelteKit builds the client and the server separately, so this
		 * file is evaluated more than once per build, and a value that could straddle a minute
		 * boundary would put two different strings into one deploy. `SITE_MODIFIED` reads this and
		 * lands in prerendered HTML, so the two renders have to agree.
		 */
		__BUILT__: JSON.stringify(new Date().toISOString().slice(0, 10)),
		__VERSIONS__: JSON.stringify(versions)
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
