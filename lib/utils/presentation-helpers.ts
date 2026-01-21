import type { PresentationNodeCard } from '@/lib/types';

/**
 * Sort presentation nodes by their presentation_order field
 */
export function sortPresentationNodes(nodes: PresentationNodeCard[]): PresentationNodeCard[] {
	return [...nodes].sort((a, b) => a.presentation_order - b.presentation_order);
}

/**
 * Reorder nodes by moving a node from one index to another
 * Returns the new sequence of node IDs
 */
export function reorderNodes(
	nodes: PresentationNodeCard[],
	fromIndex: number,
	toIndex: number
): string[] {
	const sorted = sortPresentationNodes(nodes);
	const [movedNode] = sorted.splice(fromIndex, 1);
	sorted.splice(toIndex, 0, movedNode);
	return sorted.map(node => node.id);
}

/**
 * Update the presentation_order for all nodes based on their position in the array
 */
export async function updateNodesOrder(
	boardId: string,
	nodeIds: string[]
): Promise<void> {
	// This will be implemented when we add the card service methods
	// For now, just a placeholder
	console.log('updateNodesOrder', boardId, nodeIds);
}

/**
 * Get the next available order number for a new presentation node
 */
export function getNextOrderNumber(nodes: PresentationNodeCard[]): number {
	if (nodes.length === 0) return 0;
	const maxOrder = Math.max(...nodes.map(n => n.presentation_order));
	return maxOrder + 1;
}
