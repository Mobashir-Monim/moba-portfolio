// Vite's ambient declarations, for the `?raw` imports that carry the content prose. Our
// `tsconfig.json` replaces the inherited `types` array, so this reference is how they arrive.
/// <reference types="vite/client" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	/**
	 * Build-time constants, substituted as literals by `define` in `vite.config.ts`. Read them
	 * through `$lib/build` and never directly: that module owns the fallback for the environments
	 * vite is not in, `bun test` being the one that exists.
	 */
	const __BUILT__: string;
	const __VERSIONS__: Record<string, string>;

	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
