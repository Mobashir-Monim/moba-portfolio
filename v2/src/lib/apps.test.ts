import { describe, expect, test } from 'bun:test';
import { app, APPS } from './apps';
import { nodes } from './tree';

/**
 * The roster contract.
 *
 * An app id and a content slug share one namespace, because one window store addresses both, and
 * the `app:` prefix is the whole of what keeps them apart. Nothing enforces that at runtime by
 * design, so it is enforced here.
 *
 * The second half is the one that would actually ship broken: a roster entry with no case in
 * `AppContent.svelte` opens a window with an empty body, which throws nothing and renders fine.
 */

const content = await Bun.file(
	new URL('./components/apps/AppContent.svelte', import.meta.url)
).text();

describe('ids stay out of the tree', () => {
	test('every app is prefixed', () => {
		expect(APPS.filter((a) => !a.id.startsWith('app:'))).toEqual([]);
	});

	test('no app id is also a node id', () => {
		expect(APPS.filter((a) => a.id in nodes)).toEqual([]);
	});

	test('ids and names are both unique', () => {
		expect(new Set(APPS.map((a) => a.id)).size).toBe(APPS.length);
		expect(new Set(APPS.map((a) => a.name)).size).toBe(APPS.length);
	});

	test('lookup finds a member and nothing else', () => {
		expect(app(APPS[0].id)).toBe(APPS[0]);
		expect(app('projects')).toBeUndefined();
	});
});

describe('AppContent tracks the roster', () => {
	/**
	 * `app:sysinfo` is rendered by the branch testing `SYSINFO_ID`, so the constant's name is the
	 * id with its prefix dropped and upper-cased. That convention is what makes this checkable
	 * without importing a `.svelte` file, which `bun test` cannot do, and it is the same trick
	 * `icons.test.ts` uses to hold `Icon.svelte` to the skin list.
	 */
	test('every app has a branch', () => {
		const missing = APPS.filter((a) => !content.includes(`${a.id.slice(4).toUpperCase()}_ID`));
		expect(missing).toEqual([]);
	});

	test('nothing but the roster gets one', () => {
		const rendered = [...content.matchAll(/id === (\w+)_ID/g)].map(([, name]) => name);
		const expected = APPS.map((a) => a.id.slice(4).toUpperCase());
		expect(rendered.sort()).toEqual(expected.sort());
	});
});
