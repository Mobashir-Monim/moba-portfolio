/**
 * The invented filesystem details that give the info sidebar its charm.
 *
 * Ledger #7: the old site's `calculateSize()` walked a divisor table and read
 * `unitDivisors[index + 1].divisor` with no bounds check, so anything past the GB row threw.
 * The loop below cannot step off the end of `UNITS`, which is the bound, not a check bolted on
 * after one.
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/** Binary units, because a file manager has always lied in the same direction. */
export function formatSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return '0 B';

	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < UNITS.length - 1) {
		value /= 1024;
		unit += 1;
	}

	// Whole bytes never get a decimal; anything scaled gets one until it no longer helps.
	const digits = unit === 0 ? 0 : value < 10 ? 1 : 0;
	return `${value.toFixed(digits)} ${UNITS[unit]}`;
}
