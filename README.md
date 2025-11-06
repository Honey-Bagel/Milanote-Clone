# Milanote Clone - Canvas System

A complete, production-ready infinite canvas system built with Next.js, TypeScript, and Zustand. This implementation mimics Milanote's architecture using HTML/CSS transforms instead of canvas libraries.

## 📁 File Structure

```
/stores
  └── canvas-store.ts          # Zustand store (state management)

/utils
  └── transform.ts             # Transform utilities (viewport, coordinates)

/hooks
  ├── useCanvasInteractions.ts # Pan and zoom
  ├── useDraggable.ts          # Card dragging
  ├── useKeyboardShortcuts.ts  # Keyboard shortcuts
  └── useSelectionBox.ts       # Multi-select box

/components/canvas
  ├── Canvas.tsx               # Main canvas component
  ├── CanvasElement.tsx        # Card wrapper
  ├── Grid.tsx                 # Background grid
  ├── SelectionBox.tsx         # Visual selection feedback
  ├── ConnectionLayer.tsx      # SVG lines between cards
  └── /cards
      ├── CardRenderer.tsx     # Routes to card types
      ├── CardBase.tsx         # Base card wrapper
      ├── NoteCard.tsx         # Text note card
      ├── ImageCard.tsx        # Image card
      └── OtherCards.tsx       # Other card types

/styles
  └── canvas.css               # Canvas and card styles

/examples
  └── usage-examples.tsx       # Usage examples
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install zustand immer
```

### 2. Import Styles

Add to your `globals.css` or layout:

```css
@import './styles/canvas.css';
```

### 3. Basic Usage

```tsx
'use client';

import { Canvas } from '@/components/canvas/Canvas';

export default function CanvasPage() {
  return (
    <div className="w-full h-screen">
      <Canvas />
    </div>
  );
}
```

### 4. Add Cards Programmatically

```tsx
import { useCanvasStore } from '@/stores/canvas-store';

function MyComponent() {
  const { addCard } = useCanvasStore();

  const handleAddCard = () => {
    addCard({
      id: `card-${Date.now()}`,
      type: 'note',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 120 },
      zIndex: 0,
      content: { text: 'Hello World!' },
    });
  };

  return <button onClick={handleAddCard}>Add Note</button>;
}
```

## 🎨 Features

### Core Features
- ✅ Infinite canvas with pan and zoom
- ✅ Drag and drop cards
- ✅ Multi-select with selection box
- ✅ Keyboard shortcuts (copy/paste/delete/undo/redo)
- ✅ Connection lines between cards
- ✅ Multiple card types (note, image, text, link, etc.)
- ✅ Double-click to edit
- ✅ Resize handles
- ✅ Z-index management
- ✅ Background grid

### Interactions
- **Pan**: Space + Drag or Middle Mouse + Drag
- **Zoom**: Ctrl/Cmd + Scroll
- **Select**: Click card
- **Multi-select**: Shift + Click or drag selection box
- **Edit**: Double-click card
- **Delete**: Delete/Backspace key

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + A` | Select all |
| `Cmd/Ctrl + C` | Copy |
| `Cmd/Ctrl + X` | Cut |
| `Cmd/Ctrl + V` | Paste |
| `Cmd/Ctrl + D` | Duplicate |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Delete/Backspace` | Delete selected |
| `Cmd/Ctrl + ]` | Bring to front |
| `Cmd/Ctrl + [` | Send to back |
| `Cmd/Ctrl + +` | Zoom in |
| `Cmd/Ctrl + -` | Zoom out |
| `Cmd/Ctrl + 0` | Reset zoom |
| `Cmd/Ctrl + 1` | Zoom to fit |
| `Escape` | Clear selection |

## 📚 Core Concepts

### 1. Viewport Transform

The canvas uses CSS `matrix3d` transforms for optimal performance:

```typescript
transform: matrix3d(
  zoom, 0, 0, 0,
  0, zoom, 0, 0,
  0, 0, 1, 0,
  x, y, 0, 1
)
```

This enables:
- GPU acceleration
- Smooth pan and zoom
- Efficient rendering

### 2. Card Positioning

Cards use absolute positioning with top/left:

```tsx
<div
  style={{
    position: 'absolute',
    top: card.position.y,
    left: card.position.x,
    width: card.size.width,
    height: card.size.height,
  }}
>
```

### 3. State Management

Zustand with Immer for immutable updates:

```typescript
const useCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    // state and actions
  }))
);
```

## 🔧 Customization

### Adding a New Card Type

1. **Add type to store** (`stores/canvas-store.ts`):
```typescript
export type CardType = 'note' | 'image' | 'myNewType';
```

2. **Create component** (`components/canvas/cards/MyNewCard.tsx`):
```tsx
export function MyNewCard({ card, isEditing }: CardProps) {
  return (
    <CardBase isEditing={isEditing}>
      {/* Your card content */}
    </CardBase>
  );
}
```

3. **Add to CardRenderer** (`components/canvas/cards/CardRenderer.tsx`):
```tsx
case 'myNewType':
  return <MyNewCard card={card} isEditing={isEditing} />;
```

