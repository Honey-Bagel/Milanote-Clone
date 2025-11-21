import { createClient } from "@/lib/supabase/client";
import { Card } from "@/lib/types";
import {
	bringToFront as orderKeyBringToFront,
	sendToBack as orderKeySendToBack,
	cardsToOrderKeyList,
	getOrderKeyForNewCard
} from "@/lib/utils/order-key-manager";

/**
 * Client-side version: Fetch all cards for a specific board with their type-specific data
 */
export async function getBoardCards(boardId: string) {
	const supabase = createClient();

	const { data, error } = await supabase
		.from("cards")
		.select(`
			*,
			note_cards(*),
			image_cards(*),
			text_cards(*),
			task_list_cards(
				*,
				tasks(
					id,
					text,
					completed,
					position
				)
			),
			link_cards(*),
			file_cards(*),
			color_palette_cards(*),
			column_cards(
				*,
				column_items(
					card_id,
					position
				)
			),
			board_cards(*),
			line_cards!line_cards_id_fkey(*)
		`)
		.eq("board_id", boardId)
		.order("order_key", { ascending: true });

	if (error) {
		console.error("Error fetching board cards:", error);
		return [];
	}

	return data as Card[];
}

/**
 * Creates a new card with type-specific data
 */
export async function createCard(
	boardId: string,
	cardType: Card["card_type"],
	cardData: {
		position_x: number,
		position_y: number,
		width?: number,
		height?: number,
		order_key: string,
		z_index?: number,
	},
	typeSpecificData: any
) {
	const supabase = createClient();

	// Get current user
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) {
		throw new Error("User not authenticated");
	}

	const { data: card, error: cardError } = await supabase
		.from("cards")
		.insert({
			board_id: boardId,
			card_type: cardType,
			position_x: cardData.position_x,
			position_y: cardData.position_y,
			width: cardData.width || 250,
			height: cardData.height,
			order_key: cardData.order_key,
			z_index: cardData.z_index || 0,
			created_by: user.id
		})
		.select()
		.single()

	if (cardError || !card) {
		console.error("Error creating card:", cardError);
		throw cardError;
	}

	// Create type-specific entry
	const tableName = `${cardType}_cards`;
	const { error: typeError } = await supabase
		.from(tableName as any)
		.insert({
			id: card.id,
			...typeSpecificData
		});

	if (typeError) {
		// Rollback by deleting the card
		await supabase.from("cards").delete().eq("id", card.id);
		console.error(`Error creating ${cardType} card data:`, typeError);
		throw typeError;
	}

	return card.id;
}

/**
 * Update card position and dimensions
 */
export async function updateCardTransform(
	cardId: string,
	transform: {
		position_x?: number;
		position_y?: number;
		width?: number;
		height?: number;
		order_key?: string,
		z_index?: number;
	}
) {
	const supabase = createClient();

	const { error } = await supabase
		.from("cards")
		.update(transform)
		.eq("id", cardId);

	if (error) {
		console.error("Error updating card transform:", error);
		throw error;
	}
}

/**
 * Update type-specific card content
*/
export async function updateCardContent(
	cardId: string,
	cardType: Card["card_type"],
	content: any
) {
	const supabase = createClient();

	const tableName = `${cardType}_cards`;
	const { error } = await supabase
		.from(tableName as any)
		.update(content)
		.eq("id", cardId);
	
	if (error) {
		console.error(`Error updating ${cardType} card content:`, error);
		throw error;
	}
}

/**
 * Delete a card (cascades to type-specific data)
 */
export async function deleteCard(cardId: string) {
	const supabase = createClient();

	const { error } = await supabase.from("cards").delete().eq("id", cardId);

	if (error) {
		console.error("Error deleting card:", error);
		throw error;
	}
}

/**
 * Duplicate a card
 */
export async function duplicateCard(cardId: string, offsetX = 20, offsetY = 20) {
	const supabase = createClient();

	// Get original card with all type data
	const { data: cards } = await supabase
		.from("cards")
		.select(`
			*,
			note_cards(*),
			image_cards(*),
			t	ext_cards(*),
			task_list_cards(*),
			link_cards(*),
			file_cards(*),
			color_palette_cards(*),
			column_cards(*)
		`)
		.eq("id", cardId)
		.single();

	if (!cards) {
		throw new Error("Card not found");
	}

	const card = cards as Card;

	// Extract type specific data
	let typeData: any = {};
	const typeKey = `${card.card_type}_cards` as keyof Card;
	if (typeKey in card) {
		typeData = card[typeKey];
		if (typeData && typeof typeData === "object") {
			// Remove id if present
			const { id, ...rest } = typeData as any;
			typeData = rest;
		}
	}

	const { data: allBoardCards } = await supabase
		.from("cards")
		.select("id, order_key")
		.eq("board_id", card.board_id);

	const newOrderKey = getOrderKeyForNewCard(
		cardsToOrderKeyList(allBoardCards || [])
	);

	// Create duplicate
	return createCard(
		card.board_id,
		card.card_type,
		{
			position_x: card.position_x + offsetX,
			position_y: card.position_y + offsetY,
			width: card.width,
			height: card.height || undefined,
			order_key: newOrderKey,
			z_index: card.z_index + 10,
		},
		typeData
	);
}

