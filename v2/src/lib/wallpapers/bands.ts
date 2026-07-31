/**
 * What a wallpaper is made of, held apart from how it is drawn.
 *
 * A drawn wallpaper is a folder of SVGs beside this file, one per depth slot, and everything the
 * scene needs beyond the geometry follows from which slots it filled: which plane a band belongs
 * to, how much haze it takes, and where it sits in the ink chain. So the folder is the whole
 * declaration, and `Wallpaper.svelte` reads it through the bundler rather than naming any of it.
 *
 * Pure on purpose, with no `?raw` import anywhere in it, because that is what lets the test import
 * the real derivation instead of regexing the component for a table.
 */

/**
 * The nine depth slots, back to front: three plane faces and the two reliefs behind each. A masked
 * wallpaper names them as tokens in `app.css`, a drawn one names them by having a file called that,
 * and the order is shared because the two pipelines interleave into one scene.
 */
export const SLOTS = [
	'far-2',
	'far-1',
	'far',
	'mid-2',
	'mid-1',
	'mid',
	'near-2',
	'near-1',
	'near'
] as const;

/**
 * How many stops a scene's ink ramp has: the sky's two ends plus one base per band.
 *
 * Per scene rather than fixed, because the band count is the art's to decide and the ramp's job is
 * to reach from the sky to the foreground in however many steps the art takes to get there.
 * `grove` traces seven bands out of one illustration and `mountains` arrives as eight layers;
 * `night-scene` is three, a hill, a further hill and a tree, and holding all three to one number
 * would mean inventing terrain for one and throwing terrain away from another.
 *
 * What does not vary is where the ramp starts and ends. Every scene spans the same five background
 * shades, `50` to `400`, so a longer ramp is a finer ramp rather than a wider one and no scene can
 * reach the foreground stops the desktop's icon glyphs are built to be readable against.
 */
export const inks = (bands: number) => bands + 2;

export type Band = {
	slot: string;
	/** `far`, `mid`, or `near`. A relief is the same distance as its face, so it takes its haze. */
	plane: string;
	crest: number;
	base: number;
};

/**
 * The bands a drawn wallpaper renders, back to front, each with the two ink stops it reads.
 *
 * A band's crest is the ink its predecessor ended on, so consecutive bands meet at a shared value
 * and the seam between them is a silhouette rather than an edge in the wash. That is what makes
 * the scene one gradient instead of seven: run a finger down the screen and the colour never
 * steps, only the shapes do.
 *
 * The chain starts at ink 2, the darker of the sky's two stops, and closes on `inks(n)`, so the
 * scene's block in `app.css` has to declare exactly that many stops. One short and the foreground
 * reads a stop that was never declared, resolves to nothing, and paints black; one long and the
 * ramp's darkest end is never spent. Both are invisible in a diff, so the test checks the length
 * against the folder rather than against a number.
 */
export function bands(slots: Iterable<string>): Band[] {
	const present = new Set(slots);
	return SLOTS.filter((slot) => present.has(slot)).map((slot, i) => ({
		slot,
		plane: slot.split('-')[0],
		crest: i + 2,
		base: i + 3
	}));
}
