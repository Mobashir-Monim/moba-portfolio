import { expect, test } from 'bun:test';
import { counter } from './rune-loader-check.svelte';

test('runes compile under bun test', () => {
	const c = counter();
	c.inc();
	expect(c.value).toBe(1);
});
