import { db, type Schema } from "./db";
import { id } from "@instantdb/react";
import { Card, CardData } from "../types";

type CardType = Card["card_type"];

const getCardTypeEntity = (cardType: CardType) => {
	const entityMap = {
		note: 'note_cards',
		image: 'image_cards',
		text: 'text_cards',
		task_list: 'task_list_cards',
		link: 'link_cards',
		file: 'file_cards',
		color_palette: 'color_palette_cards',
		column: 'column_cards',
		board: 'board_cards',
		line: 'line_cards',
	} as const;

	return entityMap[cardType];
};

export const boardMutations = {
	/**
	 * Create a new card with its type-specific data
	 */
	createCard: (cardData: Partial<CardData>) => {
		const cardId = id();
		const now = Date.now();

		if (!cardData.board_id) {
			throw Error("Card Data requires board id");
		}

		return db.transact([
			db.tx.cards[cardId].update({
				...cardData,
				created_at: now,
				updated_at: now,
			}),
			db.tx.boards[cardData?.board_id].update({
				updated_at: now
			}),
		]);
	},

	updateCard: (cardId: string, boardId: string, updates: Partial<CardData>) => {
		return db.transact([
			db.tx.cards[cardId].update({
				...updates,
				updated_at: Date.now(),
			}),
			db.tx.boards[boardId].update({
				updated_at: Date.now()
			}),
		]);
	},

	deleteCard: (cardId: string, boardId: string) => {
		return db.transact([
			db.tx.cards[cardId].delete(),
			db.tx.boards[boardId].update({
				updated_at: Date.now()
			}),
		]);
	},

	moveCard: (cardId: string, boardId: string, position: { x: number, y: number }) => {
		return db.transact([
			db.tx.cards[cardId].update({
				position_x: position.x,
				position_y: position.y,
				updated_at: Date.now(),
			}),
			db.tx.boards[boardId].update({
				updated_at: Date.now()
			}),
		]);
	},

	resizeCard: (cardId: string, boardId: string, width: number, height?: number) => {
		return db.transact([
			db.tx.cards[cardId].update({
				width: width,
				...(height !== undefined && { height }),
				updated_at: Date.now(),
			}),
			db.tx.boards[boardId].update({
				updated_at: Date.now(),
			})
		]);
	},
};