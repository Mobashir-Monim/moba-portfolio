import { expect, test } from 'bun:test';
import { formatSize } from './fs';

/** Ledger #7. The old site threw on anything past the GB row, so the tail is the whole point. */
test('formatSize scales through every unit and cannot step off the table', () => {
	expect(formatSize(0)).toBe('0 B');
	expect(formatSize(512)).toBe('512 B');
	expect(formatSize(1024)).toBe('1.0 KB');
	expect(formatSize(1536)).toBe('1.5 KB');
	expect(formatSize(1024 ** 2)).toBe('1.0 MB');
	expect(formatSize(1024 ** 3)).toBe('1.0 GB');
	expect(formatSize(1024 ** 4)).toBe('1.0 TB');
	expect(formatSize(1024 ** 5)).toBe('1.0 PB');
	// Past the last unit it keeps counting in PB rather than reading off the end.
	expect(formatSize(1024 ** 7)).toBe('1048576 PB');
});

test('formatSize drops the decimal once it stops carrying information', () => {
	expect(formatSize(9.5 * 1024)).toBe('9.5 KB');
	expect(formatSize(64 * 1024)).toBe('64 KB');
});

test('formatSize refuses nonsense instead of rendering it', () => {
	expect(formatSize(-1)).toBe('0 B');
	expect(formatSize(Number.NaN)).toBe('0 B');
	expect(formatSize(Number.POSITIVE_INFINITY)).toBe('0 B');
});
