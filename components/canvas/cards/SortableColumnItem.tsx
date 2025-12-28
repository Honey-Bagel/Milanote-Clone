'use client';

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CanvasElement } from "../CanvasElement";
import type { Card, CardData } from "@/lib/types";
import type { Editor } from "@tiptap/react";

interface SortableColumnItemProps {
	card: Card;
	columnId: string;
	index: number;
	boardId?: string | null;
	allCards: Map<string, Card | CardData>;
	onCardClick?: (cardId: string, isMultiSelect: boolean) => void;
	onCardDoubleClick?: (cardId: string) => void;
	onContextMenu?: (e: React.MouseEvent, card: Card) => void;
	onEditorReady?: (cardId: string, editor: Editor) => void;
};

export function SortableColumnItem({
	card,
	columnId,
	index,
	boardId,
	allCards,
	onCardClick,
	onCardDoubleClick,
	onContextMenu,
	onEditorReady,
}: SortableColumnItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: card.id,
		data: {
			type: 'column-card',
			columnId: columnId,
			card: card,
			index: index,
			sortableContext: 'column',
			parentColumnId: columnId,
		},
		disabled: card.is_position_locked,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.3 : 1,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<div {...attributes} {...listeners}>
				<CanvasElement
					card={card}
					boardId={boardId}
					allCards={allCards}
					onCardClick={onCardClick}
					onCardDoubleClick={onCardDoubleClick}
					onContextMenu={onContextMenu}
					onEditorReady={onEditorReady}
					isInsideColumn={true}
				/>
			</div>
		</div>
	);
}