/**
 * Bring card to front using z-index manager
 */
export async function bringCardToFront(boardId: string, cardId: string) {
	const supabase = createClient();

	// Get all cards in the board
	const { data: allCards, error: fetchError } = await supabase
		.from('cards')
		.select('id, order_key')
		.eq('board_id', boardId);

	if (fetchError || !allCards) {
		console.error('Error fetching cards for z-index update:', fetchError);
	}

	// Use order-key manager to calculate updates
	const updates = orderKeyBringToFront(
		[cardId],
		cardsToOrderKeyList(allCards)
	);

	// Apply all updates to the database
	for (const [id, orderKey] of updates.entries()) {
		await updateCardTransform(id, {
			order_key: orderKey,
			z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
		});
	}
}

/**
 * Send card to back using order-key manager
 */
export async function sendCardToBack(boardId: string, cardId: string) {
	const supabase = createClient();

	// Get all cards in the board
	const { data: allCards, error: fetchError } = await supabase
		.from('cards')
		.select('id, z_index')
		.eq('board_id', boardId);

	if (fetchError || !allCards) {
		console.error('Error fetching cards for z-index update:', fetchError);
	}

	const updates = orderKeySendToBack(
		[cardId],
		cardsToOrderKeyList(allCards)
	);

	for (const [id, orderKey] of updates.entries()) {
		await updateCardTransform(id, { 
			order_key: orderKey,
			z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
		 });
	}
}

export async function getNewCardOrderKeyForBoard(boardId: string): Promise<string> {
	const supabase = createClient();

	const { data: allCards } = await supabase
		.from('cards')
		.select('id, order_key')
		.eq('board_id', boardId);

	return getOrderKeyForNewCard(cardsToOrderKeyList(allCards || []));
}

/**
 * Add a card to a column card's column_items array
 */
export async function addCardToColumn(
	columnId: string,
	cardId: string,
	position: number
): Promise<void> {
	const supabase = createClient();
	
	// First, get the current column card data
	const { data: columnCard, error: fetchError } = await supabase
		.from('column_cards')
		.select('column_items')
		.eq('id', columnId)
		.single();
	
	if (fetchError) {
		throw new Error(`Failed to fetch column card: ${fetchError.message}`);
	}
	
	// Prepare updated column_items array
	const currentItems = columnCard?.column_items || [];
	const updatedItems = [
		...currentItems,
		{ card_id: cardId, position }
	];
	
	// Update the column card
	const { error: updateError } = await supabase
		.from('column_cards')
		.update({ column_items: updatedItems })
		.eq('id', columnId);
	
	if (updateError) {
		throw new Error(`Failed to update column card: ${updateError.message}`);
	}
}

/**
 * Remove a card from a column card's column_items array
 */
export async function removeCardFromColumn(
	columnId: string,
	cardId: string
): Promise<void> {
	const supabase = createClient();
	
	// Get current column card data
	const { data: columnCard, error: fetchError } = await supabase
		.from('column_cards')
		.select('column_items')
		.eq('id', columnId)
		.single();
	
	if (fetchError) {
		throw new Error(`Failed to fetch column card: ${fetchError.message}`);
	}
	
	// Filter out the card and reindex positions
	const currentItems = columnCard?.column_items || [];
	const updatedItems = currentItems
		.filter(item => item.card_id !== cardId)
		.map((item, index) => ({ ...item, position: index }));
	
	// Update the column card
	const { error: updateError } = await supabase
		.from('column_cards')
		.update({ column_items: updatedItems })
		.eq('id', columnId);
	
	if (updateError) {
		throw new Error(`Failed to update column card: ${updateError.message}`);
	}
}

/**
 * Reorder cards within column
 */
export async function reorderColumnCards(
	columnId: string,
	cardPositions: Array<{ card_id: string, position: number }>
) {
	const supabase = createClient();

	// Update each card's position
	for (const { card_id, position } of cardPositions) {
		const { error } = await supabase
			.from("column_items")
			.update({ position })
			.eq("column_id", columnId)
			.eq("card_id", card_id);
		
		if (error) {
			console.error("Error reording column cards:", error);
			throw error;
		}
	}
}

/**
 * Create/update/delete tasks in a task list
 */
export async function updateTaskListTasks(
	taskListId: string,
	tasks: Array<{
		id?: string;
		text: string;
		completed: boolean;
		position: number;
	}>
) {
	const supabase = createClient();

	// Delete tasks not in new list
	const taskIds = tasks.filter((t) => t.id).map((t) => t.id);
	if (taskIds.length > 0) {
		await supabase
			.from("tasks")
			.delete()
			.eq("task_list_id", taskListId)
			.not("id", "in", `(${taskIds.join(",")})`);
	} else {
		// Delete all tasks if no IDs provided
		await supabase.from("tasks").delete().eq("task_list_id", taskListId);
	}

	// Upsert tasks
	for (const task of tasks) {
		if (task.id) {
			// Update existing
			await supabase
				.from("tasks")
				.update({
					text: task.text,
					completed: task.completed,
					position: task.position
				})
				.eq("id", task.id);
		} else {
			// Create new
			await supabase.from("tasks").insert({
				task_list_id: taskListId,
				text: task.text,
				completed: task.completed,
				position: task.position,
			});
		}
	}
}