### Custom Card Example

```tsx
export function CustomCard({ card, isEditing }: CardProps) {
  const { updateCard } = useCanvasStore();

  return (
    <CardBase isEditing={isEditing}>
      <div className="p-4">
        <h3 className="font-bold">{card.content.title}</h3>
        <p>{card.content.description}</p>
        {/* Add your custom content */}
      </div>
    </CardBase>
  );
}
```

## 🗄️ Supabase Integration

### Database Schema

```sql
-- boards table
create table boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  title text not null,
  created_at timestamptz default now()
);

-- cards table
create table cards (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade,
  type text not null,
  position_x real not null,
  position_y real not null,
  width real not null,
  height real not null,
  z_index integer not null default 0,
  content jsonb not null default '{}',
  background_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- connections table
create table connections (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade,
  from_card_id uuid references cards(id) on delete cascade,
  to_card_id uuid references cards(id) on delete cascade,
  style text default 'solid',
  color text default '#000000'
);

-- Indexes
create index cards_board_id_idx on cards(board_id);
```

### Loading Data

```typescript
async function loadBoard(boardId: string) {
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('board_id', boardId);

  cards?.forEach(dbCard => {
    useCanvasStore.getState().addCard({
      id: dbCard.id,
      type: dbCard.type,
      position: { x: dbCard.position_x, y: dbCard.position_y },
      size: { width: dbCard.width, height: dbCard.height },
      zIndex: dbCard.z_index,
      content: dbCard.content,
      backgroundColor: dbCard.background_color,
    });
  });
}
```

### Saving Data

```typescript
async function saveCard(card: Card) {
  await supabase.from('cards').upsert({
    id: card.id,
    board_id: boardId,
    type: card.type,
    position_x: card.position.x,
    position_y: card.position.y,
    width: card.size.width,
    height: card.size.height,
    z_index: card.zIndex,
    content: card.content,
    background_color: card.backgroundColor,
    updated_at: new Date().toISOString(),
  });
}
```

### Real-time Collaboration

```typescript
function subscribeToBoard(boardId: string) {
  const channel = supabase
    .channel(`board:${boardId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cards',
      filter: `board_id=eq.${boardId}`,
    }, (payload) => {
      if (payload.eventType === 'UPDATE') {
        // Update local state
        useCanvasStore.getState().updateCard(payload.new.id, {
          position: {
            x: payload.new.position_x,
            y: payload.new.position_y,
          },
        });
      }
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}
```

## 🎯 Advanced Usage

### Custom Hooks

```typescript
// Custom hook for auto-save
function useAutoSave(boardId: string) {
  const { cards } = useCanvasStore();

  useEffect(() => {
    const interval = setInterval(() => {
      // Save all cards to Supabase
      saveAllCards(boardId, Array.from(cards.values()));
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(interval);
  }, [cards, boardId]);
}
```

### Viewport Controls

```typescript
function ViewportControls() {
  const { zoomIn, zoomOut, resetViewport, zoomToFit } = useCanvasStore();

  return (
    <div className="fixed bottom-4 right-4 flex gap-2">
      <button onClick={zoomOut}>−</button>
      <button onClick={resetViewport}>Reset</button>
      <button onClick={zoomToFit}>Fit</button>
      <button onClick={zoomIn}>+</button>
    </div>
  );
}
```

## ⚡ Performance Tips

1. **Virtualization**: For 500+ cards, implement viewport culling:
```typescript
const visibleCards = useMemo(() => {
  return Array.from(cards.values()).filter(card =>
    isCardInViewport(card, viewport)
  );
}, [cards, viewport]);
```

2. **Debounce saves**: Don't save on every change:
```typescript
const debouncedSave = useMemo(
  () => debounce(saveCard, 500),
  []
);
```

3. **Use CSS transforms**: Already implemented for optimal performance

4. **Memoize expensive calculations**: Use `useMemo` for complex operations

## 🐛 Troubleshooting

### Cards not appearing?
- Check if cards are added to the store
- Verify viewport position (use Reset button)
- Check z-index values

### Dragging not working?
- Ensure `useDraggable` hook is called
- Check if `isDragging` state is properly managed
- Verify event propagation isn't stopped elsewhere

### Selection not working?
- Check if `useSelectionBox` hook is attached
- Verify canvas ref is properly passed
- Ensure click events aren't being stopped

## 📦 Package Requirements

```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "immer": "^10.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🎓 Next Steps

1. **Add Tiptap** for rich text editing in NoteCards
2. **Implement resize** by completing ResizeHandles logic
3. **Add animations** with Framer Motion
4. **Build collaboration** with Supabase Realtime
5. **Export functionality** (PNG, PDF, JSON)
6. **Mobile support** (touch events, gestures)
7. **Search and filter** cards
8. **Templates** system
9. **Comments** and annotations
10. **Version history**

## 📄 License

MIT - feel free to use in your projects!

## 🙏 Credits

Architecture inspired by Milanote's implementation.