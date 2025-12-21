export const BOARD_DEFAULTS = {
	color: "#ef4444",
	is_public: false,
} as const;

export const GRID_SIZE = 20; // Canvas pixels

// Canvas Zoom
export const ZOOM_STEPS = [0.25, 0.40, 0.60, 0.80, 1.00, 1.20, 1.40, 1.60, 1.80, 2.00, 2.20, 2.40, 2.60, 2.80, 3.00];
export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];