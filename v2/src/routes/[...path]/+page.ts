import { byHref, nodes } from '$lib/tree';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * One catch-all instead of thirteen route files. Every content path is a node in the tree and
 * every node knows its own href, so the route table is the tree and there is nowhere for the two
 * to disagree.
 */
export const entries = () => Object.values(nodes).map((node) => ({ path: node.href.slice(1) }));

export const load: PageLoad = ({ params }) => {
	const node = byHref(`/${params.path}`);
	if (!node) error(404, 'Not found');

	// The id, not the node. The tree is a module the client already has, so shipping the whole
	// record in the prerendered payload would send every project's copy twice.
	return { id: node.id };
};
