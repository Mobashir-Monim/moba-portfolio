import { about } from './content/about';
import { experiences } from './content/experiences';
import { SITE_MODIFIED } from './os';
import { nodes, summary, type Node } from './tree';

/**
 * Everything a crawler and a link preview need, derived from the tree rather than declared beside
 * it. Ledger #13 and #16: the old site had no Open Graph, no canonical, no sitemap, and no
 * structured data, so a shared link rendered bare and nothing but the home page was indexed.
 *
 * `Head.svelte` is the only consumer of the per-page half; `sitemap.xml` is the only consumer of
 * the other.
 */

/**
 * The origin every absolute URL is built from. One constant, because a canonical tag, an
 * `og:url`, and a sitemap entry that disagree about the host are three different pages to Google.
 *
 * ponytail: hardcoded, not read from the request. The site prerenders, so there is no request at
 * build time, and a relative canonical is not a canonical. Moving to mobashirmonim.com is this
 * line and nothing else.
 */
export const SITE_URL = 'https://moba-portfolio.m-monim.workers.dev';

export const PERSON = `${about.person.first} ${about.person.last}`;

export function canonical(path: string): string {
	return new URL(path, SITE_URL).href;
}

/**
 * JSON for a `<script>` body. `</script>` inside a string literal closes the tag no matter that
 * it is quoted, so every `<` goes out as an escape; JSON parsers read `<` and `<` alike.
 * The content here is all ours, but an escape that only holds while nobody writes an angle
 * bracket is not an escape.
 */
export function ldJson(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}

const email = about.socials.find((social) => social.label === 'email')?.href.replace('mailto:', '');

/** Current job, if any. `sameAs` and `worksFor` are what tie the profile links to the person. */
const current = experiences.find((experience) => !experience.end);

const PERSON_LD = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: PERSON,
	jobTitle: about.title,
	url: canonical('/'),
	description: about.description[0],
	email,
	address: {
		'@type': 'PostalAddress',
		addressLocality: about.location.city,
		addressCountry: about.location.country
	},
	sameAs: about.socials.filter((social) => social.label !== 'email').map((social) => social.href),
	knowsAbout: about.skills.map((skill) => skill.name),
	...(current && { worksFor: { '@type': 'Organization', name: current.company.name } })
};

/**
 * The structured data for a node, or nothing. A degree and a certification are credentials rather
 * than works, and `index` folders are furniture; claiming a `CreativeWork` for either would be
 * describing a page that does not exist as a thing.
 */
export function jsonLd(node: Node): object | undefined {
	switch (node.type) {
		case 'about':
			return PERSON_LD;

		case 'project':
			return {
				'@context': 'https://schema.org',
				'@type': 'CreativeWork',
				name: node.name,
				description: summary(node),
				url: canonical(node.href),
				author: { '@type': 'Person', name: PERSON },
				...(node.data.company && {
					sourceOrganization: { '@type': 'Organization', name: node.data.company.name }
				}),
				// The repository or product itself, which is a different page from ours.
				...(node.data.url && { sameAs: node.data.url })
			};

		case 'publication':
			return {
				'@context': 'https://schema.org',
				'@type': 'ScholarlyArticle',
				name: node.name,
				abstract: summary(node),
				url: canonical(node.href),
				sameAs: node.data.url,
				datePublished: node.data.year,
				publisher: { '@type': 'Organization', name: node.data.venue },
				author: node.data.authors.map((author) => ({
					'@type': 'Person',
					name: [author.first, author.middle, author.last].filter(Boolean).join(' ')
				}))
			};

		default:
			return undefined;
	}
}

/**
 * Crawl everything. There is nothing here that is not meant to be read, and that includes the
 * AI crawlers: a portfolio wants to be quoted by whatever is doing the answering.
 *
 * The `Sitemap:` line has no relative form, which is the whole reason this is generated rather
 * than a file in `static/`: it is the second place the origin would otherwise be written down.
 */
export function robots(): string {
	return `User-agent: *\nDisallow:\n\nSitemap: ${canonical('/sitemap.xml')}\n`;
}

/**
 * Every prerendered page, which is the root plus one per node: the tree is the route table
 * (2.6), so it is also the sitemap and the two cannot fall out of step.
 *
 * ponytail: no XML escaping. Every href is built from a kebab-case slug and the test holds that
 * line, so there is nothing here for `&` to break.
 */
export function sitemap(): string {
	const entries: [string, string][] = [
		['/', SITE_MODIFIED],
		...Object.values(nodes).map((node): [string, string] => [node.href, node.modified])
	];

	// `YYYY-MM` is a legal W3C Datetime, which is what the sitemap schema asks for, so the month
	// the content carries goes out as the month rather than being padded to a day it never had.
	const urls = entries
		.map(
			([href, modified]) =>
				`\t<url>\n\t\t<loc>${canonical(href)}</loc>\n\t\t<lastmod>${modified}</lastmod>\n\t</url>`
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
