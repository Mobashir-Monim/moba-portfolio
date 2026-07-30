import { describe, expect, test } from 'bun:test';
import {
	back,
	clear,
	digit,
	dot,
	equals,
	format,
	negate,
	operate,
	PRO_NOTE,
	START,
	type Calc,
	type Op
} from './calc';

/**
 * The keypad, driven as a string of key presses. `press` is what makes each case read as the
 * thing a person actually does, which is the only way an arithmetic bug in a state machine is
 * visible without stepping through it.
 */
function press(keys: string, pro = false): Calc {
	let calc = START;
	for (const key of keys) {
		if (key === ' ') continue;
		else if (key >= '0' && key <= '9') calc = digit(calc, key);
		else if (key === '.') calc = dot(calc);
		else if (key === '=') calc = equals(calc);
		else if (key === 'c') calc = clear();
		else if (key === '<') calc = back(calc);
		else if (key === '~') calc = negate(calc);
		else calc = operate(calc, key as Op, pro);
	}
	return calc;
}

const shows = (keys: string, pro = false) => press(keys, pro).display;

describe('entry', () => {
	test('digits replace the leading zero and then append', () => {
		expect(shows('5')).toBe('5');
		expect(shows('50')).toBe('50');
		expect(shows('007')).toBe('7');
	});

	test('a decimal point lands once', () => {
		expect(shows('3.14')).toBe('3.14');
		expect(shows('3.1.4')).toBe('3.14');
		expect(shows('.5')).toBe('0.5');
	});

	test('the screen stops taking digits at twelve', () => {
		expect(shows('1234567890123456')).toBe('123456789012');
	});

	test('delete walks back to zero and stops', () => {
		expect(shows('123<')).toBe('12');
		expect(shows('5<<<')).toBe('0');
	});

	test('sign flips, except on zero', () => {
		expect(shows('5~')).toBe('-5');
		expect(shows('5~~')).toBe('5');
		expect(shows('~')).toBe('0');
	});

	test('clear goes back to the start', () => {
		expect(press('12+34c')).toEqual(START);
	});
});

describe('arithmetic', () => {
	test('the four operations, with division unlocked', () => {
		expect(shows('2+3=')).toBe('5');
		expect(shows('9-4=')).toBe('5');
		expect(shows('6×7=')).toBe('42');
		expect(shows('8÷2=', true)).toBe('4');
	});

	test('a chain applies as it goes, rather than at the end', () => {
		// 2 + 3 shows 5 the moment the second + is pressed, and 9 after the 4.
		expect(shows('2+3+')).toBe('5');
		expect(shows('2+3+4=')).toBe('9');
	});

	test('two operators in a row swap rather than apply', () => {
		expect(shows('7+-3=')).toBe('4');
	});

	test('equals with nothing pending leaves the number alone', () => {
		expect(shows('42=')).toBe('42');
	});

	test('a fresh digit after equals starts a new sum', () => {
		expect(shows('2+3=7+1=')).toBe('8');
	});

	test('binary floating point stays off the screen', () => {
		expect(shows('0.1+0.2=')).toBe('0.3');
	});

	test('format keeps twelve digits and names the rest', () => {
		expect(format(1 / 3)).toBe('0.333333333333');
		expect(format(Infinity)).toBe('Error');
	});
});

describe('the paywall', () => {
	test('division refuses and says why', () => {
		const calc = press('8÷');
		expect(calc.note).toBe(PRO_NOTE);
		expect(calc.op).toBeNull();
	});

	test('refusing costs nothing else: the entry survives', () => {
		expect(shows('8÷')).toBe('8');
		expect(shows('8÷2=')).toBe('82');
	});

	test('the other three are never gated', () => {
		for (const op of ['+', '-', '×']) expect(press(`8${op}`).note).toBeUndefined();
	});

	test('the next key clears the note', () => {
		expect(press('8÷5').note).toBeUndefined();
	});
});
