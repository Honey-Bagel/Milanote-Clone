# Canvas Event Architecture

A centralized event system for coordinating canvas interactions in Milanote.

## Overview

This event architecture replaces scattered event handling across multiple hooks and components with a unified event bus pattern. It provides:

- **Type-safe events** - All events are typed with discriminated unions
- **Centralized handling** - One place to see all possible canvas events
- **Easy debugging** - Event history and logging built-in
- **Loose coupling** - Components don't need direct references to each other
- **Extensible** - Easy to add new events and handlers

## Quick Start

### 1. Initialize in Canvas Component

```tsx
import { useCanvasEventHandlers } from '@/lib/events/event-handlers';

function Canvas({ boardId }) {
  // This sets up all event handlers
  useCanvasEventHandlers(boardId);

  return <div className="canvas">...</div>;
}
```

### 2. Emit Events from Components

```tsx
import { useCanvasEmit } from '@/lib/events/event-bus';

function Card({ cardId }) {
  const emit = useCanvasEmit();

  const handleClick = () => {
    emit({
      type: 'card.select',
      cardId,
      addToSelection: false,
    });
  };

  return <div onClick={handleClick}>Card</div>;
}
```

### 3. Listen to Events

```tsx
import { useCanvasEvent } from '@/lib/events/event-bus';

function MyComponent() {
  useCanvasEvent('card.select', (event) => {
    console.log('Card selected:', event.cardId);
  });

  return <div>...</div>;
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Event Bus                            │
│  - Manages event subscriptions                              │
│  - Dispatches events to handlers                            │
│  - Maintains event history for debugging                    │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │   Event Emitters     │    │   Event Handlers     │
    │                      │    │                      │
    │  - Canvas            │    │  - Selection         │
    │  - Cards             │    │  - Movement          │
    │  - Toolbar           │    │  - Editing           │
    │  - Keyboard          │    │  - Keyboard          │
    └──────────────────────┘    └──────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │   Side Effects       │
                              │                      │
                              │  - Update stores     │
                              │  - Save to DB        │
                              │  - Create undo       │
                              └──────────────────────┘
```

## Event Categories

### Card Selection
- `card.select` - Select a card (with modifier key handling)
- `card.deselect` - Deselect a card
- `card.selectAll` - Select all cards
- `card.deselectAll` - Clear selection

### Card Transformation
- `card.moveStart` - Start dragging cards
- `card.move` - Update card positions during drag
- `card.moveEnd` - Finish dragging, persist positions
- `card.resizeStart` - Start resizing a card
- `card.resize` - Update size during resize
- `card.resizeEnd` - Finish resizing, persist size

### Card Lifecycle
- `card.create` - Create new card
- `card.created` - Card created (emitted after creation)
- `card.delete` - Delete cards
- `card.deleted` - Cards deleted (emitted after deletion)

### Card Content
- `card.editStart` - Enter edit mode
- `card.editEnd` - Exit edit mode
- `card.contentChange` - Content changed

### Viewport
- `viewport.pan` - Pan the canvas
- `viewport.zoom` - Zoom in/out
- `viewport.reset` - Reset to default view

### Keyboard
- `keyboard.delete` - Delete key pressed
- `keyboard.undo` - Undo (Cmd/Ctrl+Z)
- `keyboard.redo` - Redo (Cmd/Ctrl+Shift+Z)
- `keyboard.escape` - Escape key pressed

## How to Expand

### Adding New Events

1. **Add to event type union** in `event-bus.ts`:

```typescript
export type CanvasEvent =
  // ... existing events
  | { type: 'card.favorite'; cardId: string; isFavorite: boolean }
  | { type: 'card.colorChange'; cardId: string; color: string };
```

2. **Create handler** in `event-handlers.ts`:

```typescript
export function useCardFavoriteHandler() {
  useCanvasEvent('card.favorite', async (event) => {
    await CardService.updateCard(event.cardId, {
      is_favorite: event.isFavorite,
    });
  });
}
```

3. **Add to master handler**:

```typescript
export function useCanvasEventHandlers(boardId: string) {
  // ... existing handlers
  useCardFavoriteHandler();
}
```

4. **Emit from component**:

```typescript
function Card({ cardId }) {
  const emit = useCanvasEmit();

  return (
    <button onClick={() => emit({
      type: 'card.favorite',
      cardId,
      isFavorite: true
    })}>
      Favorite
    </button>
  );
}
```

### Advanced Patterns

#### Event Composition

Chain events to create complex behaviors:

```typescript
useCanvasEvent('card.delete', (event) => {
  // Deselect before deleting
  emit({ type: 'card.deselectAll' });

  // Then emit deleted event after DB operation
  CardService.deleteCards(event.cardIds).then(() => {
    emit({ type: 'card.deleted', cardIds: event.cardIds });
  });
});
```

#### Conditional Handlers

Add logic based on app state:

```typescript
function useConditionalHandler() {
  const isReadOnly = useCanvasStore(state => state.isReadOnly);

  useCanvasEvent('card.delete', (event) => {
    if (isReadOnly) {
      console.log('Cannot delete in read-only mode');
      return;
    }

    // Proceed with deletion
  });
}
```

#### Event Middleware

Add logging, analytics, or validation:

```typescript
function useEventAnalytics() {
  useCanvasEvent('card.create', (event) => {
    analytics.track('Card Created', {
      cardType: event.cardType,
      position: event.position,
    });
  });

  useCanvasEvent('card.delete', (event) => {
    analytics.track('Cards Deleted', {
      count: event.cardIds.length,
    });
  });
}
```

## Benefits Over Current Architecture

### Before (Scattered)
```typescript
// In Canvas.tsx
const handleClick = () => {
  setSelectedCardIds(new Set([cardId]));
};

// In CanvasElement.tsx
const handleDragEnd = () => {
  setIsDragging(false);
  updateCardPosition(cardId, position);
};

// In CardFrame.tsx
const handleResizeEnd = () => {
  updateCardSize(cardId, size);
};
```

### After (Centralized)
```typescript
// Anywhere in the app
emit({ type: 'card.select', cardId, addToSelection: false });
emit({ type: 'card.moveEnd', cardIds: [cardId], finalPosition: pos });
emit({ type: 'card.resizeEnd', cardId, finalSize: size });

// All handled in one place
useCanvasEventHandlers(boardId);
```

## Debugging

### Enable Event Logging

```typescript
import { startEventLogging } from '@/lib/events/event-bus';

// In development
if (process.env.NODE_ENV === 'development') {
  startEventLogging();
}
```

### View Event History

```tsx
import { EventDebugPanel } from '@/lib/events/example-usage';

function App() {
  return (
    <>
      <Canvas />
      {process.env.NODE_ENV === 'development' && <EventDebugPanel />}
    </>
  );
}
```

## Migration Path

1. **Start small** - Pick one feature (e.g., selection)
2. **Add events** - Define events for that feature
3. **Create handlers** - Move existing logic into event handlers
4. **Update components** - Replace direct calls with event emissions
5. **Test** - Verify behavior is identical
6. **Repeat** - Migrate other features incrementally

## Best Practices

1. **Keep events granular** - One event per user action
2. **Use past tense for completed actions** - `card.created` not `card.create`
3. **Include all necessary data** - Avoid accessing stores in handlers
4. **Don't emit from handlers** - Avoid event loops (or be very careful)
5. **Document event contracts** - What data each event carries

## Next Steps

- [ ] Migrate card selection to event system
- [ ] Migrate drag and drop to events
- [ ] Add undo/redo event capture
- [ ] Implement toolbar events
- [ ] Add analytics tracking
- [ ] Create event-driven collaboration features
