// `bun test` does not understand runes. Rune-based state lives in `.svelte.ts` modules, so
// strip the TypeScript, run it through Svelte's module compiler, and hand Bun plain JS.
// Preloaded by bunfig.toml.
import { plugin } from 'bun';
import { compileModule } from 'svelte/compiler';

const transpiler = new Bun.Transpiler({ loader: 'ts' });

plugin({
	name: 'svelte-runes',
	setup(build) {
		// SvelteKit's virtual modules only exist inside its build. `browser` is the one a
		// `.svelte.ts` module reads, and under `bun test` there is no browser.
		build.module('$app/environment', () => ({
			contents: 'export const browser = false;',
			loader: 'js'
		}));

		build.onLoad({ filter: /\.svelte\.(ts|js)$/ }, async ({ path }) => {
			const source = await Bun.file(path).text();
			const js = path.endsWith('.ts') ? transpiler.transformSync(source) : source;
			const { js: compiled } = compileModule(js, { filename: path, generate: 'client' });
			return { contents: compiled.code, loader: 'js' };
		});
	}
});
