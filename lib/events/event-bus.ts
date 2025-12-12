/**
 * Event Bus for Canvas Operations
 *
 * Centralized event system for coordinating canvas interactions.
 * This replaces scattered event handling across multiple hooks and components.
 */

import { create } from 'zustand';

// ============================================================================
// Event Type Definitions
// ============================================================================

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

/**
 * All possible canvas events
 * Use discriminated unions for type safety
 */
export type CanvasEvent =
	// Card Selection Events
	| { type: 'card.select'; cardId: string; addToSelection: boolean }
	| { type: 'card.deselect'; cardId: string }
	| { type: 'card.selectAll' }
	| { type: 'card.deselectAll' }

	// Card Transformation Events
	| { type: 'card.moveStart'; cardIds: string[]; startPosition: Point }
	| { type: 'card.move'; cardIds: string[]; delta: Point; snapToGrid: boolean }
	| { type: 'card.moveEnd'; cardIds: string[]; finalPosition: Point }
	| { type: 'card.resizeStart'; cardId: string; startSize: Size }
	| { type: 'card.resize'; cardId: string; newSize: Size }
	| { type: 'card.resizeEnd'; cardId: string; finalSize: Size }

	// Card Lifecycle Events
	| { type: 'card.create'; cardType: string; position: Point }
	| { type: 'card.created'; cardId: string }
	| { type: 'card.delete'; cardIds: string[] }
	| { type: 'card.deleted'; cardIds: string[] }
	| { type: 'card.duplicate'; cardIds: string[] }

	// Card Content Events
	| { type: 'card.editStart'; cardId: string }
	| { type: 'card.editEnd'; cardId: string }
	| { type: 'card.contentChange'; cardId: string; content: any }

	// Card Z-Order Events
	| { type: 'card.bringToFront'; cardIds: string[] }
	| { type: 'card.sendToBack'; cardIds: string[] }

	// Viewport Events
	| { type: 'viewport.panStart'; position: Point }
	| { type: 'viewport.pan'; delta: Point }
	| { type: 'viewport.panEnd' }
	| { type: 'viewport.zoom'; delta: number; center: Point }
	| { type: 'viewport.reset' }

	// Connection Events (Lines)
	| { type: 'connection.start'; fromCardId: string; handleId: string }
	| { type: 'connection.update'; position: Point }
	| { type: 'connection.complete'; toCardId: string; handleId: string }
	| { type: 'connection.cancel' }

	// Toolbar Events
	| { type: 'toolbar.cardTypeSelect'; cardType: string }
	| { type: 'toolbar.alignCards'; direction: 'top' | 'bottom' | 'left' | 'right' | 'center-h' | 'center-v' }
	| { type: 'toolbar.distributeCards'; direction: 'horizontal' | 'vertical' }

	// Keyboard Events
	| { type: 'keyboard.delete' }
	| { type: 'keyboard.undo' }
	| { type: 'keyboard.redo' }
	| { type: 'keyboard.copy' }
	| { type: 'keyboard.paste' }
	| { type: 'keyboard.escape' }

	// Grid Events
	| { type: 'grid.toggle' }
	| { type: 'grid.snapToggle' };

// ============================================================================
// Event Handler Types
// ============================================================================

type EventHandler<T extends CanvasEvent = CanvasEvent> = (event: T) => void;
type UnsubscribeFn = () => void;

// ============================================================================
// Event Bus Store
// ============================================================================

interface EventBusState {
	// Listeners mapped by event type
	listeners: Map<CanvasEvent['type'], Set<EventHandler>>;

	// Event history for debugging (last 100 events)
	history: CanvasEvent[];

	// Actions
	emit: (event: CanvasEvent) => void;
	on: <T extends CanvasEvent['type']>(
		eventType: T,
		handler: EventHandler<Extract<CanvasEvent, { type: T }>>
	) => UnsubscribeFn;
	off: (eventType: CanvasEvent['type'], handler: EventHandler) => void;
	clear: () => void;
}

export const useEventBus = create<EventBusState>((set, get) => ({
	listeners: new Map(),
	history: [],

	/**
	 * Emit an event to all registered listeners
	 */
	emit: (event: CanvasEvent) => {
		const { listeners, history } = get();

		// Add to history for debugging
		set({
			history: [...history.slice(-99), event], // Keep last 100 events
		});

		// Get handlers for this event type
		const handlers = listeners.get(event.type);
		if (!handlers) return;

		// Call all handlers
		handlers.forEach((handler) => {
			try {
				handler(event);
			} catch (error) {
				console.error(`Error in event handler for ${event.type}:`, error);
			}
		});
	},

	/**
	 * Subscribe to an event type
	 * Returns unsubscribe function
	 */
	on: (eventType, handler) => {
		const { listeners } = get();

		// Get or create handler set for this event type
		if (!listeners.has(eventType)) {
			listeners.set(eventType, new Set());
		}

		listeners.get(eventType)!.add(handler as EventHandler);

		// Return unsubscribe function
		return () => {
			get().off(eventType, handler as EventHandler);
		};
	},

	/**
	 * Unsubscribe from an event type
	 */
	off: (eventType, handler) => {
		const { listeners } = get();
		const handlers = listeners.get(eventType);

		if (handlers) {
			handlers.delete(handler);

			// Clean up empty sets
			if (handlers.size === 0) {
				listeners.delete(eventType);
			}
		}
	},

	/**
	 * Clear all listeners (useful for cleanup/testing)
	 */
	clear: () => {
		set({
			listeners: new Map(),
			history: [],
		});
	},
}));

// ============================================================================
// React Hook for Event Subscription
// ============================================================================

import { useEffect } from 'react';

/**
 * Hook for subscribing to canvas events
 * Automatically unsubscribes on unmount
 *
 * @example
 * useCanvasEvent('card.select', (event) => {
 *	 console.log('Card selected:', event.cardId);
 * });
 */
export function useCanvasEvent<T extends CanvasEvent['type']>(
	eventType: T,
	handler: EventHandler<Extract<CanvasEvent, { type: T }>>,
	deps: React.DependencyList = []
) {
	const on = useEventBus((state) => state.on);

	useEffect(() => {
		const unsubscribe = on(eventType, handler);
		return unsubscribe;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventType, on, ...deps]);
}

/**
 * Hook for emitting canvas events
 * Returns a stable emit function
 *
 * @example
 * const emit = useCanvasEmit();
 * emit({ type: 'card.select', cardId: '123', addToSelection: false });
 */
export function useCanvasEmit() {
	return useEventBus((state) => state.emit);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get event history for debugging
 */
export function useEventHistory() {
	return useEventBus((state) => state.history);
}

/**
 * Log all events to console (for debugging)
 */
export function startEventLogging() {
	const unsubscribe = useEventBus.getState().on('card.select' as any, (event) => {
		console.log('[EventBus]', event);
	});

	// Actually subscribe to all event types
	const allEventTypes = new Set<CanvasEvent['type']>();

	const logAllEvents = () => {
		const emit = useEventBus.getState().emit;
		const originalEmit = emit;

		useEventBus.setState({
			emit: (event) => {
				console.log('[EventBus]', event);
				originalEmit(event);
			},
		});
	};

	logAllEvents();

	return () => {
		// Restore original emit
		unsubscribe();
	};
}
