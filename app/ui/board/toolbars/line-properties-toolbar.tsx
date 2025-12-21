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
import { useDebouncedCallback } from 'use-debounce';
import { CardService } from '@/lib/services';

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
	const lineData = card;

  // Debounced save to database
  const debouncedSave = useDebouncedCallback(
    async (updates: Record<string, any>) => {
      try {
        if (card.id === 'preview-card') return;

        await CardService.updateCardContent(
          card.id,
          card.board_id,
          'line',
          updates
        );
      } catch (error) {
        console.error('Failed to save line properties:', error);
      }
    },
    300
  );

  // Update local state and trigger save
  const updateLineProperty = useCallback((updates: Record<string, any>) => {
    debouncedSave(updates);
  }, [debouncedSave]);

  const colors = ['#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'];

  const endCapOptions: Array<{ value: LineCard['line_end_cap']; icon: React.ReactNode; label: string }> = [
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
              isActive={lineData.line_color === color}
              onClick={() => updateLineProperty({ line_color: color })}
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
          value={lineData.line_stroke_width}
          onChange={(e) => updateLineProperty({ line_stroke_width: parseInt(e.target.value) })}
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

        {/* Curvature - uses line_control_point_offset which can be positive or negative */}
        <ToolbarButton
          onClick={() => updateLineProperty({ line_control_point_offset: 0 })}
          isActive={(lineData.line_control_point_offset || 0) === 0}
          title="Straight line"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => updateLineProperty({ line_control_point_offset: 50 })}
          isActive={(lineData.line_control_point_offset || 0) !== 0}
          title="Curved line"
        >
          <Spline className="w-4 h-4" />
        </ToolbarButton>

        {(lineData.line_control_point_offset || 0) !== 0 && (
          <input
            type="range"
            min="-200"
            max="200"
            step="10"
            value={lineData.line_control_point_offset || 0}
            onChange={(e) => updateLineProperty({ line_control_point_offset: parseFloat(e.target.value) })}
            className="w-24 h-1.5 bg-[#020617] rounded-lg appearance-none cursor-pointer slider-thumb"
            title="Curvature amount"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${Math.abs(lineData.line_control_point_offset || 0) / 2}%, #020617 ${Math.abs(lineData.line_control_point_offset || 0) / 2}%, #020617 100%)`
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
              onClick={() => updateLineProperty({ line_start_cap: option.value })}
              isActive={lineData.line_start_cap === option.value}
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
              onClick={() => updateLineProperty({ line_end_cap: option.value })}
              isActive={lineData.line_end_cap === option.value}
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