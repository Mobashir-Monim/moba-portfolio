/**
 * What the build knows about itself.
 *
 * `vite.config.ts` injects these through `define`, which is a literal text substitution at
 * transform time rather than a value in scope. `bun test` has no vite, so the identifiers are
 * simply absent there, and `typeof` is the one operator that can ask about an undeclared
 * identifier without throwing.
 *
 * Task 4.5 asks for real numbers rather than hardcoded ones, and this is where that promise is
 * kept for everything a build can know. What a build cannot know stays out: Lighthouse scores
 * need Lighthouse to have run, so they wait for 6.1 rather than being a hardcoded 100.
 */

/**
 * The ISO day this bundle was built. Retires the hand-bumped constant `SITE_MODIFIED` used to be:
 * a deploy now dates the whole site, which is what that comment in `os.ts` was waiting for.
 *
 * The fallback is deliberately absurd. It only ever surfaces under `bun test`, and if it were a
 * plausible date it could leak into a build with a broken `define` and never be noticed.
 */
export const BUILT = typeof __BUILT__ === 'string' ? __BUILT__ : '1970-01-01';

const VERSIONS: Record<string, string> = typeof __VERSIONS__ === 'object' ? __VERSIONS__ : {};

/**
 * What System Info prints, in the order it prints it. Package names live here rather than in the
 * config so that `vite.config.ts` stays a dump of `package.json` and this file owns what a reader
 * of that window actually sees.
 */
const LABELS: [pkg: string, label: string][] = [
	['@sveltejs/kit', 'SvelteKit'],
	['svelte', 'Svelte'],
	['tailwindcss', 'Tailwind CSS'],
	['typescript', 'TypeScript'],
	['vite', 'Vite'],
	['wrangler', 'Wrangler'],
	['bun', 'Bun']
];

/**
 * A package the build could not see is left out rather than printed empty. `bun` is the row that
 * actually goes missing: its version is the runtime's, not a dependency's, so it is absent
 * whenever the build ran under something else.
 */
export const STACK: [label: string, version: string][] = LABELS.filter(
	([name]) => VERSIONS[name]
).map(([name, label]) => [label, VERSIONS[name]]);
