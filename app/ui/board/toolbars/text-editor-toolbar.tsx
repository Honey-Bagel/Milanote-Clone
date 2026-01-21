'use client';

import { Editor, useEditorState } from '@tiptap/react';
import { useCallback } from 'react';
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	Strikethrough,
	List,
	ListOrdered,
	Heading1,
	Heading2,
	Heading3,
	Highlighter,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Link as LinkIcon,
	Minus,
} from 'lucide-react';

interface TextEditorToolbarProps {
	editor: Editor | null;
}

// Define components outside of render function
const ToolbarButton = ({
	onClick,
	isActive,
	children,
	title,
}: {
	onClick: () => void;
	isActive?: boolean;
	children: React.ReactNode;
	title: string;
}) => (
	<button
		onMouseDown={(e) => {
			// Prevent the button from taking focus away from the editor
			e.preventDefault();
			// Execute the action immediately on mouse down
			onClick();
		}}
		title={title}
		className={`p-2 rounded-lg transition-all ${
			isActive
				? 'bg-primary text-white shadow-lg shadow-primary/20'
				: 'text-secondary-foreground hover:bg-white/5 hover:text-white'
		}`}
		type="button"
	>
		{children}
	</button>
);

const ToolbarDivider = () => <div className="w-px h-6 bg-white/10" />;

export default function TextEditorToolbar({ editor }: TextEditorToolbarProps) {
	// Use TipTap's official useEditorState hook for reactive state tracking
	// This will automatically re-render when any editor state changes
	const editorState = useEditorState({
		editor,
		selector: (ctx) => ({
			isBold: ctx.editor?.isActive('bold') ?? false,
			isItalic: ctx.editor?.isActive('italic') ?? false,
			isUnderline: ctx.editor?.isActive('underline') ?? false,
			isStrike: ctx.editor?.isActive('strike') ?? false,
			isHeading1: ctx.editor?.isActive('heading', { level: 1 }) ?? false,
			isHeading2: ctx.editor?.isActive('heading', { level: 2 }) ?? false,
			isHeading3: ctx.editor?.isActive('heading', { level: 3 }) ?? false,
			isBulletList: ctx.editor?.isActive('bulletList') ?? false,
			isOrderedList: ctx.editor?.isActive('orderedList') ?? false,
			isAlignLeft: ctx.editor?.isActive({ textAlign: 'left' }) ?? false,
			isAlignCenter: ctx.editor?.isActive({ textAlign: 'center' }) ?? false,
			isAlignRight: ctx.editor?.isActive({ textAlign: 'right' }) ?? false,
			isHighlight: ctx.editor?.isActive('highlight') ?? false,
			isLink: ctx.editor?.isActive('link') ?? false,
		}),
	});

	// Callbacks for actions
	const toggleBold = useCallback(() => {
		editor?.chain().focus().toggleBold().run();
	}, [editor]);

	const toggleItalic = useCallback(() => {
		editor?.chain().focus().toggleItalic().run();
	}, [editor]);

	const toggleUnderline = useCallback(() => {
		editor?.chain().focus().toggleUnderline().run();
	}, [editor]);

	const toggleStrike = useCallback(() => {
		editor?.chain().focus().toggleStrike().run();
	}, [editor]);

	const toggleHeading1 = useCallback(() => {
		editor?.chain().focus().toggleHeading({ level: 1 }).run();
	}, [editor]);

	const toggleHeading2 = useCallback(() => {
		editor?.chain().focus().toggleHeading({ level: 2 }).run();
	}, [editor]);

	const toggleHeading3 = useCallback(() => {
		editor?.chain().focus().toggleHeading({ level: 3 }).run();
	}, [editor]);

	const toggleBulletList = useCallback(() => {
		editor?.chain().focus().toggleBulletList().run();
	}, [editor]);

	const toggleOrderedList = useCallback(() => {
		editor?.chain().focus().toggleOrderedList().run();
	}, [editor]);

	const setAlignLeft = useCallback(() => {
		editor?.chain().focus().setTextAlign('left').run();
	}, [editor]);

	const setAlignCenter = useCallback(() => {
		editor?.chain().focus().setTextAlign('center').run();
	}, [editor]);

	const setAlignRight = useCallback(() => {
		editor?.chain().focus().setTextAlign('right').run();
	}, [editor]);

	const toggleHighlight = useCallback(() => {
		editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run();
	}, [editor]);

	const addLink = useCallback(() => {
		const url = window.prompt('Enter URL:');
		if (url) {
			editor?.chain().focus().setLink({ href: url }).run();
		} else {
			editor?.chain().focus().run();
		}
	}, [editor]);

	const addHorizontalRule = useCallback(() => {
		editor?.chain().focus().setHorizontalRule().run();
	}, [editor]);

	if (!editor) {
		return null;
	}

	return (
		<div className="flex items-center gap-2 px-6 bg-[#0f172a] border-b border-white/10 h-full">
			<span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider mr-2">
				Text Formatting
			</span>

			{/* Text Styles */}
			<div className="flex items-center gap-1">
				<ToolbarButton onClick={toggleBold} isActive={editorState?.isBold} title="Bold (Ctrl+B)">
					<Bold className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={toggleItalic} isActive={editorState?.isItalic} title="Italic (Ctrl+I)">
					<Italic className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton
					onClick={toggleUnderline}
					isActive={editorState?.isUnderline}
					title="Underline (Ctrl+U)"
				>
					<UnderlineIcon className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={toggleStrike} isActive={editorState?.isStrike} title="Strikethrough">
					<Strikethrough className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Headings */}
			<div className="flex items-center gap-1">
				<ToolbarButton onClick={toggleHeading1} isActive={editorState?.isHeading1} title="Heading 1">
					<Heading1 className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={toggleHeading2} isActive={editorState?.isHeading2} title="Heading 2">
					<Heading2 className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={toggleHeading3} isActive={editorState?.isHeading3} title="Heading 3">
					<Heading3 className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Lists */}
			<div className="flex items-center gap-1">
				<ToolbarButton onClick={toggleBulletList} isActive={editorState?.isBulletList} title="Bullet List">
					<List className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton
					onClick={toggleOrderedList}
					isActive={editorState?.isOrderedList}
					title="Numbered List"
				>
					<ListOrdered className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Alignment */}
			<div className="flex items-center gap-1">
				<ToolbarButton onClick={setAlignLeft} isActive={editorState?.isAlignLeft} title="Align Left">
					<AlignLeft className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={setAlignCenter} isActive={editorState?.isAlignCenter} title="Align Center">
					<AlignCenter className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={setAlignRight} isActive={editorState?.isAlignRight} title="Align Right">
					<AlignRight className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Other */}
			<div className="flex items-center gap-1">
				<ToolbarButton onClick={toggleHighlight} isActive={editorState?.isHighlight} title="Highlight">
					<Highlighter className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={addLink} isActive={editorState?.isLink} title="Add Link">
					<LinkIcon className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton onClick={addHorizontalRule} title="Horizontal Rule">
					<Minus className="w-4 h-4" />
				</ToolbarButton>
			</div>
		</div>
	);
}
