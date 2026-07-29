import type { YearMonth } from './types/common';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * `2022-11` to `Nov 2022`. Anything that is not a month comes back untouched, because a sidebar
 * reading `undefined 2022` is worse than one reading the raw value.
 *
 * Not `Intl.DateTimeFormat`: this is a month and a year with no day, and constructing a `Date`
 * to print two fields drags a timezone into a value that has none.
 */
export function formatYearMonth(value: YearMonth): string {
	const [year, month] = value.split('-');
	const name = MONTHS[Number(month) - 1];
	return name && year ? `${name} ${year}` : value;
}

/** `Nov 2022 to Aug 2023`, or `Nov 2022 to present` while it is still running. */
export function formatRange(start: YearMonth, end?: YearMonth): string {
	return `${formatYearMonth(start)} to ${end ? formatYearMonth(end) : 'present'}`;
}
