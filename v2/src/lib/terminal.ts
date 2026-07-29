import { THEMES, type Theme } from './appearance.svelte';
import { about } from './content/about';
import { OS_NAME, OS_VERSION, OWNER, type Kind } from './os';
import { byHref, childrenOf, nodes, root, type Node } from './tree';

/**
 * The command layer, over the tree that already exists.
 *
 * Pure, and deliberately so: no DOM, no window store, no settings. A command that changes
 * something returns an `Effect` describing it and `Terminal.svelte` performs it, which is what
 * makes every command in here a plain input-to-output assertion in `terminal.test.ts`.
 *
 * Paths are hrefs. The tree carries no parent map by design (2.11), but a URL is one, so `..` is
 * string work on the href rather than a lookup the tree cannot answer. 2.12's breadcrumbs are the
 * same trick.
 */

/** The root, which is the desktop. Not a node: nothing owns the whole filesystem. */
export const HOME = '/';

/** The 404 page speaks in this voice too, and both take it from the same constant. */
const SHELL = OS_NAME.toLowerCase();

const NOENT = 'No such file or directory';

/** What the shell opens on, and the only place it introduces itself. */
export const BANNER = [
	`${OS_NAME} ${OS_VERSION}`,
	'Type help for the command list. Tab completes, and the arrow keys walk your history.',
	''
];

/**
 * The prompt, which is also the shell's whole status display: it is where the current directory
 * is shown, so `pwd` would be printing something already on screen.
 */
export function prompt(cwd: string): string {
	return `${SHELL}:${cwd}$ `;
}

export type Effect =
	{ do: 'open'; id: string; kind: Kind } | { do: 'theme'; theme: Theme } | { do: 'clear' };

export type Result = {
	lines: string[];
	/** Where the shell is after the command. Only `cd` moves it. */
	cwd: string;
	effect?: Effect;
};

type Handler = (arg: string | undefined, cwd: string) => Omit<Result, 'cwd'> & { cwd?: string };

type Command = {
	/** What `help` prints, and the only place a command's arguments are described. */
	usage: string;
	blurb: string;
	run: Handler;
};

// --- The filesystem underneath ----------------------------------------------------------------

/**
 * A path against the current directory. `~` and a leading `/` both mean the root; `.` means here,
 * which is what an omitted argument resolves to for every command but `cd`.
 */
function resolve(cwd: string, arg = '.'): string {
	const parts = arg.startsWith('/') || arg.startsWith('~') ? [] : cwd.split('/').filter(Boolean);

	for (const segment of arg.replace(/^~/, '').split('/')) {
		if (!segment || segment === '.') continue;
		// A step above the root stays at the root, the way `cd ..` in `/` has always done.
		if (segment === '..') parts.pop();
		else parts.push(segment);
	}

	return `/${parts.join('/')}`;
}

/** A resolved path, or nothing. No `node` means the root, which has children but no record. */
type Target = { node?: Node; children: Node[] };

function look(path: string): Target | undefined {
	if (path === HOME) return { children: root.map((id) => nodes[id]) };
	const found = byHref(path);
	return found ? { node: found, children: childrenOf(found.id) } : undefined;
}

/** The last href segment, which is the filename. Not `name`: those carry spaces, paths do not. */
function segment(item: Node): string {
	return item.href.slice(item.href.lastIndexOf('/') + 1);
}

/** What `ls` prints and what completion offers, so the two cannot disagree about a name. */
function label(item: Node): string {
	return item.kind === 'folder' ? `${segment(item)}/` : segment(item);
}

function fail(command: string, arg: string, reason: string): string {
	return `${SHELL}: ${command}: ${arg}: ${reason}`;
}

/** Paragraphs, with the blank line between them that makes them read as paragraphs. */
function paragraphs(text: readonly string[]): string[] {
	return text.flatMap((part, i) => (i === 0 ? [part] : ['', part]));
}

// --- The commands -----------------------------------------------------------------------------

