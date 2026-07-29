import { expect, test } from 'bun:test';
import { formatRange, formatYearMonth } from './date';

test('formats a year-month', () => {
	expect(formatYearMonth('2022-11')).toBe('Nov 2022');
	expect(formatYearMonth('2016-01')).toBe('Jan 2016');
	expect(formatYearMonth('2019-12')).toBe('Dec 2019');
});

// A sidebar reading the raw value is recoverable. One reading `undefined 2022` is not.
test('hands back anything that is not a month', () => {
	expect(formatYearMonth('2022-13')).toBe('2022-13');
	expect(formatYearMonth('2022-00')).toBe('2022-00');
	expect(formatYearMonth('soon')).toBe('soon');
	expect(formatYearMonth('')).toBe('');
});

test('a missing end reads as present, not as a blank', () => {
	expect(formatRange('2018-12')).toBe('Dec 2018 to present');
	expect(formatRange('2022-11', '2023-08')).toBe('Nov 2022 to Aug 2023');
});
