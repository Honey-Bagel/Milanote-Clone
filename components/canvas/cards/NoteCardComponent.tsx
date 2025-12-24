"use client";

import { NoteCard } from "@/lib/types";
import { useCardContext, useOptionalCardContext } from "./CardContext";

// TipTap
import { useEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { TextSelection } from "prosemirror-state";

interface NoteCardOptions {
	lastDoubleClick: {
		clientX: number;
		clientY: number
	}
}

interface NoteCardComponentProps {
	onEditorReady?: (editor: TipTapEditor) => void;
	options: NoteCardOptions
};

export function NoteCardComponent({
	onEditorReady,
	options
}: NoteCardComponentProps) {
	const context = useCardContext();

	// Use context values if available
	const card = (context?.card as NoteCard);
	const isEditing = context.isEditing;
	const { saveContent, stopEditing, dimensions, isReadOnly, reportContentHeight } = context ?? {
		saveContent: () => {},
		stopEditing: () => {},
		dimensions: null,
		isReadOnly: false,
	};

	const rootRef = useRef<HTMLDivElement | null>(null);

	// Keep CardDimensions in sync with actual rendered height
	// Use scrollHeight instead of contentRect.height to measure actual content
	// regardless of CSS height constraints (fixes circular dependency when height: '100%')
	useLayoutEffect(() => {
		if (!reportContentHeight || !rootRef.current) return;

		const el = rootRef.current;
		const observer = new ResizeObserver(() => {
			// Use scrollHeight to get actual content height, not constrained height
			reportContentHeight(el.scrollHeight);
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, [reportContentHeight]);

	// TipTap editor setup
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
				bulletList: {
					keepMarks: true,
					keepAttributes: false,
				},
				orderedList: {
					keepMarks: true,
					keepAttributes: false,
				},
				listItem: {
					HTMLAttributes: {
						class: 'tiptap-list-item',
					},
				},
				trailingNode: false,
			}),
			Underline,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Highlight.configure({
				multicolor: true,
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-blue-600 underline cursor-pointer',
				},
			}),
			Placeholder.configure({
				placeholder: 'Type something...',
				showOnlyWhenEditable: false,
				showOnlyCurrent: false,
			}),
		],
		content: card.note_content || '',
		editorProps: {
			attributes: {
				class: 'prose prose-sm max-w-none focus:outline-none p-4 min-h-[60px] text-slate-300 text-sm leading-relaxed'
			},
		},
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();

			saveContent({ note_content: html });
		},
		onCreate: ({ editor }) => {
			onEditorReady?.(editor);
		},
		editable: isEditing && !isReadOnly,
		immediatelyRender: false,
	});

	
	// Update editor content when card content changes externally
	useEffect(() => {
		if (editor && card.note_content !== editor.getHTML()) {
			editor.commands.setContent(card.note_content || '');
		}
	}, [card.note_content, editor]);

	useEffect(() => {
		if (!editor) return;

		if (isEditing) {
			editor.setEditable(isEditing && !isReadOnly);

			if (options?.lastDoubleClick) {
				placeCursorAtClick(editor, {
					left: options.lastDoubleClick?.clientX,
					top: options.lastDoubleClick?.clientY,
				});
			} else {
				editor.commands.focus('end');
			}

			onEditorReady?.(editor);
		} else {
			editor.commands.blur();
		}
	}, [isEditing, isReadOnly, editor, onEditorReady, options?.lastDoubleClick]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!isEditing) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			stopEditing();
			editor?.commands.blur();
		}
		// Stop propagation only if we are editing to allow text input
		e.stopPropagation();
	}, [isEditing, stopEditing, editor]);

	return (
		<div
			ref={rootRef}
			className="note-card flex bg-[#1e293b]/90 shadow-xl hover:border-cyan-500/50 border border-white/10"
			onKeyDown={handleKeyDown}
			style={{
				userSelect: isEditing ? 'text' : 'none',
				WebkitUserSelect: isEditing ? 'text' : 'none',
				MozUserSelect: isEditing ? 'text' : 'none',
				cursor: isEditing ? 'text' : 'pointer',
				height: isEditing ? 'auto' : '100%',
				minHeight: isEditing ? '100%' : undefined,
				transition: isEditing ? 'none' : 'height 0.2s ease-out',
			}}
		>
			<EditorContent
				editor={editor}
				style={{
					userSelect: isEditing ? 'text' : 'none',
					WebkitUserSelect: isEditing ? 'text' : 'none',
					flex: 1,
					overflow: isEditing ? 'visible' : 'hidden',
				}}
			/>
		</div>
	)
}

type Point = { left: number; top: number }

function placeCursorAtClick(editor: TipTapEditor, point: Point) {
  const view = editor.view;
  if (!view) return;

  const result = view.posAtCoords(point);
  if (!result) return;

  const { pos } = result;

  const tr = view.state.tr.setSelection(
    TextSelection.create(view.state.doc, pos),
  );

  view.dispatch(tr);
  view.focus();
}