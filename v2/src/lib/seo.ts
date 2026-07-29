import { about } from './content/about';
import { certifications, degrees } from './content/attainments';
import { companyList } from './content/companies';
import { experiences } from './content/experiences';
import { OS_NAME, SITE_MODIFIED } from './os';
import { byHref, childrenOf, nodes, summary, type Node } from './tree';
import type { Location, PersonName } from './types/common';

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

// --- Identity --------------------------------------------------------------------------------

/**
 * The same handful of real-world things appear on many pages: the author of a project is the
 * subject of `/about` is the publisher of the site. So each gets one `@id` and every page emits a
 * `@graph` whose nodes point at it.
 *
 * 2.7 shipped a standalone object per page instead, which meant thirty pages each asserting an
 * anonymous `Person` who happened to share a name, and a crawler looking at thirty people.
 */
const PERSON_ID = `${SITE_URL}/#person`;
const SITE_ID = `${SITE_URL}/#website`;

function ref(id: string): object {
	return { '@id': id };
}

/**
 * The entity a page is *about*, which is not the page. A project's URL identifies the page; the
 * project itself is the thing the page describes, so it needs its own name in the graph.
 */
function itemId(href: string): string {
	return `${canonical(href)}#item`;
}

function fullName(name: PersonName): string {
	return [name.first, name.middle, name.last].filter(Boolean).join(' ');
}

function address(location: Location): object {
	return {
		'@type': 'PostalAddress',
		addressLocality: location.city,
		...(location.state && { addressRegion: location.state }),
		addressCountry: location.country
	};
}

const companyByName = new Map(companyList.map((company) => [company.name, company]));

/**
 * One node per real-world organization. Brac University is both an employer and the institution
 * behind the degree, and the degree only knows it by name, so the lookup is what keeps both
 * references landing on one `@id` instead of the graph claiming two universities.
 */
function organization(name: string): object {
	const company = companyByName.get(name);
	if (!company)
		return {
			'@type': 'Organization',
			'@id': `${SITE_URL}/#org-${slugify(name)}`,
			name
		};

	return {
		// A university is not an employer that happens to teach, and `alumniOf` expects the
		// narrower type. The collections already record which is which.
		'@type': company.industry === 'Higher Education' ? 'EducationalOrganization' : 'Organization',
		'@id': `${SITE_URL}/#org-${company.slug}`,
		name: company.name,
		...(company.website && { url: `https://${company.website}` }),
		address: address(company.location)
	};
}

function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * A degree and a certification are one thing to a crawler: something an organization recognises
 * you as holding. 2.7 gave them nothing on the grounds that a credential is not a `CreativeWork`,
 * which was right about `CreativeWork` and wrong about there being no correct type.
 */
type CredentialNode = Extract<Node, { type: 'degree' | 'certification' }>;

function credential(node: CredentialNode): object {
	return {
		'@type': 'EducationalOccupationalCredential',
		'@id': itemId(node.href),
		name: node.name,
		description: summary(node),
		url: canonical(node.href),
		credentialCategory: node.type === 'degree' ? 'degree' : 'certificate',
		recognizedBy: organization(node.type === 'degree' ? node.data.institution : node.data.issuer),
		// Awarded when the study or the exam finished, which is the one date the content carries.
		datePublished: node.data.end ?? node.data.start,
		dateModified: node.modified,
		// Degrees do not lapse. Certifications do, and `end` is when.
		...(node.type === 'certification' && node.data.end && { expires: node.data.end })
	};
}

const credentialNodes = [...degrees, ...certifications]
	.map((item) => nodes[item.slug])
	.filter(
		(node): node is CredentialNode => node.type === 'degree' || node.type === 'certification'
	);

const email = about.socials.find((social) => social.label === 'email')?.href.replace('mailto:', '');

const PERSON_LD = {
	'@type': 'Person',
	'@id': PERSON_ID,
	name: PERSON,
	jobTitle: about.title,
	url: canonical('/'),
	mainEntityOfPage: canonical('/about'),
	description: about.description[0],
	email,
	address: address(about.location),
	sameAs: about.socials.filter((social) => social.label !== 'email').map((social) => social.href),
	knowsAbout: about.skills.map((skill) => skill.name),
	/**
	 * Every job, not only the current one. `worksFor` on its own is a present-tense claim, so the
	 * finished ones go through schema.org's role pattern: the `OrganizationRole` carries the dates
	 * and points at the organization, and a role with an `endDate` reads as a job that ended.
	 */
	worksFor: experiences.map((experience) => ({
		'@type': 'OrganizationRole',
		roleName: experience.role,
		startDate: experience.start,
		...(experience.end && { endDate: experience.end }),
		worksFor: organization(experience.company.name)
	})),
	alumniOf: degrees.map((degree) => organization(degree.institution)),
	hasCredential: credentialNodes.map(credential)
};

