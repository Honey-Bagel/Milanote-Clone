/**
 * Template Service - Board template CRUD and instantiation
 *
 * Handles creating templates from boards, querying templates,
 * and instantiating templates into new boards.
 */

import { db, generateId } from '@/lib/db/client';
import type {
	TemplateData,
	TemplateCard,
	NestedBoardTemplate,
	CreateTemplateParams,
	InstantiationContext,
} from '@/lib/types/template';
import { generateNKeysBetween } from 'fractional-indexing';

// ============================================================================
// TEMPLATE INSTANTIATION (User-facing)
// ============================================================================

/**
 * Instantiate a template into a new board for a user
 *
 * @param templateId - ID of the template to instantiate
 * @param ownerId - ID of the user who will own the new board
 * @returns ID of the newly created root board
 */
export async function instantiateTemplate(
	templateId: string,
	ownerId: string
): Promise<string> {
	console.log('[TemplateService] Starting template instantiation:', {
		templateId,
		ownerId,
	});

	// 1. Fetch template
	const template = await fetchTemplateById(templateId);

	if (!template) {
		throw new Error(`Template not found: ${templateId}`);
	}

	// 2. Initialize context
	const rootBoardId = generateId();
	const context: InstantiationContext = {
		templateIdToRealId: new Map(),
		ownerId,
		rootBoardId,
	};

	// 3. Generate all IDs upfront
	generateAllIds(template, context);

	console.log('[TemplateService] Generated IDs for template:', {
		totalIds: context.templateIdToRealId.size,
	});

	// 4. Create board hierarchy
	await createBoardHierarchy(template, context);

	// 5. Create all cards
	await createAllCards(template, context);

	// 6. Increment usage count
	await incrementUsageCount(templateId);

	console.log('[TemplateService] Template instantiation complete:', rootBoardId);

	return rootBoardId;
}

/**
 * Generate all IDs upfront for boards and cards
 */
function generateAllIds(template: TemplateData, context: InstantiationContext): void {
	// Root board already assigned in context

	// Generate IDs for root board cards
	template.cards.forEach((card) => {
		context.templateIdToRealId.set(card.template_id, generateId());
	});

	// Recursively generate IDs for nested boards
	function processNestedBoards(nestedBoards: NestedBoardTemplate[]) {
		nestedBoards.forEach((board) => {
			// Board ID
			context.templateIdToRealId.set(board.template_id, generateId());

			// Card IDs in this board
			board.cards.forEach((card) => {
				context.templateIdToRealId.set(card.template_id, generateId());
			});

			// Recurse deeper
			if (board.nested_boards?.length) {
				processNestedBoards(board.nested_boards);
			}
		});
	}

	processNestedBoards(template.nested_boards);
}

/**
 * Create board hierarchy using BFS
 */
async function createBoardHierarchy(
	template: TemplateData,
	context: InstantiationContext
): Promise<void> {
	const transactions = [];
	const now = Date.now();

	// Create root board
	transactions.push(
		db.tx.boards[context.rootBoardId].update({
			title: template.board.title,
			color: template.board.color,
			parent_board_id: null,
			is_public: false,
			created_at: now,
			updated_at: now,
		}),
		db.tx.$users[context.ownerId].link({ owned_boards: context.rootBoardId })
	);

	// BFS queue for nested boards
	const queue: Array<{
		boardTemplate: NestedBoardTemplate;
		parentBoardId: string;
	}> = template.nested_boards.map((nb) => ({
		boardTemplate: nb,
		parentBoardId: context.rootBoardId,
	}));

	while (queue.length > 0) {
		const { boardTemplate, parentBoardId } = queue.shift()!;
		const boardId = context.templateIdToRealId.get(boardTemplate.template_id)!;

		transactions.push(
			db.tx.boards[boardId].update({
				title: boardTemplate.title,
				color: boardTemplate.color,
				parent_board_id: parentBoardId,
				is_public: false,
				created_at: now,
				updated_at: now,
			}),
			db.tx.$users[context.ownerId].link({ owned_boards: boardId }),
			db.tx.boards[boardId].link({ parent: parentBoardId })
		);

		// Add children to queue
		if (boardTemplate.nested_boards?.length) {
			boardTemplate.nested_boards.forEach((childBoard) => {
				queue.push({
					boardTemplate: childBoard,
					parentBoardId: boardId,
				});
			});
		}
	}

	// Execute in batches of 100
	await executeBatched(transactions, 100);
}

/**
 * Create all cards with ID remapping
 */
