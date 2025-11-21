'use client';

import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';
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
	Minus
} from 'lucide-react';

interface TextEditorToolbarProps {
	editor: Editor | null;
}

// Define components outside of render function
const ToolbarButton = ({ 
	onClick, 
	isActive, 
	children, 
	title 
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
		}}
		onClick={onClick}
		title={title}
		className={`p-2 rounded-lg transition-colors ${
			isActive 
				? 'bg-blue-600 text-white' 
				: 'text-gray-300 hover:bg-gray-700 hover:text-white'
		}`}
		type="button"
	>
		{children}
	</button>
);

const ToolbarDivider = () => (
	<div className="w-px h-6 bg-gray-700" />
);

export default function TextEditorToolbar({ editor }: TextEditorToolbarProps) {
	// Force re-render when editor state changes
	const [, forceUpdate] = useState({});

	// Force update immediately when editor changes (when selecting a different card)
	useEffect(() => {
		forceUpdate({});
	}, [editor]);

	useEffect(() => {
		if (!editor) return;

		// Listen to editor updates (selection changes, content changes, etc.)
		const updateHandler = () => {
			forceUpdate({});
		};

		editor.on('selectionUpdate', updateHandler);
		editor.on('transaction', updateHandler);
		editor.on('focus', updateHandler);
		editor.on('blur', updateHandler);

		return () => {
			editor.off('selectionUpdate', updateHandler);
			editor.off('transaction', updateHandler);
			editor.off('focus', updateHandler);
			editor.off('blur', updateHandler);
		};
	}, [editor]);

	if (!editor) {
		return null;
	}

	return (
		<div className="flex items-center gap-1 px-4 bg-gray-800 border-b border-gray-700 h-full">
			<span className="text-sm text-gray-400 mr-3 font-medium">Text Formatting</span>
			
			{/* Text Styles */}
			<div className="flex items-center gap-1">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					isActive={editor.isActive('bold')}
					title="Bold (Ctrl+B)"
				>
					<Bold className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					isActive={editor.isActive('italic')}
					title="Italic (Ctrl+I)"
				>
					<Italic className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					isActive={editor.isActive('underline')}
					title="Underline (Ctrl+U)"
				>
					<UnderlineIcon className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleStrike().run()}
					isActive={editor.isActive('strike')}
					title="Strikethrough"
				>
					<Strikethrough className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Headings */}
			<div className="flex items-center gap-1">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					isActive={editor.isActive('heading', { level: 1 })}
					title="Heading 1"
				>
					<Heading1 className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					isActive={editor.isActive('heading', { level: 2 })}
					title="Heading 2"
				>
					<Heading2 className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					isActive={editor.isActive('heading', { level: 3 })}
					title="Heading 3"
				>
					<Heading3 className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Lists */}
			<div className="flex items-center gap-1">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					isActive={editor.isActive('bulletList')}
					title="Bullet List"
				>
					<List className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					isActive={editor.isActive('orderedList')}
					title="Numbered List"
				>
					<ListOrdered className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Alignment */}
			<div className="flex items-center gap-1">
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					isActive={editor.isActive({ textAlign: 'left' })}
					title="Align Left"
				>
					<AlignLeft className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					isActive={editor.isActive({ textAlign: 'center' })}
					title="Align Center"
				>
					<AlignCenter className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('right').run()}
					isActive={editor.isActive({ textAlign: 'right' })}
					title="Align Right"
				>
					<AlignRight className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<ToolbarDivider />

			{/* Other */}
			<div className="flex items-center gap-1">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
					isActive={editor.isActive('highlight')}
					title="Highlight"
				>
					<Highlighter className="w-4 h-4" />
				</ToolbarButton>
				
				<ToolbarButton
					onClick={() => {
						const url = window.prompt('Enter URL:');
						if (url) {
							editor.chain().focus().setLink({ href: url }).run();
						} else {
							editor.chain().focus().run();
						}
					}}
					isActive={editor.isActive('link')}
					title="Add Link"
				>
					<LinkIcon className="w-4 h-4" />
				</ToolbarButton>

				<ToolbarButton
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
					title="Horizontal Rule"
				>
					<Minus className="w-4 h-4" />
				</ToolbarButton>
			</div>
		</div>
	);
}