const SITE_LD = {
	'@type': 'WebSite',
	'@id': SITE_ID,
	url: canonical('/'),
	name: `${PERSON}, ${OS_NAME}`,
	description: summary(nodes[about.slug]),
	inLanguage: 'en-US',
	publisher: ref(PERSON_ID),
	about: ref(PERSON_ID)
};

// --- Per page --------------------------------------------------------------------------------

/**
 * The trail to a node, which needs no data the tree does not already have: an href is a path, and
 * every prefix of it is a node. The tree deliberately has no parent map, because a project is
 * listed under both its experience and under Projects (2.11), but a URL picks one of those.
 */
function breadcrumbs(node: Node): object {
	const trail = [{ name: PERSON, href: '/' }];

	let path = '';
	for (const segment of node.href.split('/').filter(Boolean)) {
		path += `/${segment}`;
		const step = byHref(path);
		// Every segment on this site is a node. Skipping rather than throwing, because a trail
		// with a gap is still a usable trail and a build that fails on one is not.
		if (step) trail.push({ name: step.name, href: step.href });
	}

	return {
		'@type': 'BreadcrumbList',
		'@id': `${canonical(node.href)}#breadcrumb`,
		itemListElement: trail.map((step, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: step.name,
			item: canonical(step.href)
		}))
	};
}

/**
 * What the page is about, beyond the person and the site that every page carries.
 *
 * `dateModified` comes off `node.modified` throughout, which the tree already derives. There is no
 * matching `datePublished` for most of these: the content carries one date, and inventing a
 * publication date from it would be a claim rather than a derivation. The types that genuinely
 * record when they were published say so.
 */
function entity(node: Node): object | undefined {
	switch (node.type) {
		// The Person is the entity here, and it is already in the graph.
		case 'about':
			return undefined;

		/**
		 * A CV is a page about a person, which is exactly what `ProfilePage` is for, and the person
		 * it is about is the one node every page already carries rather than a second copy of him.
		 * There is no `Resume` type in schema.org, and `CreativeWork` would claim the career is a
		 * work I authored.
		 */
		case 'resume':
			return {
				'@type': 'ProfilePage',
				'@id': canonical(node.href),
				url: canonical(node.href),
				name: `${PERSON} ${node.name}`,
				description: summary(node),
				isPartOf: ref(SITE_ID),
				mainEntity: ref(PERSON_ID),
				dateModified: node.modified,
				// The same document as a file. Without `encodingFormat` a crawler is told there is
				// an associated URL and not that following it hands back a PDF.
				associatedMedia: {
					'@type': 'DigitalDocument',
					'@id': canonical(node.data.file),
					url: canonical(node.data.file),
					name: node.data.filename,
					encodingFormat: 'application/pdf',
					author: ref(PERSON_ID)
				}
			};

		case 'index':
			return {
				'@type': 'CollectionPage',
				'@id': canonical(node.href),
				url: canonical(node.href),
				name: node.name,
				description: summary(node),
				isPartOf: ref(SITE_ID),
				about: ref(PERSON_ID),
				dateModified: node.modified,
				mainEntity: {
					'@type': 'ItemList',
					numberOfItems: node.children?.length ?? 0,
					itemListElement: childrenOf(node.id).map((child, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						name: child.name,
						url: canonical(child.href)
					}))
				}
			};

		// The employer. The employment itself is on the Person, as a dated role.
		case 'experience':
			return organization(node.data.company.name);

		case 'project':
			return {
				'@type': 'CreativeWork',
				'@id': itemId(node.href),
				name: node.name,
				description: summary(node),
				url: canonical(node.href),
				author: ref(PERSON_ID),
				dateModified: node.modified,
				...(node.data.company && {
					sourceOrganization: organization(node.data.company.name)
				}),
				// The repository or product itself, which is a different page from ours.
				...(node.data.url && { sameAs: node.data.url })
			};

		case 'publication':
			return {
				'@type': 'ScholarlyArticle',
				'@id': itemId(node.href),
				name: node.name,
				abstract: summary(node),
				url: canonical(node.href),
				sameAs: node.data.url,
				datePublished: node.data.year,
				dateModified: node.modified,
				publisher: organization(node.data.venue),
				// The co-author who is me is the same person as everywhere else on the site, so the
				// author list is where the graph earns its keep.
				author: node.data.authors.map((author) =>
					fullName(author) === PERSON
						? ref(PERSON_ID)
						: { '@type': 'Person', name: fullName(author) }
				)
			};

		case 'degree':
		case 'certification':
			return credential(node);
	}
}

/**
 * The whole `@graph` for a page. Called with no node for the root, which is the person and the
 * site and nothing else.
 */
export function graph(node?: Node): object {
	const entities: object[] = [PERSON_LD, SITE_LD];

	if (node) {
		entities.push(breadcrumbs(node));
		const own = entity(node);
		if (own) entities.push(own);
	}

	return { '@context': 'https://schema.org', '@graph': entities };
}

// --- Site wide -------------------------------------------------------------------------------

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