async function createAllCards(
	template: TemplateData,
	context: InstantiationContext
): Promise<void> {
	const transactions = [];
	const now = Date.now();

	// Helper to build card transactions
	function buildCardTransactions(cards: TemplateCard[], boardId: string) {
		// Sort by order_index
		const sortedCards = [...cards].sort((a, b) => a.order_index - b.order_index);

		// Generate order_keys
		const orderKeys = generateNKeysBetween(null, null, sortedCards.length);

		sortedCards.forEach((templateCard, index) => {
			const cardId = context.templateIdToRealId.get(templateCard.template_id)!;
			const orderKey = orderKeys[index];

			// Build card data
			const cardData: any = {
				board_id: boardId,
				card_type: templateCard.card_type,
				position_x: templateCard.position_x,
				position_y: templateCard.position_y,
				width: templateCard.width,
				height: templateCard.height,
				order_key: orderKey,
				created_at: now,
				updated_at: now,
			};

			// Copy type-specific fields
			const fieldsToCopy = [
				'note_content',
				'note_color',
				'image_url',
				'image_caption',
				'image_alt_text',
				'task_list_title',
				'tasks',
				'link_title',
				'link_url',
				'link_favicon_url',
				'file_name',
				'file_url',
				'file_size',
				'file_mime_type',
				'palette_title',
				'palette_description',
				'palette_colors',
				'column_title',
				'column_background_color',
				'board_title',
				'board_color',
			];

			fieldsToCopy.forEach((field) => {
				if (templateCard[field as keyof TemplateCard] !== undefined) {
					cardData[field] = templateCard[field as keyof TemplateCard];
				}
			});

			// Remap column items
			if (templateCard.column_items) {
				cardData.column_items = templateCard.column_items.map((item) => ({
					card_id: context.templateIdToRealId.get(item.card_template_id)!,
					position: item.position,
				}));
			}

			// Remap linked board
			if (templateCard.linked_board_template_id) {
				cardData.linked_board_id = context.templateIdToRealId.get(
					templateCard.linked_board_template_id
				)!;
			}

			transactions.push(
				db.tx.cards[cardId].update(cardData),
				db.tx.cards[cardId].link({ board: boardId })
			);
		});
	}

	// Create root board cards
	buildCardTransactions(template.cards, context.rootBoardId);

	// Create nested board cards (BFS)
	const queue = [...template.nested_boards];
	while (queue.length > 0) {
		const boardTemplate = queue.shift()!;
		const boardId = context.templateIdToRealId.get(boardTemplate.template_id)!;

		buildCardTransactions(boardTemplate.cards, boardId);

		if (boardTemplate.nested_boards?.length) {
			queue.push(...boardTemplate.nested_boards);
		}
	}

	// Execute in batches
	await executeBatched(transactions, 100);
}

/**
 * Execute transactions in batches
 */
async function executeBatched(transactions: any[], batchSize: number): Promise<void> {
	for (let i = 0; i < transactions.length; i += batchSize) {
		const batch = transactions.slice(i, i + batchSize);
		await db.transact(batch);
	}
}

// ============================================================================
// TEMPLATE CREATION (Admin)
// ============================================================================

/**
 * Create a template from an existing board
 *
 * @param params - Template creation parameters
 * @returns ID of the created template
 */
export async function createTemplate(params: CreateTemplateParams): Promise<string> {
	console.log('[TemplateService] Creating template from board:', params.sourceBoardId);

	// 1. Fetch root board and cards
	const { data: rootData } = await db.queryOnce({
		boards: {
			$: { where: { id: params.sourceBoardId } },
		},
		cards: {
			$: { where: { board_id: params.sourceBoardId } },
		},
	});

	const rootBoard = rootData.boards?.[0];
	if (!rootBoard) {
		throw new Error('Source board not found');
	}

	const rootCards = rootData.cards || [];

	// 2. Create ID mappings
	const realIdToTemplateId = new Map<string, string>();
	rootCards.forEach((card, i) => {
		realIdToTemplateId.set(card.id, `card_${i}`);
	});

	// 3. Convert root cards
	const templateCards = rootCards
		.sort((a, b) => a.order_key.localeCompare(b.order_key))
		.map((card, index) => convertCardToTemplate(card, index, realIdToTemplateId));

	// 4. Fetch and convert nested boards
	let boardCounter = 0;
	const nestedBoards = await fetchAndConvertNestedBoards(
		params.sourceBoardId,
		realIdToTemplateId,
		boardCounter
	);

	// 5. Build template data
	const templateData: TemplateData = {
		version: '1.0.0',
		board: {
			title: rootBoard.title,
			color: rootBoard.color,
		},
		cards: templateCards,
		nested_boards: nestedBoards,
	};

	// 6. Create template entity
	const templateId = generateId();
	const now = Date.now();

	await db.transact([
		db.tx.templates[templateId].update({
			name: params.name,
			description: params.description || '',
			category: params.category,
			preview_url: params.preview_url || '',
			template_data: templateData,
			is_public: true,
			is_featured: params.is_featured || false,
			usage_count: 0,
			created_at: now,
			updated_at: now,
		}),
		db.tx.templates[templateId].link({ creator: params.creatorId }),
	]);

	console.log('[TemplateService] Template created:', templateId);

	return templateId;
}

/**
 * Convert a card to template format
 */
