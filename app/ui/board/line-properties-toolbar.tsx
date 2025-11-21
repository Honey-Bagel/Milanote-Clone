'use client';

import { useCallback } from 'react';
import {
  Minus,
  MoveRight,
  Circle,
  Diamond,
  Spline,
} from 'lucide-react';
import type { LineCard } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { updateCardContent } from '@/lib/data/cards-client';
import { useDebouncedCallback } from 'use-debounce';

interface LinePropertiesToolbarProps {
  card: LineCard;
}

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

const ColorButton = ({
  color,
  isActive,
  onClick
}: {
  color: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-6 h-6 rounded-full border-2 ${isActive ? 'border-white' : 'border-transparent'}`}
    style={{ backgroundColor: color }}
    title={color}
  />
);

export default function LinePropertiesToolbar({ card }: LinePropertiesToolbarProps) {
  const { updateCard } = useCanvasStore();
  const lineData = card.line_cards;

  // Debounced save to database
  const debouncedSave = useDebouncedCallback(
    async (updates: Partial<LineCard['line_cards']>) => {
      try {
        await updateCardContent(card.id, 'line', updates);
      } catch (error) {
        console.error('Failed to save line properties:', error);
      }
    },
    300
  );

  // Update local state and trigger save
  const updateLineProperty = useCallback((updates: Partial<LineCard['line_cards']>) => {
    updateCard(card.id, {
      ...card,
      line_cards: {
        ...lineData,
        ...updates,
      },
    });
    debouncedSave(updates);
  }, [card, lineData, updateCard, debouncedSave]);

  const colors = ['#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'];

  const endCapOptions: Array<{ value: LineCard['line_cards']['end_cap']; icon: React.ReactNode; label: string }> = [
    { value: 'none', icon: <Minus className="w-4 h-4" />, label: 'None' },
    { value: 'arrow', icon: <MoveRight className="w-4 h-4" />, label: 'Arrow' },
    { value: 'dot', icon: <Circle className="w-4 h-4" />, label: 'Dot' },
    { value: 'diamond', icon: <Diamond className="w-4 h-4" />, label: 'Diamond' },
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 h-full flex items-center">
      <div className="flex items-center space-x-2">
        {/* Line Style Label */}
        <span className="text-gray-400 text-sm mr-2">Line</span>

        <ToolbarDivider />

        {/* Colors */}
        <div className="flex items-center space-x-1">
          {colors.map((color) => (
            <ColorButton
              key={color}
              color={color}
              isActive={lineData.color === color}
              onClick={() => updateLineProperty({ color })}
            />
          ))}
        </div>

        <ToolbarDivider />

        {/* Line Style */}
        <ToolbarButton
          onClick={() => updateLineProperty({ line_style: 'solid' })}
          isActive={lineData.line_style === 'solid'}
          title="Solid line"
        >
          <div className="w-6 h-0.5 bg-current" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => updateLineProperty({ line_style: 'dashed' })}
          isActive={lineData.line_style === 'dashed'}
          title="Dashed line"
        >
          <div className="w-6 h-0.5 bg-current" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)' }} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => updateLineProperty({ line_style: 'dotted' })}
          isActive={lineData.line_style === 'dotted'}
          title="Dotted line"
        >
          <div className="w-6 h-0.5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 5px)' }} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Stroke Width */}
        <span className="text-gray-400 text-xs">Width</span>
        <select
          value={lineData.stroke_width}
          onChange={(e) => updateLineProperty({ stroke_width: parseInt(e.target.value) })}
          className="bg-gray-700 text-gray-200 text-sm rounded px-2 py-1 border border-gray-600"
        >
          <option value={1}>1px</option>
          <option value={2}>2px</option>
          <option value={3}>3px</option>
          <option value={4}>4px</option>
          <option value={6}>6px</option>
          <option value={8}>8px</option>
        </select>

        <ToolbarDivider />

        {/* Curvature */}
        <ToolbarButton
          onClick={() => updateLineProperty({ curvature: 0 })}
          isActive={lineData.curvature === 0}
          title="Straight line"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => updateLineProperty({ curvature: 0.5 })}
          isActive={lineData.curvature > 0}
          title="Curved line"
        >
          <Spline className="w-4 h-4" />
        </ToolbarButton>

        {lineData.curvature > 0 && (
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={lineData.curvature}
            onChange={(e) => updateLineProperty({ curvature: parseFloat(e.target.value) })}
            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            title="Curvature amount"
          />
        )}

        <ToolbarDivider />

        {/* Start Cap */}
        <span className="text-gray-400 text-xs">Start</span>
        {endCapOptions.map((option) => (
          <ToolbarButton
            key={`start-${option.value}`}
            onClick={() => updateLineProperty({ start_cap: option.value })}
            isActive={lineData.start_cap === option.value}
            title={`Start: ${option.label}`}
          >
            {option.icon}
          </ToolbarButton>
        ))}

        <ToolbarDivider />

        {/* End Cap */}
        <span className="text-gray-400 text-xs">End</span>
        {endCapOptions.map((option) => (
          <ToolbarButton
            key={`end-${option.value}`}
            onClick={() => updateLineProperty({ end_cap: option.value })}
            isActive={lineData.end_cap === option.value}
            title={`End: ${option.label}`}
          >
            {option.icon}
          </ToolbarButton>
        ))}
      </div>
    </div>
  );
}
