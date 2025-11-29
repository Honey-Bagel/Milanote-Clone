import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Card } from "./types";

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

export const getDefaultCardDimensions = (cardType: Card["card_type"]) => {
	switch (cardType) {
		case 'note':
			return { canResize: false, minWidth: 200, minHeight: null, defaultWidth: 250, defaultHeight: null };
		case 'image':
			return { canResize: true, keepAspectRatio: true, minWidth: 200, minHeight: 200, defaultWidth: 300, defaultHeight: null };
		case 'task_list':
			return { canResize: true, minWidth: 250, minHeight: 100, defaultWidth: 250, defaultHeight: 100 };
		case 'link':
			return { canResize: false, minWidth: 200, minHeight: 70, defaultWidth: 250, defaultHeight: 70 };
		case 'file':
			return { canResize: false, minWidth: 300, minHeight: 70, defaultWidth: 300, defaultHeight: 70 };
		case 'color_palette':
			return { canResize: false, minWidth: 200, minHeight: null, defaultWidth: 200, defaultHeight: null };
		case 'column':
			return { canResize: false, minWidth: 250, minHeight: 60, defaultWidth: 250, defaultHeight: null };
		case 'board':
			return { canResize: true, minWidth: 200, minHeight: 200, defaultWidth: 250, defaultHeight: 250 };
		case 'line':
			return { canResize: false, minWidth: 0, minHeight: 0, defaultWidth: 200, defaultHeight: 100 };
		default:
			return { canResize: true, minWidth: 100, minHeight: 60, defaultWidth: 250, defaultHeight: 70 };
	}
}