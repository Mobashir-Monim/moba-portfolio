/**
 * The calculator, as pure state. Same split `$lib/snake` and `$lib/terminal` use: a function per
 * key, so the component is a keypad and a screen and nothing else.
 *
 * The paywall lives in here rather than in the component, because "division is a Pro feature" is
 * the product rule this app exists to tell a joke about, and a rule with no test is a punchline
 * that can stop working quietly.
 */

export type Op = '+' | '-' | '×' | '÷';

export type Calc = {
	/**
	 * What the screen shows, as a string. `0.`, `-0` and a half-typed number are all display
	 * states, and none of them survive a round trip through `number`.
	 */
	display: string;
	/** The left-hand side, held from the moment an operator is pressed until it is applied. */
	acc: number | null;
	op: Op | null;
	/** Whether the next digit starts a new entry rather than appending to this one. */
	fresh: boolean;
	/** What the last key refused to do. Cleared by whatever comes next. */
	note?: string;
};

export const START: Calc = { display: '0', acc: null, op: null, fresh: true };

export const PRO_NOTE = 'Division is a Calculator Pro feature.';

/** Digits the screen holds. Past this the entry stops taking, the way a pocket calculator does. */
const WIDTH = 12;

/**
 * Twelve significant digits, then back through `Number` to drop the trailing zeros `toPrecision`
 * leaves. That is the whole of what keeps `0.1 + 0.2` off the screen as `0.30000000000000004`.
 */
export function format(n: number): string {
	if (!Number.isFinite(n)) return 'Error';
	return String(Number(n.toPrecision(WIDTH)));
}

function apply(a: number, op: Op, b: number): number {
	switch (op) {
		case '+':
			return a + b;
		case '-':
			return a - b;
		case '×':
			return a * b;
		case '÷':
			return a / b;
	}
}

export function digit(calc: Calc, d: string): Calc {
	const base = calc.fresh || calc.display === '0' ? '' : calc.display;
	if (base.replace(/[-.]/g, '').length >= WIDTH) return { ...calc, note: undefined };
	return { ...calc, display: base + d, fresh: false, note: undefined };
}

export function dot(calc: Calc): Calc {
	if (calc.fresh) return { ...calc, display: '0.', fresh: false, note: undefined };
	if (calc.display.includes('.')) return { ...calc, note: undefined };
	return { ...calc, display: calc.display + '.', note: undefined };
}

/** Delete, which is the one key a pocket calculator never had and every keyboard user expects. */
export function back(calc: Calc): Calc {
	if (calc.fresh) return { ...calc, note: undefined };
	const next = calc.display.slice(0, -1);
	return { ...calc, display: next === '' || next === '-' ? '0' : next, note: undefined };
}

export function negate(calc: Calc): Calc {
	const flipped = calc.display.startsWith('-') ? calc.display.slice(1) : '-' + calc.display;
	return { ...calc, display: calc.display === '0' ? '0' : flipped, note: undefined };
}

export function clear(): Calc {
	return START;
}

/**
 * An operator both applies the pending one and stores itself, which is what makes `2 + 3 + 4`
 * show 5 before it shows 9. Pressing two in a row just swaps the stored one, since nothing has
 * been typed between them to apply it to.
 */
export function operate(calc: Calc, op: Op, pro = false): Calc {
	if (op === '÷' && !pro) return { ...calc, note: PRO_NOTE };

	const value = Number(calc.display);
	if (calc.fresh && calc.op !== null) return { ...calc, op, note: undefined };

	const acc = calc.acc === null || calc.op === null ? value : apply(calc.acc, calc.op, value);
	return { display: format(acc), acc, op, fresh: true, note: undefined };
}

export function equals(calc: Calc): Calc {
	if (calc.acc === null || calc.op === null) return { ...calc, fresh: true, note: undefined };

	const result = apply(calc.acc, calc.op, Number(calc.display));
	return { display: format(result), acc: null, op: null, fresh: true, note: undefined };
}
