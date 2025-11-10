/**
 * Z-Index Normalization Utility
 * 
 * This utility helps fix existing cards that have incorrect z-index values.
 * Run this once to clean up your database and ensure all z-indexes are proper multiples of 10.
 * 
 * Usage:
 * ```typescript
 * import { normalizeAllBoardZIndexes } from '@/lib/utils/normalize-z-indexes';
 * 
 * // In a one-time script or admin page:
 * await normalizeAllBoardZIndexes('your-board-id');
 * ```
 */

import { createClient } from '@/lib/supabase/client';
import { normalizeZIndexes, cardsToZIndexList } from './z-index-manager';

/**
 * Normalize z-indexes for all cards in a specific board
 */
export async function normalizeAllBoardZIndexes(boardId: string) {
	const supabase = createClient();

	// Fetch all cards for this board
	const { data: cards, error: fetchError } = await supabase
		.from('cards')
		.select('id, z_index')
		.eq('board_id', boardId)
		.order('z_index', { ascending: true });

	if (fetchError || !cards) {
		console.error('Error fetching cards:', fetchError);
		throw fetchError;
	}

	console.log(`Found ${cards.length} cards in board ${boardId}`);

	// Calculate normalized z-indexes
	const updates = normalizeZIndexes(cardsToZIndexList(cards));

	if (updates.size === 0) {
		console.log('All z-indexes are already properly normalized!');
		return { updated: 0, total: cards.length };
	}

	console.log(`Updating ${updates.size} cards...`);

	// Apply updates to database
	let updatedCount = 0;
	for (const [cardId, newZIndex] of updates.entries()) {
		const { error: updateError } = await supabase
			.from('cards')
			.update({ z_index: newZIndex })
			.eq('id', cardId);

		if (updateError) {
			console.error(`Error updating card ${cardId}:`, updateError);
		} else {
			updatedCount++;
		}
	}

	console.log(`Successfully updated ${updatedCount} cards`);
	return { updated: updatedCount, total: cards.length };
}

/**
 * Normalize z-indexes for ALL boards (use with caution!)
 */
export async function normalizeAllZIndexes() {
	const supabase = createClient();

	// Get all unique board IDs
	const { data: boards, error: boardsError } = await supabase
		.from('cards')
		.select('board_id')
		.order('board_id');

	if (boardsError || !boards) {
		console.error('Error fetching boards:', boardsError);
		throw boardsError;
	}

	const uniqueBoardIds = [...new Set(boards.map(b => b.board_id))];
	console.log(`Found ${uniqueBoardIds.length} boards`);

	const results = [];
	for (const boardId of uniqueBoardIds) {
		console.log(`\nProcessing board ${boardId}...`);
		const result = await normalizeAllBoardZIndexes(boardId);
		results.push({ boardId, ...result });
	}

	return results;
}

/**
 * Helper function to check if a board needs normalization
 * Returns true if any cards have non-multiple-of-10 z-indexes
 */
export async function checkIfNormalizationNeeded(boardId: string): Promise<boolean> {
	const supabase = createClient();

	const { data: cards, error } = await supabase
		.from('cards')
		.select('z_index')
		.eq('board_id', boardId);

	if (error || !cards) {
		console.error('Error checking board:', error);
		return false;
	}

	return cards.some(card => card.z_index % 10 !== 0);
}

/**
 * One-time fix script for your current board
 * Call this from your browser console or as a one-time admin action
 */
export async function fixMyBoard(boardId: string) {
	console.log('🔧 Starting z-index normalization...');
	
	const needsNormalization = await checkIfNormalizationNeeded(boardId);
	
	if (!needsNormalization) {
		console.log('✅ Board z-indexes are already clean!');
		return;
	}

	console.log('📝 Normalizing z-indexes...');
	const result = await normalizeAllBoardZIndexes(boardId);
	
	console.log(`✅ Done! Updated ${result.updated} out of ${result.total} cards`);
	console.log('🎉 Your board z-indexes are now clean multiples of 10');
	
	return result;
}