import { describe, expect, test } from 'bun:test';
import { THEMES } from './appearance.svelte';
import { about } from './content/about';
import { OWNER } from './os';
import { complete, HOME, run } from './terminal';
import { node, root } from './tree';

/**
 * The command layer is pure, so every command is an assertion about its output and nothing has to
 * be mounted to make one. The two halves worth the most here are path resolution, which is the
 * only arithmetic in the module, and the error voice, which is the thing a visitor sees when they
 * mistype and the one place the shell can stop sounding like the rest of the site.
 */

/** Most commands do not move the shell, and saying so in every test would drown the ones that do. */
function lines(input: string, cwd = HOME): string[] {
	return run(input, cwd).lines;
}

describe('paths resolve', () => {
	test('a bare name is relative', () => {
		expect(run('cd projects', HOME).cwd).toBe('/projects');
		expect(run('cd case-studies', '/projects').cwd).toBe('/projects/case-studies');
	});

	test('a leading slash is not', () => {
		expect(run('cd /attainments', '/projects/case-studies').cwd).toBe('/attainments');
	});

	test('.. climbs, and stops at the root', () => {
		expect(run('cd ..', '/projects/case-studies').cwd).toBe('/projects');
		expect(run('cd ../attainments', '/projects').cwd).toBe('/attainments');
		expect(run('cd ..', HOME).cwd).toBe(HOME);
	});

	test('~ and a bare cd both go home', () => {
		expect(run('cd ~', '/projects').cwd).toBe(HOME);
		expect(run('cd', '/projects').cwd).toBe(HOME);
	});

	test('a trailing slash and a . change nothing', () => {
		expect(run('cd projects/', HOME).cwd).toBe('/projects');
		expect(run('cd .', '/projects').cwd).toBe('/projects');
	});

	test('a failed cd leaves the shell where it was', () => {
		expect(run('cd nowhere', '/projects').cwd).toBe('/projects');
		expect(run('cd about', HOME).cwd).toBe(HOME);
	});
});

describe('ls', () => {
	test('the root is the desktop, folders marked', () => {
		expect(lines('ls')).toEqual(root.map((id) => (node(id)!.kind === 'folder' ? `${id}/` : id)));
	});

	test('a path is listed without moving there', () => {
		const listed = run('ls projects', HOME);
		expect(listed.cwd).toBe(HOME);
		expect(listed.lines).toContain('case-studies/');
		expect(listed.lines).toContain('busso');
	});

	test('a document lists itself', () => {
		expect(lines('ls about')).toEqual(['about']);
	});

	test('a missing path is the 404 voice', () => {
		expect(lines('ls nowhere')).toEqual(['mnemos: ls: nowhere: No such file or directory']);
	});
});

describe('cat', () => {
	test('a document prints its prose, one blank line between paragraphs', () => {
		expect(lines('cat about')).toEqual(
			about.description.flatMap((part, i) => (i === 0 ? [part] : ['', part]))
		);
	});

	test('an experience is a folder that still reads', () => {
		expect(lines('cat eveneer-tech-wizard', '/experience')[0]).toBeString();
		expect(lines('cat eveneer-tech-wizard', '/experience')[0]).not.toStartWith('mnemos:');
	});

	test('an index folder and the root do not', () => {
		expect(lines('cat projects')).toEqual(['mnemos: cat: projects: Is a directory']);
		expect(lines('cat /')).toEqual(['mnemos: cat: /: Is a directory']);
	});

	test('a missing path is the 404 voice', () => {
		expect(lines('cat nowhere')).toEqual(['mnemos: cat: nowhere: No such file or directory']);
	});
});

describe('open', () => {
	test('hands back the node to open and prints nothing', () => {
		const opened = run('open about', HOME);
		expect(opened.lines).toEqual([]);
		expect(opened.effect).toEqual({ do: 'open', id: 'about', kind: 'document' });
	});

	test('a folder opens as a folder', () => {
		expect(run('open /projects', HOME).effect).toEqual({
			do: 'open',
			id: 'projects',
			kind: 'folder'
		});
	});

	test('the desktop is not a window', () => {
		const opened = run('open /', HOME);
		expect(opened.effect).toBeUndefined();
		expect(opened.lines).toEqual(['mnemos: open: /: Is the desktop']);
	});
});

describe('the rest', () => {
	test('whoami leads with the owner the sidebar reports', () => {
		expect(lines('whoami')[0]).toBe(OWNER);
		expect(lines('whoami')[1]).toContain(about.title);
	});

	test('contact lists every social, label and href on one line', () => {
		const listed = lines('contact');
		expect(listed).toHaveLength(about.socials.length);
		for (const social of about.socials)
			expect(listed.some((line) => line.includes(social.href))).toBe(true);
	});

	test('theme with no argument lists all four', () => {
		expect(lines('theme').map((line) => line.trim())).toEqual([...THEMES]);
	});

	test('theme with a name is an effect and no output', () => {
		expect(run('theme phosphor', HOME)).toEqual({
			lines: [],
			cwd: HOME,
			effect: { do: 'theme', theme: 'phosphor' }
		});
	});

	test('an unknown theme does not change one', () => {
		const set = run('theme crimson', HOME);
		expect(set.effect).toBeUndefined();
		expect(set.lines).toEqual(['mnemos: theme: crimson: No such theme']);
	});

	test('clear is an effect, because the log is the component the shell has no access to', () => {
		expect(run('clear', HOME).effect).toEqual({ do: 'clear' });
	});

	test('help names every command, and nothing else claims to be one', () => {
		const listed = lines('help');
		const named = listed.map((line) => line.trim().split(/\s/)[0]);
		expect(named).toContain('help');
		expect(named).toContain('clear');
		// Every command help prints is one that runs.
		for (const name of named)
			expect(lines(name)).not.toEqual([`mnemos: command not found: ${name}`]);
	});

	test('an unknown command is the shell voice, not a crash', () => {
		expect(lines('sudo')).toEqual(['mnemos: command not found: sudo']);
	});

	test('an empty line does nothing at all', () => {
		expect(run('   ', '/projects')).toEqual({ lines: [], cwd: '/projects', effect: undefined });
	});
});

describe('completion', () => {
	test('the first word completes commands', () => {
		expect(complete('c', HOME).sort()).toEqual(['cat', 'cd', 'clear', 'contact']);
		expect(complete('', HOME)).toContain('whoami');
	});

	test('later words complete filenames against the current directory', () => {
		expect(complete('ls ', HOME)).toContain('projects/');
		expect(complete('cd pro', HOME)).toEqual(['projects/']);
		expect(complete('cat bus', '/projects')).toEqual(['busso']);
	});

	test('a slash in the word looks in that directory and keeps the prefix', () => {
		expect(complete('cd projects/ca', HOME)).toEqual([
			'projects/case-studies/',
			'projects/calendar-and-scheduling'
		]);
	});

	test('a directory that does not exist offers nothing', () => {
		expect(complete('ls nowhere/', HOME)).toEqual([]);
	});

	test('every candidate is something the command would then accept', () => {
		for (const candidate of complete('ls ', HOME))
			expect(lines(`ls ${candidate}`)[0]).not.toStartWith('mnemos:');
	});
});