function convertCardToTemplate(
	card: import('@/lib/types').Card,
	orderIndex: number,
	idMapping: Map<string, string>
): TemplateCard {
	const templateCard: TemplateCard = {
		template_id: idMapping.get(card.id)!,
		card_type: card.card_type,
		position_x: card.position_x || 0,
		position_y: card.position_y || 0,
		width: card.width,
		height: card.height,
		order_index: orderIndex,
	};

	// Copy type-specific fields
	const fieldsToCopy = [
		'note_content',
		'note_color',
		'image_url',
		'image_caption',
		'image_alt_text',
		'task_list_title',
		'tasks',
		'link_title',
		'link_url',
		'link_favicon_url',
		'file_name',
		'file_url',
		'file_size',
		'file_mime_type',
		'palette_title',
		'palette_description',
		'palette_colors',
		'column_title',
		'column_background_color',
		'board_title',
		'board_color',
	];

	fieldsToCopy.forEach((field) => {
		if (card[field] !== undefined && card[field] !== null) {
			(templateCard as any)[field] = card[field];
		}
	});

	// Remap column items
	if (card.card_type === 'column' && (card as import('@/lib/types').ColumnCard).column_items) {
		templateCard.column_items = (card as import('@/lib/types').ColumnCard).column_items.map((item: import('@/lib/types/helpers').ColumnItem) => ({
			card_template_id: idMapping.get(item.card_id)!,
			position: item.position,
		}));
	}

	// Remap linked board
	if (card.linked_board_id) {
		templateCard.linked_board_template_id = idMapping.get(card.linked_board_id)!;
	}

	return templateCard;
}

/**
 * Recursively fetch and convert nested boards
 */
async function fetchAndConvertNestedBoards(
	parentBoardId: string,
	idMapping: Map<string, string>,
	startBoardCounter: number
): Promise<NestedBoardTemplate[]> {
	// Query board cards in parent
	const { data } = await db.queryOnce({
		cards: {
			$: {
				where: {
					board_id: parentBoardId,
					card_type: 'board',
				},
			},
		},
	});

	const boardCards = data.cards || [];
	const nestedBoards: NestedBoardTemplate[] = [];
	let boardCounter = startBoardCounter;

	for (const boardCard of boardCards) {
		const linkedBoardId = boardCard.linked_board_id;
		if (!linkedBoardId) continue;

		// Assign template ID
		const boardTemplateId = `board_${boardCounter++}`;
		idMapping.set(linkedBoardId, boardTemplateId);

		// Fetch nested board and cards
		const { data: nestedData } = await db.queryOnce({
			boards: { $: { where: { id: linkedBoardId } } },
			cards: { $: { where: { board_id: linkedBoardId } } },
		});

		const nestedBoard = nestedData.boards?.[0];
		if (!nestedBoard) continue;

		const nestedCards = nestedData.cards || [];

		// Update ID mapping for cards
		nestedCards.forEach((card, i) => {
			idMapping.set(card.id, `card_${idMapping.size + i}`);
		});

		// Convert cards
		const templateCards = nestedCards
			.sort((a, b) => a.order_key.localeCompare(b.order_key))
			.map((card, index) => convertCardToTemplate(card, index, idMapping));

		// Recurse deeper
		const deeperNesting = await fetchAndConvertNestedBoards(
			linkedBoardId,
			idMapping,
			boardCounter
		);

		nestedBoards.push({
			template_id: boardTemplateId,
			title: nestedBoard.title,
			color: nestedBoard.color,
			cards: templateCards,
			nested_boards: deeperNesting.length > 0 ? deeperNesting : undefined,
		});
	}

	return nestedBoards;
}

// ============================================================================
// TEMPLATE QUERIES
// ============================================================================

/**
 * Fetch a template by ID (returns template_data)
 */
export async function fetchTemplateById(templateId: string): Promise<TemplateData | null> {
	const { data } = await db.queryOnce({
		templates: {
			$: { where: { id: templateId } },
		},
	});

	const template = data.templates?.[0];
	return template ? template.template_data : null;
}

/**
 * Increment template usage count
 */
async function incrementUsageCount(templateId: string): Promise<void> {
	// Fetch current count
	const { data } = await db.queryOnce({
		templates: {
			$: { where: { id: templateId } },
		},
	});

	const template = data.templates?.[0];
	if (!template) return;

	const newCount = (template.usage_count || 0) + 1;

	await db.transact([
		db.tx.templates[templateId].update({
			usage_count: newCount,
			updated_at: Date.now(),
		}),
	]);
}

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Update template metadata
 */
export async function updateTemplate(
	templateId: string,
	updates: Partial<{
		name: string;
		description: string;
		category: string;
		preview_url: string;
		is_featured: boolean;
	}>
): Promise<void> {
	await db.transact([
		db.tx.templates[templateId].update({
			...updates,
			updated_at: Date.now(),
		}),
	]);
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
	await db.transact([db.tx.templates[templateId].delete()]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TemplateService = {
	// User-facing
	instantiateTemplate,

	// Admin
	createTemplate,
	updateTemplate,
	deleteTemplate,
	fetchTemplateById,
};
