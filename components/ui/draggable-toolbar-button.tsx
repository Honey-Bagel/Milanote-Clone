'use client';

import { LucideIcon } from 'lucide-react';
import { Card } from '@/lib/types';

interface DraggableToolbarButtonProps {
  icon: LucideIcon;
  title: string;
  cardType: Card['card_type'];
  onDragStart: (cardType: Card['card_type'], e: React.DragEvent) => void;
  onClick: () => void;
}

export function DraggableToolbarButton({
  icon: Icon,
  title,
  cardType,
  onDragStart,
  onClick,
}: DraggableToolbarButtonProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // Set the card type as data to transfer
    e.dataTransfer.setData('cardType', cardType);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a custom drag preview
    const dragPreview = document.createElement('div');
    dragPreview.className = 'bg-gray-800 border-2 border-blue-500 rounded-lg p-3 shadow-xl';
    dragPreview.style.width = '200px';
    dragPreview.innerHTML = `
      <div class="flex items-center space-x-2 text-white">
        <div class="text-gray-300">${Icon.displayName}</div>
        <span class="font-medium">${title}</span>
      </div>
    `;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    document.body.appendChild(dragPreview);
    
    e.dataTransfer.setDragImage(dragPreview, 100, 20);
    
    // Clean up the preview element after drag starts
    setTimeout(() => {
      document.body.removeChild(dragPreview);
    }, 0);
    
    onDragStart(cardType, e);
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="p-2 hover:bg-[var(--border)] rounded-lg text-[var(--muted)] hover:text-gray-200 transition-colors cursor-grab active:cursor-grabbing"
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}