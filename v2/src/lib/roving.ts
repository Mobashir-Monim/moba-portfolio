/**
 * Arrow keys across a set of icons.
 *
 * The icons stay plain links rather than becoming a `role="grid"` or a `role="listbox"`, which is
 * the other pattern the spec allows. A role is an attribute, so it ships in the prerendered
 * HTML and is still there with JavaScript off, promising keyboard behaviour that nothing is around
 * to provide. A link promises nothing it does not already do: it is reachable, Enter opens it, and
 * this adds the movement on top of that. Ledger #20 was the opposite trade, a div with a keydown
 * handler that fired on every key and a link's job done by hand.
 */

/**
 * Where an arrow key lands. `undefined` means this key is none of our business, which is every
 * key the browser already has a better answer for, Enter and Tab included.
 *
 * Rows are the unit for the vertical arrows, so a wrapping grid moves down a row rather than
 * along by one. A list is a grid one column wide and needs no separate case.
 *
 * A step off the edge stays where it is rather than clamping into range: clamped, Up from the
 * top row lands on the first item, which is a sideways jump the key did not ask for. It still
 * counts as ours, so the arrow does not scroll the page instead.
 */
export function nextIndex(
	key: string,
	index: number,
	count: number,
	columns: number
): number | undefined {
	if (index < 0 || count === 0) return undefined;

	const step: Record<string, number> = {
		ArrowRight: 1,
		ArrowLeft: -1,
		ArrowDown: columns,
		ArrowUp: -columns
	};

	if (key in step) {
		const target = index + step[key];
		return target >= 0 && target < count ? target : index;
	}

	if (key === 'Home') return 0;
	if (key === 'End') return count - 1;
	return undefined;
}

/**
 * How many links a row holds. Measured rather than declared: the grid wraps at whatever the
 * window is wide, so where the second row starts is the only honest source.
 *
 * It is also what makes one walker serve four different layouts without being told which it is
 * in. A wrapping icon grid measures its real column count. A list is a stack, so the second link
 * is already on a new row and it measures 1, which is what makes the vertical arrows step one
 * row there. A gallery strip never wraps, so nothing has a different top and it measures the
 * whole set, which puts every step on the horizontal arrows. The column view marks each of its
 * lists separately and each measures 1, like the list view.
 *
 * **The top comes off the box and not off `offsetTop`**, which is not a preference. `offsetTop` is
 * measured from the `offsetParent`, and the HTML spec makes a `td` or a `th` an `offsetParent` in
 * its own right, with or without a `position`. So in the list view every row's link is measured
 * from the cell it sits in and every one of them reports 0: no top differs, this returns the whole
 * set, and the vertical arrows have nowhere to step. The first cut of 7.4 shipped exactly that and
 * only driving it found it, because the arrows moved on the desktop and the same code moved
 * nothing in a table.
 *
 * The tolerance goes with it. A viewport-relative top is fractional, and two links genuinely on
 * one row can differ in the last decimal, which an equality test reads as a wrap.
 *
 * ponytail: measuring only serves layouts whose rows are rows. The ceiling is the column view's
 * horizontal arrows, which step within one list rather than crossing into the next, because the
 * set they walk is one list by construction. Crossing needs the arrow to pick as it goes, since
 * the column to the right does not exist until something in this one is picked, and that is a
 * handler in `ColumnView` rather than anything this file can measure.
 */
export function columnsOf(items: readonly Measurable[]): number {
	const top = items[0]?.getBoundingClientRect().top ?? 0;
	const wrapped = items.findIndex((item) => Math.abs(item.getBoundingClientRect().top - top) > 1);
	return wrapped === -1 ? Math.max(items.length, 1) : wrapped;
}

/** All this needs of an element, which is also all a test has to hand it. */
type Measurable = { getBoundingClientRect(): { top: number } };

/**
 * The set a link moves within: every link inside the nearest ancestor carrying `data-roving`.
 *
 * That attribute is the contract, and it exists because this used to read `link.parentElement`.
 * That is only the right element in the icon grid, where the links are the grid's own children.
 * Every other view wraps each link in something first, a `th` in the list, an `li` in the columns
 * and the gallery strip, so the lookup found a parent holding exactly one link and the arrows did
 * nothing at all in three of the four views. It looked like a walker that could not count and it
 * was a walker that could not see: 7.4.
 *
 * A container that forgets the attribute gets no arrows rather than the wrong ones, and
 * `roving.test.ts` holds the two halves together at the source level so a fifth view cannot ship
 * with one and not the other.
 */
function setOf(link: HTMLElement): HTMLElement[] {
	return [...(link.closest('[data-roving]')?.querySelectorAll<HTMLElement>('a') ?? [])];
}

/**
 * The handler a link carries. It sits on the link itself, so the element taking the key is an
 * interactive one and Svelte owns the listener.
 */
export function move(event: KeyboardEvent): void {
	const link = event.currentTarget as HTMLElement;
	const items = setOf(link);

	const next = nextIndex(event.key, items.indexOf(link), items.length, columnsOf(items));
	if (next === undefined) return;

	// The arrows scroll otherwise, and what wants looking at is the icon that just took focus.
	event.preventDefault();
	items[next]?.focus();
}
