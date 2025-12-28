import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Card } from "./types";
import { useEffect, useState } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getTimeAgo(timestamp: string): string {
	const now = new Date();
	const past = new Date(timestamp);
	const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

	// Less than a minute
	if (diffInSeconds < 60) {
		return "Just now";
	}

	// Minutes
	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
	}

	// Hours
	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
	}

	// Days
	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
	}

	// Weeks
	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
	}

	// Months
	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
	}

	// Years
	const diffInYears = Math.floor(diffInDays / 365);
	return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

// Debounce hook for search input
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

// Date filter utilities
export type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year';

export function getDateRangeTimestamp(type: DateFilterType): { start: number; end: number } {
	const now = Date.now();
	const oneDayMs = 24 * 60 * 60 * 1000;

	switch (type) {
		case 'today':
			const todayStart = new Date().setHours(0, 0, 0, 0);
			return { start: todayStart, end: now };
		case 'week':
			return { start: now - (7 * oneDayMs), end: now };
		case 'month':
			return { start: now - (30 * oneDayMs), end: now };
		case 'year':
			return { start: now - (365 * oneDayMs), end: now };
		case 'all':
		default:
			return { start: 0, end: now };
	}
}

export function isWithinDateRange(timestamp: number, range: { start: number; end: number }): boolean {
	return timestamp >= range.start && timestamp <= range.end;
}

export const getDefaultCardDimensions = (cardType: Card["card_type"]) => {
	switch (cardType) {
		case 'note':
			// Notes are fully resizable (width and height)
			return { canResize: true, minWidth: 150, minHeight: 60, defaultWidth: 250, defaultHeight: 150 };
		case 'image':
			return { canResize: true, keepAspectRatio: true, minWidth: 200, minHeight: 200, defaultWidth: 300, defaultHeight: null };
		case 'task_list':
			return { canResize: true, minWidth: 250, minHeight: 100, defaultWidth: 250, defaultHeight: 100 };
		case 'link':
			return { canResize: false, minWidth: 200, minHeight: 70, defaultWidth: 250, defaultHeight: null };
		case 'file':
			return { canResize: false, minWidth: 300, minHeight: 70, defaultWidth: 300, defaultHeight: 70 };
		case 'color_palette':
			return { canResize: false, minWidth: 200, minHeight: null, defaultWidth: 200, defaultHeight: 130 };
		case 'column':
			return { canResize: true, minWidth: 250, minHeight: 60, defaultWidth: 250, defaultHeight: null };
		case 'board':
			return { canResize: false, minWidth: 200, minHeight: 200, defaultWidth: 250, defaultHeight: 250 };
		case 'line':
			return { canResize: false, minWidth: 0, minHeight: 0, defaultWidth: 200, defaultHeight: 100 };
		default:
			return { canResize: true, minWidth: 100, minHeight: 60, defaultWidth: 250, defaultHeight: 70 };
	}
}

export const getDefaultCardData = (cardType: Card["card_type"]) => {
	switch (cardType) {
		case 'note':
			return { note_content: '', note_color: 'default' as const };
		case 'image':
			return { image_url: '', image_caption: '' };
		case 'task_list':
			return { task_list_title: 'Task List', tasks: [{ id: `task-${Date.now()}`, text: 'test', completed: false, position: 0 }] };
		case 'link':
			return { link_title: 'New Link', link_url: 'https://example.com' };
		case 'file':
			return { file_name: 'file.pdf', file_url: '', file_type: 'pdf', file_size: 0 };
		case 'color_palette':
			return { palette_title: 'Palette', palette_colors: ['#FF0000', '#00FF00', '#0000FF'] };
		case 'column':
			return { column_title: 'Column', column_background_color: '#f3f4f6', column_is_collapsed: false, column_items: [] };
		case 'board':
			return { linked_board_id: "", board_title: 'New Board', board_color: '#3B82F6', board_card_count: '0' };
		case 'line':
			return {
				line_start_x: 0,
				line_start_y: 50,
				line_end_x: 200,
				line_end_y: 50,
				line_color: '#6b7280',
				line_stroke_width: 2,
				line_style: 'solid' as const,
				line_start_cap: 'none' as const,
				line_end_cap: 'arrow' as const,
				line_curvature: 0,
				line_control_point_offset: 0,
				line_reroute_nodes: null,
				line_start_attached_card_id: null,
				line_start_attached_side: null,
				line_end_attached_card_id: null,
				line_end_attached_side: null,
			};
		default:
			return {};
	}
}