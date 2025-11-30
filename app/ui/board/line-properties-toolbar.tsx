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
    className={`p-2 rounded-lg transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
    type="button"
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-6 bg-white/10" />
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
    className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
      isActive ? 'border-white shadow-lg' : 'border-white/20 hover:border-white/40'
    }`}
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
    <div className="bg-[#0f172a] border-b border-white/10 px-6 py-3 h-full flex items-center">
      <div className="flex items-center gap-2">
        {/* Line Style Label */}
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Line</span>

        <ToolbarDivider />

        {/* Colors */}
        <div className="flex items-center gap-1.5 px-2">
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
          <div className="w-6 h-0.5 bg-current rounded-full" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => updateLineProperty({ line_style: 'dashed' })}
          isActive={lineData.line_style === 'dashed'}
          title="Dashed line"
        >
          <div className="w-6 h-0.5 bg-current rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)' }} />
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
        <span className="text-xs font-medium text-slate-400">Width</span>
        <select
          value={lineData.stroke_width}
          onChange={(e) => updateLineProperty({ stroke_width: parseInt(e.target.value) })}
          className="bg-[#020617] text-slate-300 text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer hover:border-white/20 transition-all"
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
            className="w-24 h-1.5 bg-[#020617] rounded-lg appearance-none cursor-pointer slider-thumb"
            title="Curvature amount"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${lineData.curvature * 100}%, #020617 ${lineData.curvature * 100}%, #020617 100%)`
            }}
          />
        )}

        <ToolbarDivider />

        {/* Start Cap */}
        <span className="text-xs font-medium text-slate-400">Start</span>
        <div className="flex items-center gap-1">
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
        </div>

        <ToolbarDivider />

        {/* End Cap */}
        <span className="text-xs font-medium text-slate-400">End</span>
        <div className="flex items-center gap-1">
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
    </div>
  );
}