/** Declaration order is the order `help` prints. */
const COMMANDS: Record<string, Command> = {
	help: {
		usage: 'help',
		blurb: 'This list.',
		run: () => {
			const width = Math.max(...Object.values(COMMANDS).map((c) => c.usage.length));
			return {
				lines: Object.values(COMMANDS).map((c) => `  ${c.usage.padEnd(width)}  ${c.blurb}`)
			};
		}
	},

	ls: {
		usage: 'ls [path]',
		blurb: 'List a directory.',
		run: (arg, cwd) => {
			const target = look(resolve(cwd, arg));
			if (!target) return { lines: [fail('ls', arg ?? '.', NOENT)] };
			// A document lists itself, which is what `ls` on a file has always done.
			if (target.node && target.node.kind !== 'folder') return { lines: [label(target.node)] };
			return { lines: target.children.map(label) };
		}
	},

	cd: {
		usage: 'cd [path]',
		blurb: 'Change directory. No argument goes home.',
		run: (arg, cwd) => {
			const shown = arg ?? '~';
			const path = resolve(cwd, arg ?? '~');
			const target = look(path);
			if (!target) return { lines: [fail('cd', shown, NOENT)] };
			if (target.node && target.node.kind !== 'folder')
				return { lines: [fail('cd', shown, 'Not a directory')] };
			return { lines: [], cwd: path };
		}
	},

	cat: {
		usage: 'cat [path]',
		blurb: 'Print what a document says.',
		run: (arg, cwd) => {
			const shown = arg ?? '.';
			const target = look(resolve(cwd, arg));
			if (!target) return { lines: [fail('cat', shown, NOENT)] };

			// An experience is the one folder that also has something to say, so it is readable and
			// the index folders are not. The root has no record at all.
			const found = target.node;
			if (!found || found.type === 'index')
				return { lines: [fail('cat', shown, 'Is a directory')] };
			return { lines: paragraphs(found.data.description) };
		}
	},

	open: {
		usage: 'open [path]',
		blurb: 'Open it in a window.',
		run: (arg, cwd) => {
			const shown = arg ?? '.';
			const target = look(resolve(cwd, arg));
			if (!target) return { lines: [fail('open', shown, NOENT)] };
			if (!target.node) return { lines: [fail('open', shown, 'Is the desktop')] };
			return {
				lines: [],
				effect: { do: 'open', id: target.node.id, kind: target.node.kind }
			};
		}
	},

	whoami: {
		usage: 'whoami',
		blurb: 'Who is logged in.',
		run: () => ({
			lines: [OWNER, `${about.person.first} ${about.person.last}, ${about.title}`]
		})
	},

	contact: {
		usage: 'contact',
		blurb: 'Where to reach that person.',
		run: () => {
			const width = Math.max(...about.socials.map((social) => social.label.length));
			return {
				lines: about.socials.map((social) => `${social.label.padEnd(width)}  ${social.href}`)
			};
		}
	},

	theme: {
		usage: 'theme [name]',
		blurb: 'Switch the colour theme. No argument lists them.',
		run: (arg) => {
			if (!arg) return { lines: THEMES.map((theme) => `  ${theme}`) };
			if (!THEMES.includes(arg as Theme)) return { lines: [fail('theme', arg, 'No such theme')] };
			return { lines: [], effect: { do: 'theme', theme: arg as Theme } };
		}
	},

	clear: {
		usage: 'clear',
		blurb: 'Empty the screen.',
		run: () => ({ lines: [], effect: { do: 'clear' } })
	}
};

export function run(input: string, cwd: string): Result {
	// ponytail: first argument only. Nothing on this list takes two, and flags would be a parser.
	const [name, arg] = input.trim().split(/\s+/);
	if (!name) return { lines: [], cwd };

	const command = COMMANDS[name];
	if (!command) return { lines: [`${SHELL}: command not found: ${name}`], cwd };

	const out = command.run(arg, cwd);
	return { lines: out.lines, cwd: out.cwd ?? cwd, effect: out.effect };
}

/**
 * Candidates for the word being typed: commands at the first word, filenames after it. Lives here
 * rather than in the component because it reads the same two things `run` does, and a completion
 * that offered a command `run` does not have would be the worse half of that pair going stale.
 */
export function complete(input: string, cwd: string): string[] {
	const words = input.trimStart().split(/\s+/);
	if (words.length <= 1) return Object.keys(COMMANDS).filter((name) => name.startsWith(words[0]));

	const partial = words[words.length - 1];
	const cut = partial.lastIndexOf('/');
	// Everything up to the last slash is a directory to look in; the rest is the stub to match.
	const dir = cut < 0 ? '' : partial.slice(0, cut + 1);
	const stub = partial.slice(cut + 1);

	const target = look(resolve(cwd, dir || '.'));
	if (!target) return [];

	return target.children
		.map(label)
		.filter((name) => name.startsWith(stub))
		.map((name) => dir + name);
}
