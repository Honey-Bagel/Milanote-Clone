'use client';

import { useState } from 'react';
import { db } from '@/lib/instant/db';
import { nanoid } from 'nanoid';

/**
 * Hook for managing board public/private status and share tokens
 */
export function useBoardSharing() {
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Toggle a single board's public status
	 */
	const toggleBoardPublic = async (boardId: string, isPublic: boolean) => {
		setIsUpdating(true);
		setError(null);

		try {
			const updates: any = {
				is_public: isPublic,
				updated_at: Date.now(),
			};

			// If making public, generate a share token
			if (isPublic) {
				updates.share_token = nanoid(16);
			}

			await db.transact([
				db.tx.boards[boardId].update(updates)
			]);

			return {
				success: true,
				shareToken: updates.share_token || null,
			};
		} catch (err) {
			console.error('Error toggling board public status:', err);
			setError('Failed to update board visibility');
			return {
				success: false,
				error: 'Failed to update board visibility',
			};
		} finally {
			setIsUpdating(false);
		}
	};

	/**
	 * Toggle board and all child boards recursively
	 */
	const toggleBoardPublicRecursive = async (boardId: string, isPublic: boolean) => {
		setIsUpdating(true);
		setError(null);

		try {
			// Fetch board and all children
			const { data } = await db.queryOnce({
				boards: {
					$: {
						where: {
							id: boardId,
						},
					},
					children: {}, // Get all child boards through link
				},
			});

			const board = data?.boards?.[0];
			const childBoards = board?.children || [];

			// Create transactions for this board and all children
			const transactions = [];

			// Update parent board
			const parentUpdates: any = {
				is_public: isPublic,
				updated_at: Date.now(),
			};
			if (isPublic) {
				parentUpdates.share_token = nanoid(16);
			}
			transactions.push(db.tx.boards[boardId].update(parentUpdates));

			// Update all child boards
			for (const child of childBoards) {
				const childUpdates: any = {
					is_public: isPublic,
					updated_at: Date.now(),
				};
				if (isPublic) {
					childUpdates.share_token = nanoid(16);
				}
				transactions.push(db.tx.boards[child.id].update(childUpdates));
			}

			await db.transact(transactions);

			return {
				success: true,
				updatedCount: transactions.length,
			};
		} catch (err) {
			console.error('Error toggling board public status recursively:', err);
			setError('Failed to update board visibility');
			return {
				success: false,
				error: 'Failed to update board visibility',
			};
		} finally {
			setIsUpdating(false);
		}
	};

	/**
	 * Generate a new share token for a board
	 */
	const generateShareToken = async (boardId: string) => {
		setIsUpdating(true);
		setError(null);

		try {
			const newToken = nanoid(16);

			await db.transact([
				db.tx.boards[boardId].update({
					share_token: newToken,
					updated_at: Date.now(),
				})
			]);

			return {
				success: true,
				shareToken: newToken,
			};
		} catch (err) {
			console.error('Error generating share token:', err);
			setError('Failed to regenerate link');
			return {
				success: false,
				error: 'Failed to regenerate link',
			};
		} finally {
			setIsUpdating(false);
		}
	};

	/**
	 * Get board info including share token
	 */
	const getBoardInfo = async (boardId: string) => {
		try {
			const { data } = await db.queryOnce({
				boards: {
					$: {
						where: {
							id: boardId,
						},
					},
				},
			});

			return data?.boards?.[0] || null;
		} catch (err) {
			console.error('Error fetching board info:', err);
			return null;
		}
	};

	return {
		toggleBoardPublic,
		toggleBoardPublicRecursive,
		generateShareToken,
		getBoardInfo,
		isUpdating,
		error,
	};
}