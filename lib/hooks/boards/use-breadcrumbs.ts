'use client';

import { db } from "@/lib/instant/db";
import { useMemo, useReducer, useEffect } from "react";

export type BreadcrumbItem = {
	id: string;
	title: string;
	color?: string;
	shareToken?: string | null;
};

type Board = {
	id: string;
	title: string;
	color: string;
	parent_board_id?: string | null;
	is_public?: boolean;
	share_token?: string | null;
};

type State = {
	boardIds: string[];
	isComplete: boolean;
};

type Action =
	| { type: 'ADD_PARENTS'; parentIds: string[] }
	| { type: 'MARK_COMPLETE' }
	| { type: 'RESET'; boardId: string };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'ADD_PARENTS':
			if (action.parentIds.length === 0) {
				return state;
			}
			return {
				...state,
				boardIds: [...state.boardIds, ...action.parentIds]
			};
		case 'MARK_COMPLETE':
			return {
				...state,
				isComplete: true
			};
		case 'RESET':
			return {
				boardIds: [action.boardId],
				isComplete: false
			};
		default:
			return state;
	}
}

/**
 * Hook to fetch breadcrumbs for a board using InstantDB
 * Iteratively traverses parent relationships to build the breadcrumb path
 * Supports unlimited nesting depth by progressively fetching parent boards
 *
 * @param boardId - The ID of the current board
 * @param isPublicView - Whether viewing a public board (affects link generation)
 * @returns Breadcrumbs array from root to current board
 */
export function useBreadcrumbs(boardId: string, isPublicView: boolean = false) {
	const [state, dispatch] = useReducer(reducer, {
		boardIds: [boardId],
		isComplete: false
	});

	// Reset state when boardId changes
	useEffect(() => {
		dispatch({ type: 'RESET', boardId });
	}, [boardId]);

	// Query all boards we've discovered so far
	const { data, isLoading } = db.useQuery(
		state.boardIds.length > 0 ? {
			boards: {
				$: {
					where: {
						id: { in: state.boardIds }
					}
				}
			}
		} : null
	);

	// Discover new parent boards that need to be fetched
	const newParentIds = useMemo(() => {
		if (!data?.boards || state.isComplete) return [];

		const currentIds = new Set(state.boardIds);
		const parentIds: string[] = [];

		for (const board of data.boards) {
			if (board.parent_board_id && !currentIds.has(board.parent_board_id)) {
				parentIds.push(board.parent_board_id);
			}
		}

		return parentIds;
	}, [data, state.boardIds, state.isComplete]);

	// Trigger fetching of newly discovered parents
	useEffect(() => {
		if (newParentIds.length > 0) {
			dispatch({ type: 'ADD_PARENTS', parentIds: newParentIds });
		} else if (data?.boards && !state.isComplete) {
			dispatch({ type: 'MARK_COMPLETE' });
		}
	}, [newParentIds, data, state.isComplete]);

	// Build breadcrumb array by walking up from current board to root
	const breadcrumbs = useMemo(() => {
		if (!data?.boards || !state.isComplete) return [];

		// Build a map for quick lookup
		const boardMap = new Map<string, Board>(
			data.boards.map(board => [board.id, board])
		);

		const items: BreadcrumbItem[] = [];
		let currentBoardId: string | null = boardId;
		const visited = new Set<string>();
		let depth = 0;
		const maxDepth = 100; // Safety limit for infinite loop protection

		// Walk up the parent chain
		while (currentBoardId && !visited.has(currentBoardId) && depth < maxDepth) {
			visited.add(currentBoardId);
			const board = boardMap.get(currentBoardId);

			if (!board) break;

			items.unshift({
				id: board.id,
				title: board.title,
				color: board.color,
				shareToken: isPublicView && board.is_public
					? board.share_token
					: null,
			});

			currentBoardId = board.parent_board_id || null;
			depth++;
		}

		return items;
	}, [data, state.isComplete, boardId, isPublicView]);

	return {
		breadcrumbs,
		isLoading: isLoading || !state.isComplete,
		isError: false,
	};
}
