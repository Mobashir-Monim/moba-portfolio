import type { Kind, View } from './os';

/**
 * The one module that owns window state.
 *
 * Three rules from `CLAUDE.md` shape everything below, and each one is a defect the old site
 * actually shipped:
 *
 * - Array order is stacking order, and focus moves a record to the end. The old store searched
 *   for an index it never assigned (ledger #1: `originIndex === index;` is a comparison), then
 *   ran `splice(-1, 1)` and deleted whichever window happened to be on top.
 * - Every mutator produces a new array and new records rather than splicing a shared reference
 *   and handing back the same object (ledger #8).
 * - Navigation history is a stack of string ids, never window objects. The old store wrote
 *   `origin.tail = target` where `target.origin === origin`, putting a reference cycle into
 *   state (ledger #9).
 */

export type WindowRecord = {
	/** Stable identity, the slug the window was opened from. One window per item. */
	id: string;
	kind: Kind;
	/**
	 * When this window was opened, monotonic. Stacking order is the array order, but the DOM has
	 * to be rendered in an order that never changes: moving a node mid-press loses the click that
	 * press was going to produce, which is 2.13. So the layer sorts by this and spends `z-index`
	 * on the stack instead.
	 */
	seq: number;
	/**
	 * Desktop position in pixels, once the window has been dragged. Applied as `translate3d()`,
	 * never `left`/`top` (ledger #24).
	 *
	 * Undefined until the first drag, and undefined is load-bearing for the same reason it is on
	 * `w`/`h` below: a new window opens in the middle of the desktop, and where the middle is
	 * depends on the viewport and on the window's own default size, which is a CSS expression. A
	 * number frozen at open time would be wrong the moment either changed. `seq` carries the
	 * cascade, so two windows opened back to back still do not land on each other.
	 */
	x?: number;
	y?: number;
	/**
	 * Size in pixels, once the window has been resized. Undefined until then, and undefined is
	 * load-bearing: the default size is a CSS expression against the viewport, so a record that
	 * has never been resized has no business claiming a number the stylesheet can already work
	 * out, and would go stale the moment the viewport changed.
	 */
	w?: number;
	h?: number;
	/**
	 * How this window draws what it holds. Window state rather than component state because the
	 * frame unmounts while minimized, and a view that reset itself every time you put a window
	 * away would be a setting you cannot keep.
	 */
	view: View;
	minimized: boolean;
	/**
	 * Node ids visited in this window, oldest first. `history[0]` is always `id`, so a window
	 * can always walk back to what opened it without holding a reference to anything.
	 */
	history: string[];
	/** Cursor into `history`. Everything after it is the forward stack. */
	index: number;
};

/**
 * How many windows the cascade walks before it returns to the middle. The step itself is a CSS
 * length, because the offset is applied against a position only the stylesheet knows.
 */
export const WRAP = 6;

/** The node a window is currently showing, which is not the node it was opened from. */
export function current(w: WindowRecord): string {
	return w.history[w.index];
}

export function canBack(w: WindowRecord): boolean {
	return w.index > 0;
}

export function canForward(w: WindowRecord): boolean {
	return w.index < w.history.length - 1;
}

/**
 * A factory rather than bare module state, so each test gets its own desktop. The singleton
 * below is the only one the app ever uses.
 */
export function createWindows() {
	let list = $state<WindowRecord[]>([]);

	/** Monotonic, so closing a window and opening another does not reuse its position. */
	let cascade = 0;

	function replace(id: string, patch: (w: WindowRecord) => WindowRecord): void {
		list = list.map((w) => (w.id === id ? patch(w) : w));
	}

	/** Move one record to the end of the array, which is the top of the stack. */
	function raise(id: string, patch: (w: WindowRecord) => WindowRecord = (w) => w): void {
		const found = list.find((w) => w.id === id);
		if (!found) return;
		list = [...list.filter((w) => w.id !== id), patch(found)];
	}

	return {
		/** Stacking order, bottom first. Render in this order and the last one draws on top. */
		get all(): WindowRecord[] {
			return list;
		},

		/**
		 * The topmost window a user can actually see. Minimizing the front window therefore
		 * focuses the one behind it with no extra bookkeeping.
		 */
		get focused(): WindowRecord | undefined {
			for (let i = list.length - 1; i >= 0; i--) if (!list[i].minimized) return list[i];
			return undefined;
		},

		/** What the dock groups by. Minimized windows count, because clicking the group restores them. */
		get counts(): Record<Kind, number> {
			return {
				folder: list.filter((w) => w.kind === 'folder').length,
				document: list.filter((w) => w.kind === 'document').length,
				app: list.filter((w) => w.kind === 'app').length
			};
		},

		byId(id: string): WindowRecord | undefined {
			return list.find((w) => w.id === id);
		},

		isFocused(id: string): boolean {
			return this.focused?.id === id;
		},

		/** Opening something already open focuses and unminimizes it instead of duplicating it. */
		open(id: string, kind: Kind): void {
			if (list.some((w) => w.id === id)) {
				raise(id, (w) => ({ ...w, minimized: false }));
				return;
			}

			list = [
				...list,
				{
					id,
					kind,
					seq: cascade++,
					view: 'icon',
					minimized: false,
					history: [id],
					index: 0
				}
			];
		},

		close(id: string): void {
			list = list.filter((w) => w.id !== id);
		},

		/** Raises without unminimizing: a minimized window is not something to look at. */
		focus(id: string): void {
			raise(id);
		},

		minimize(id: string): void {
			replace(id, (w) => ({ ...w, minimized: true }));
		},

		restore(id: string): void {
			raise(id, (w) => ({ ...w, minimized: false }));
		},

		/** The dock's group click: unminimize a whole kind and bring it forward in place. */
		restoreKind(kind: Kind): void {
			const group = list.filter((w) => w.kind === kind).map((w) => ({ ...w, minimized: false }));
			list = [...list.filter((w) => w.kind !== kind), ...group];
		},

		/** Committed once on pointerup. The gesture itself lives in component-local state. */
		moveTo(id: string, x: number, y: number): void {
			replace(id, (w) => ({ ...w, x, y }));
		},

		/** Same contract as `moveTo`: the drag is local, this is the one write it produces. */
		resizeTo(id: string, w: number, h: number): void {
			replace(id, (rec) => ({ ...rec, w, h }));
		},

		/** Per window, the way Finder is per folder. It survives navigating inside the window. */
		setView(id: string, view: View): void {
			replace(id, (w) => ({ ...w, view }));
		},

		/** Navigating anywhere discards the forward stack, the way every back button has. */
		navigate(id: string, nodeId: string): void {
			replace(id, (w) => {
				if (current(w) === nodeId) return w;
				const history = [...w.history.slice(0, w.index + 1), nodeId];
				return { ...w, history, index: history.length - 1 };
			});
		},

		back(id: string): void {
			replace(id, (w) => (canBack(w) ? { ...w, index: w.index - 1 } : w));
		},

		forward(id: string): void {
			replace(id, (w) => (canForward(w) ? { ...w, index: w.index + 1 } : w));
		}
	};
}

export const windows = createWindows();
