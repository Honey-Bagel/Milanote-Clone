/**
 * Query builders for InstantDB
 *
 * These functions return query objects (not execute them).
 * Use with db.useQuery() or db.queryOnce()
 */

/**
 * Query builder for fetching a board with its cards and collaborators
 *
 * @example
 * const { data } = db.useQuery(boardWithCardsQuery('board-123'));
 * const board = data?.boards?.[0];
 */
export function boardWithCardsQuery(boardId: string) {
  return {
    boards: {
      $: { where: { id: boardId } },
      cards: {
        $: { order: { order_key: 'asc' } },
      },
      owner: {},
      collaborators: {
        user: {},
      },
    },
  };
}

/**
 * Query builder for fetching cards by type
 *
 * @example
 * const { data } = db.useQuery(cardsByTypeQuery('board-123', 'note'));
 */
export function cardsByTypeQuery(boardId: string, cardType: string) {
  return {
    boards: {
      $: { where: { id: boardId } },
      cards: {
        $: {
          where: { card_type: cardType },
          order: { order_key: 'asc' },
        },
      },
    },
  };
}

/**
 * Query builder for user's owned boards
 *
 * @example
 * const { data } = db.useQuery(userBoardsQuery(userId, { limit: 10 }));
 */
export function userBoardsQuery(userId: string, options?: { limit?: number }) {
  return {
    $users: {
      $: { where: { id: userId } },
      owned_boards: {
        $: {
          order: { updated_at: 'desc' },
          ...(options?.limit && { limit: options.limit }),
        },
      },
    },
  };
}

/**
 * Query builder for a single board by ID
 *
 * @example
 * const { data } = db.useQuery(boardQuery('board-123'));
 */
export function boardQuery(boardId: string) {
  return {
    boards: {
      $: { where: { id: boardId } },
      owner: {},
    },
  };
}

/**
 * Query builder for a board by share token (public boards)
 *
 * @example
 * const { data } = db.useQuery(boardByShareTokenQuery('abc123'));
 */
export function boardByShareTokenQuery(shareToken: string) {
  return {
    boards: {
      $: {
        where: {
          share_token: shareToken,
          is_public: true,
        },
        limit: 1,
      },
      owner: {},
      cards: {
        $: { order: { order_key: 'asc' } },
      },
    },
  };
}

/**
 * Query builder for board collaborators
 *
 * @example
 * const { data } = db.useQuery(boardCollaboratorsQuery('board-123'));
 */
export function boardCollaboratorsQuery(boardId: string) {
  return {
    boards: {
      $: { where: { id: boardId } },
      collaborators: {
        user: {
          profile: {},
        },
      },
    },
  };
}

/**
 * Query builder for user profile
 *
 * @example
 * const { data } = db.useQuery(userProfileQuery(userId));
 */
export function userProfileQuery(userId: string) {
  return {
    $users: {
      $: { where: { id: userId } },
      profile: {},
    },
  };
}

/**
 * Query user's notifcations
 */
export function userNotificationsQuery(
	userId: string,
	options?: { limit?: number; unreadOnly?: boolean }
) {
	return {
		notifications: {
			$: {
				where: {
					recipient_id: userId,
					...(options?.unreadOnly && { is_read: false })
				},
				order: { updated_at: 'desc' },
				limit: options?.limit || 20,
			},
			board: {},
		},
	};
}

/**
 * Query unread notification count
 */
export function unreadNotificationsCountQuery(userId: string) {
	return {
		notifications: {
			$: {
				where: {
					recipeint_id: userId,
					is_read: false,
				},
			},
		},
	};
}