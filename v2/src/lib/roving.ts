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
 * How many icons a row holds. Measured rather than declared: the grid wraps at whatever the
 * window is wide, so where the second row starts is the only honest source.
 */
function columnsOf(items: HTMLElement[]): number {
	const top = items[0]?.offsetTop;
	const wrapped = items.findIndex((item) => item.offsetTop !== top);
	return wrapped === -1 ? Math.max(items.length, 1) : wrapped;
}

/**
 * The handler an icon carries. It sits on the link itself, so the element taking the key is an
 * interactive one and Svelte owns the listener; its siblings are the rest of the container.
 */
export function move(event: KeyboardEvent): void {
	const link = event.currentTarget as HTMLElement;
	const items = [...(link.parentElement?.querySelectorAll<HTMLElement>('a') ?? [])];

	const next = nextIndex(event.key, items.indexOf(link), items.length, columnsOf(items));
	if (next === undefined) return;

	// The arrows scroll otherwise, and what wants looking at is the icon that just took focus.
	event.preventDefault();
	items[next]?.focus();
}
