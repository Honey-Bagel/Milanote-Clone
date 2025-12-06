# Canvas & Card System Migration to InstantDB

## Executive Summary

**Goal:** Complete the migration from Supabase to InstantDB for all canvas and card operations.

**Approach:** All-at-once replacement (3-4 weeks)

**Scope:**
- ✅ Replace 549 lines of Supabase card operations with InstantDB mutations
- ✅ Migrate all card CRUD, content updates, z-ordering, and complex operations
- ✅ Remove all Supabase dependencies (auth already migrated to Clerk)
- ⏳ Defer file storage migration (Cloudflare R2) to future phase
- ✅ Delete 16+ legacy Supabase files
- ✅ Maintain real-time sync, optimistic updates, and undo/redo (custom implementation)

**Key Files:** 3 new, ~10 modified, 16+ deleted

---

## Overview

Migrate the canvas and card system from the current hybrid architecture (InstantDB reads + Supabase writes) to a full InstantDB implementation. This will complete the transition started with the board hooks and provide real-time collaboration capabilities across all card operations.

## Current State Analysis

### What's Already Working
- ✅ InstantDB schema defined in `instant.schema.ts` (denormalized, all card fields on single entity)
- ✅ Permissions configured in `instant.perms.ts`
- ✅ Card reading via `useBoardCards` hook using `db.useQuery()`
- ✅ Clerk authentication integrated with InstantDB
- ✅ Real-time subscriptions active
- ✅ Board mutations pattern established in `lib/instant/board-mutations.ts`

### What Needs Migration
- ❌ All card write operations in `lib/data/cards-client.ts` (549 lines of Supabase code)
- ❌ File storage (currently Supabase Storage buckets: `board-images`, `board-files`)
- ❌ Canvas drop handlers that create cards
- ❌ Drag/resize handlers that update transforms
- ❌ Content update handlers (debounced TipTap saves, etc.)
- ❌ Z-ordering operations (bring to front, send to back)
- ❌ Complex operations (duplicate, column management, task lists)

## Architecture Decisions

### Schema Approach: Denormalized (Already Implemented)
InstantDB schema uses a single `cards` entity with all type-specific fields as optional properties. This differs from Supabase's normalized approach with separate tables per card type.

**Schema mapping required:**
```typescript
// Supabase format
{ card_type: 'note', note_cards: { content: '...', color: 'yellow' } }

// InstantDB format
{ card_type: 'note', note_content: '...', note_color: 'yellow' }
```

### Migration Strategy: All-at-Once ✅
- Replace all Supabase calls with InstantDB in a single implementation
- Faster completion (3-4 weeks)
- App is not in production, so risk is acceptable
- Comprehensive testing before declaring complete

**Rationale:** Since the app is still in development, we can move quickly without needing gradual rollout or feature flags.

### File Storage: Deferred to Later Phase ✅
- **Decision:** Implement file storage (Cloudflare R2) in a separate phase after canvas migration
- **Current Plan:** Focus on canvas and card operations first
- **Temporary Approach:** Keep basic file upload structure but defer actual implementation
- **Future Implementation:** Cloudflare R2 (S3-compatible, no egress fees, best cost/performance)

---

## Implementation Plan

### Phase 1: Refactor Canvas Store (Remove Card Duplication)

**Critical First Step:** Remove redundant card storage from Zustand before migrating to InstantDB.

**Files to Modify:**

1. **`lib/stores/canvas-store.ts`** (Major refactor - ~500 lines affected)
   - Remove `cards: Map<string, Card>` from state
   - Remove `loadCards()` action
   - Remove `addCard()`, `updateCard()`, `updateCardPosition()` actions
   - Remove all `state.cards.get()` and `state.cards.set()` operations
   - Keep only UI state: viewport, selection, interactions, dragPreview, optimisticCards, uploadingCards
   - Connections might stay (needs evaluation - are they UI state or data?)
   - Revise Zundo configuration to only track UI state

2. **`components/canvas/Canvas.tsx`**
   - Remove `loadCards` call (line 70)
   - Use `cards` directly from `useBoardCards` (already doing this at line 65)
   - Simplify card merging logic (lines 86-89)

3. **`lib/hooks/useKeyboardShortcuts.ts`**
   - Replace Zundo undo/redo with custom undo store
   - Cmd+Z / Ctrl+Z → triggers `undoStore.undo()`
   - Cmd+Shift+Z / Ctrl+Y → triggers `undoStore.redo()`
   - Show loading state during async undo operations

4. **All components/hooks that call canvas store card methods:**
   - Find and replace all `updateCard()` calls with direct state updates (temporary)
   - Will be replaced with InstantDB mutations in Phase 3

**Testing After This Phase:**
- Canvas should still render (getting cards from InstantDB)
- Selection, dragging, panning should still work (UI state preserved)
- Undo/redo might be broken (will fix after deciding approach)

---

### Phase 2: Core Infrastructure Setup

**New Files to Create:**

1. **`lib/instant/card-mutations.ts`** (~400 lines)
   - Complete mutation library for all card operations
   - Functions: createCard, updateTransform, updateContent, deleteCard, deleteCards, bringToFront, sendToBack, duplicateCard, updateColumnItems, updateTasks
   - Pattern: Use `db.transact([...])` with board timestamp updates
   - Schema conversion helpers (flatten nested type-specific data)
   - **Export pure functions** (no side effects) for undo/redo reuse

2. **`lib/instant/schema-helpers.ts`** (~100 lines)
   - Convert between Supabase nested format and InstantDB flat format
   - Type-safe conversion functions
   - Example: `flattenCardData()`, `nestCardData()`

3. **`lib/stores/undo-store.ts`** (~200 lines)
   - Custom undo/redo stack for card operations
   - Separate from Zundo (which handles UI state only)
   - Max history size: 50 actions (configurable)
   - Action types: card_move, card_resize, card_create, card_delete, card_content, card_reorder
   - Batch operation support for multi-select
   - Clear history on board change

**Files to Modify (Infrastructure):**

1. **`lib/instant/board-mutations.ts`**
   - Expand existing basic mutations with all card operation patterns
   - Ensure consistency with established InstantDB patterns

---

### Phase 3: Canvas CRUD Operations

**Operations:**
- Create card (all types)
- Update transform (position, size)
- Delete card (single and batch)

**Files to Modify:**

1. **`lib/hooks/useCanvasDrop.ts`**
   - Lines 353-365, 508-520: Card creation on drop
   - Replace `createCard()` calls with `cardMutations.createCard()`
   - Update file upload integration

2. **`lib/hooks/useDraggable.ts`**
   - Lines 420-450: Drag end handler
   - Replace `updateCardTransform()` with `cardMutations.updateTransform()`
   - Handle batch updates for multi-select

3. **`lib/hooks/useResizable.ts`**
   - Lines 164-174: Resize end handler
   - Replace with `cardMutations.resizeCard()`

4. **`lib/stores/canvas-store.ts`**
   - Lines 330-375: Delete operations
   - Lines 501: Line card creation
   - Update to use InstantDB mutations

**Key Implementation:**
```typescript
// Example: Create card
export async function createCard(params: CreateCardParams) {
  const cardId = id();
  const now = Date.now();

  await db.transact([
    db.tx.cards[cardId].update({
      board_id: params.boardId,
      card_type: params.cardType,
      position_x: params.x,
      position_y: params.y,
      width: params.width || 250,
      height: params.height,
      order_key: params.orderKey,
      // Type-specific fields
      ...convertTypeDataToInstant(params.cardType, params.typeData),
      created_at: now,
      updated_at: now,
    }),
    db.tx.boards[params.boardId].update({
      updated_at: now
    }),
  ]);

  return cardId;
}
```

---

### Phase 4: Content Updates

**Operations:**
- Update card content (all type-specific fields)
- Debounced editor updates

**Files to Modify:**

1. **All card components in `components/canvas/cards/`:**
   - `NoteCardComponent.tsx` (Line 46): TipTap content updates
   - `TextCardComponent.tsx`: Title/content updates
   - `ImageCardComponent.tsx`: Caption updates
   - `TaskListCardComponent.tsx`: Task array updates
   - `LinkCardComponent.tsx`: URL updates
   - `ColorPaletteCardComponent.tsx`: Color array updates
   - `ColumnCardComponent.tsx`: Title/settings updates

**Pattern:**
```typescript
const debouncedSave = useDebouncedCallback(
  async (content: string) => {
    await cardMutations.updateContent(card.id, card.board_id, 'note', {
      note_content: content
    });
  },
  1000
);
```

**Note:** Remove board ownership validation (InstantDB permissions handle this)

---

### Phase 5: Advanced Operations

**Operations:**
- Bring to front / Send to back (z-ordering via order_key)
- Duplicate card
- Restore card (undo/redo support)

**Files to Modify:**

1. **`lib/stores/canvas-store.ts`**
   - Lines 815-883: Z-ordering operations
   - Lines 889-913: Auto bring-to-front on interaction
   - Duplicate functionality

**Key Pattern - Batch Updates:**
```typescript
// Update Zustand immediately (optimistic)
updates.forEach((orderKey, cardId) => {
  const card = state.cards.get(cardId);
  if (card) {
    state.cards.set(cardId, { ...card, order_key: orderKey });
  }
});

// Sync to InstantDB (async)
const transactions = Array.from(updates.entries()).map(([cardId, orderKey]) =>
  db.tx.cards[cardId].update({ order_key: orderKey, updated_at: Date.now() })
);
transactions.push(db.tx.boards[boardId].update({ updated_at: Date.now() }));
await db.transact(transactions);
```

---

### Phase 6: Complex Operations

**Operations:**
- Column management (add/remove/reorder cards)
- Task list operations
- Line connections

**Files to Modify:**

1. **`lib/hooks/useDraggable.ts`**
   - Column add/remove logic during drag
   - Replace `addCardToColumn()` / `removeCardFromColumn()` calls

2. **Card components:**
   - Column reordering logic
   - Task list CRUD operations

**Simplification:**
InstantDB stores `column_items` as JSON array directly on card:
```typescript
// Single transaction instead of multiple queries
await db.transact([
  db.tx.cards[columnId].update({
    column_items: [...existingItems, { card_id, position }],
    updated_at: Date.now()
  }),
  db.tx.boards[boardId].update({ updated_at: Date.now() })
]);
```

---

### Phase 7: Cleanup & Supabase Removal

**Files to Delete (Canvas/Card Related):**
- ❌ `lib/data/cards-client.ts` (549 lines - all Supabase card operations)
- ❌ `lib/data/cards.ts` (server-side card operations)
- ❌ `lib/utils/normalize-zindexes.ts` (uses Supabase)
- ❌ `lib/hooks/supabase/use-realtime-presence-room.ts` (replaced by InstantDB presence)

**Files to Delete (Auth Related - Legacy):**
- ❌ `app/auth/confirm/route.ts` (Supabase auth confirmation)
- ❌ `app/login/actions.ts` (Supabase login)
- ❌ `components/forgot-password-form.tsx` (Supabase password reset)
- ❌ `components/change-password-form.tsx` (Supabase password change)
- ❌ `components/auth-buttons.tsx` (Supabase auth buttons)
- ❌ `app/auth/temp/page.tsx` (temporary auth page)
- ❌ `lib/hooks/supabase/use-current-user-image.ts` (replaced by Clerk)
- ❌ `lib/hooks/supabase/use-current-user-name.ts` (replaced by Clerk)

**Files to Delete (Infrastructure):**
- ❌ `lib/supabase/client.ts`
- ❌ `lib/supabase/server.ts`
- ❌ `lib/supabase/middleware.ts`

**Files to Review for Remaining Supabase Usage:**
- ⚠️ `lib/data/boards-client.ts` - May have Supabase calls to migrate
- ⚠️ `lib/data/boards.ts` - Server-side board operations
- ⚠️ `lib/contexts/auth-context.tsx` - Check if using Supabase auth
- ⚠️ `app/ui/home/sidebar.tsx` - Check for Supabase usage
- ⚠️ `app/ui/dashboard/board-settings-modal.tsx` - Check for Supabase usage
- ⚠️ `app/ui/dashboard/board-card.tsx` - Check for Supabase usage
- ⚠️ `app/ui/board/canvas.tsx` - Check for Supabase usage
- ⚠️ `components/canvas/cards/CardComponents.tsx` - Lines 1802, 1820, 1905 import Supabase

**Files to Modify:**
- `package.json`: Remove `@supabase/supabase-js` and `@supabase/ssr` dependencies
- `.env.local`: Remove Supabase environment variables
- `lib/types.ts`: Simplify card types (remove nested type-specific objects)

**Note:** File storage migration (avatar-storage.ts, useCanvasDrop.ts file uploads) will be handled in a separate future phase using Cloudflare R2.

---

## Critical Implementation Details

### 1. Optimistic Updates
Keep current manual pattern with Zustand:
```typescript
// 1. Add optimistic card to store (instant UI feedback)
addOptimisticCard(tempId, optimisticCard);

// 2. Create in InstantDB
const cardId = await cardMutations.createCard(...);

// 3. Confirm optimistic update
confirmOptimisticCard(tempId, realCard);
```

### 2. Undo/Redo Integration
No changes needed! Zundo continues to track Zustand state:
- User action → Update Zustand (tracked) → Sync to InstantDB
- Undo → Zustand reverts → Sync revert to InstantDB
- Redo → Zustand forward → Sync forward to InstantDB

### 3. Board Timestamp Updates
CRITICAL: Every card mutation MUST update board timestamp:
```typescript
await db.transact([
  db.tx.cards[cardId].update({ ... }),
  db.tx.boards[boardId].update({ updated_at: Date.now() }), // Required!
]);
```

### 4. Error Handling
InstantDB throws on error (different from Supabase):
```typescript
try {
  await db.transact([...]);
} catch (error) {
  // Rollback optimistic update
  revertOptimisticUpdate();
  toast.error('Failed to update card');
  throw error;
}
```

### 5. Real-Time Sync
Already working via `useBoardCards` hook! Mutations automatically trigger subscription updates across all connected clients.

---

## Testing Strategy

### Per-Phase Testing:
- [ ] Unit tests for all new mutation functions
- [ ] Integration tests for real-time sync
- [ ] Manual testing of each operation type
- [ ] Cross-browser testing
- [ ] Multi-client collaboration testing
- [ ] Performance benchmarking (100+ cards)
- [ ] Offline behavior testing

### Critical Test Cases:
1. Create each of 10 card types
2. Multi-select drag (5+ cards)
3. Rapid content editing (debounce)
4. Undo/redo stack (10+ operations)
5. Z-order edge cases
6. Column nested operations
7. File upload (images 5MB+)
8. Real-time sync (2+ clients)
9. Network interruption recovery
10. Concurrent edits conflict resolution

---

## Rollback Strategy

**All-at-Once Approach:**
- Git revert to commit before migration
- Supabase database still intact (not deleted)
- Can fall back if critical issues found during testing
- Recommended: Create git branch for migration work

---

## Success Criteria

Each phase complete when:
- [ ] All operations migrated
- [ ] All tests passing (unit + integration)
- [ ] Real-time sync working across multiple clients
- [ ] No error rate increase in monitoring
- [ ] Performance maintained or improved
- [ ] 7 days of stable production usage

---

## Timeline Estimate

**All-at-Once Approach:**
- Phase 1: Refactor canvas store (remove card duplication) - 2-3 days
- Phase 2: Infrastructure setup - 3-4 days
- Phase 3: Basic CRUD operations - 4-5 days
- Phase 4: Content updates - 3-4 days
- Phase 5: Advanced operations - 3-4 days
- Phase 6: Complex operations - 4-5 days
- Phase 7: Cleanup & testing - 3-4 days

**Total: 3.5-4.5 weeks** (1 developer full-time)

**Note:** File storage (Cloudflare R2) will be implemented in a separate future phase after canvas migration is complete and stable.

---

## Key Files Reference

### Files to Create (3):
1. `lib/instant/card-mutations.ts` - Core mutation library (~400 lines)
2. `lib/instant/schema-helpers.ts` - Format conversion utilities (~100 lines)
3. `lib/stores/undo-store.ts` - Custom undo/redo stack for card operations (~200 lines)

### Files to Modify (Core Canvas, ~10 files):
1. `lib/hooks/useCanvasDrop.ts` - Card creation (defer file upload implementation)
2. `lib/hooks/useDraggable.ts` - Transform updates + column ops
3. `lib/hooks/useResizable.ts` - Resize updates
4. `lib/stores/canvas-store.ts` - Delete, z-order, duplicate
5. `lib/instant/board-mutations.ts` - Expand existing mutations
6. `components/canvas/cards/NoteCardComponent.tsx` - Content updates
7. `components/canvas/cards/TaskListCardComponent.tsx` - Task ops
8. `components/canvas/cards/ColumnCardComponent.tsx` - Column ops
9. `components/canvas/cards/CardComponents.tsx` - Remove Supabase imports (lines 1802, 1820, 1905)
10. All other card components - Content updates

### Files to Review & Potentially Modify (~8 files):
1. `lib/data/boards-client.ts` - Check for Supabase board operations
2. `lib/data/boards.ts` - Server-side board operations
3. `lib/contexts/auth-context.tsx` - Verify no Supabase auth
4. `app/ui/home/sidebar.tsx` - Check for Supabase usage
5. `app/ui/dashboard/board-settings-modal.tsx` - Check for Supabase usage
6. `app/ui/dashboard/board-card.tsx` - Check for Supabase usage
7. `app/ui/board/canvas.tsx` - Check for Supabase usage
8. `lib/stores/canvas-store.ts` - Line 10 imports Supabase

### Files to Delete (~16 files):
**Canvas/Card Related (4):**
1. `lib/data/cards-client.ts` - All Supabase card operations (549 lines)
2. `lib/data/cards.ts` - Server-side card operations
3. `lib/utils/normalize-zindexes.ts` - Uses Supabase
4. `lib/hooks/supabase/use-realtime-presence-room.ts` - Replaced by InstantDB

**Auth Related - Legacy (6):**
5. `app/auth/confirm/route.ts`
6. `app/login/actions.ts`
7. `components/forgot-password-form.tsx`
8. `components/change-password-form.tsx`
9. `components/auth-buttons.tsx`
10. `app/auth/temp/page.tsx`

**Hooks - Legacy (2):**
11. `lib/hooks/supabase/use-current-user-image.ts`
12. `lib/hooks/supabase/use-current-user-name.ts`

**Infrastructure (3):**
13. `lib/supabase/client.ts`
14. `lib/supabase/server.ts`
15. `lib/supabase/middleware.ts`

**Potentially Delete (1):**
16. `lib/hooks/supabase/` directory (if empty after deletions)

---

## Decisions Made ✅

1. **Migration Strategy:** All-at-once (app not in production, can move fast)
2. **File Storage:** Deferred to future phase (will use Cloudflare R2 when implemented)
3. **Timeline:** No hard deadline, get it done correctly
4. **Supabase Removal:** Complete removal - all auth/RPC/edge functions migrated to InstantDB + Clerk
5. **Rollback:** Git revert if needed (development environment)
6. **Undo/Redo:** Custom undo stack (Option B) - Better UX, maintain parity with Milanote

---

## Implementation Order

**Recommended sequence:**
1. Create git branch for migration work
2. **Phase 1:** Refactor canvas store (remove redundant card storage)
3. **Phase 2:** Build infrastructure (`card-mutations.ts`, `schema-helpers.ts`)
4. **Phase 3:** Migrate basic CRUD (create, update transform, delete)
5. **Phase 4:** Migrate content updates (all card components)
6. **Phase 5:** Migrate advanced operations (z-order, duplicate)
7. **Phase 6:** Migrate complex operations (columns, tasks)
8. **Phase 7:** Delete all Supabase files and dependencies
9. Test thoroughly with real usage scenarios
10. Merge to main branch

---

## Architectural Simplifications

### 1. Remove Redundant Card Storage from Zustand ⚠️ IMPORTANT
**Current Problem:** Cards are stored in two places:
- InstantDB (source of truth, real-time subscriptions via `useBoardCards`)
- Zustand store (`cards: Map<string, Card>`)

**Why This Is Redundant:**
- `useBoardCards` already provides real-time card data
- Zustand store duplicates all card state unnecessarily
- Canvas component merges InstantDB cards with optimistic cards (line 86-89)

**Solution:** Refactor canvas store to remove card storage

**What to Keep in Zustand:**
- ✅ UI state: `viewport`, `selectedCardIds`, `editingCardId`, `isDragging`, `isPanning`, etc.
- ✅ Transient state: `dragPreview`, `uploadingCards`, `optimisticCards`, `selectionBox`
- ✅ Connections (line cards stored in DB, but connection drawing state is UI-only)
- ✅ Undo/redo (but only for UI state, not card data)

**What to Remove from Zustand:**
- ❌ `cards: Map<string, Card>` - Get from `useBoardCards` instead
- ❌ `loadCards()` - No longer needed
- ❌ `addCard()` - Use InstantDB mutations directly
- ❌ `updateCard()` - Use InstantDB mutations directly
- ❌ All card CRUD operations that touch `state.cards`

**New Pattern:**
```typescript
// Canvas component
const { cards, isLoading } = useBoardCards(boardId); // From InstantDB
const { optimisticCards, uploadingCards } = useCanvasStore(); // UI state only

// Merge for rendering
const allCards = [...cards, ...optimisticCards.map(o => o.card)];
```

**Impact on Undo/Redo: ✅ Custom Undo Stack (Better UX)**

**Decision:** Implement custom undo/redo stack for card operations to maintain professional UX.

**Implementation Strategy:**

1. **Create `lib/stores/undo-store.ts`** - Separate Zustand store for undo/redo
   ```typescript
   interface UndoAction {
     type: 'card_move' | 'card_resize' | 'card_create' | 'card_delete' | 'card_content';
     timestamp: number;
     do: () => Promise<void>;      // Forward action
     undo: () => Promise<void>;    // Reverse action
     description: string;           // For debugging
   }

   interface UndoState {
     undoStack: UndoAction[];
     redoStack: UndoAction[];
     maxHistorySize: number;  // Default: 50
     undo: () => Promise<void>;
     redo: () => Promise<void>;
     addAction: (action: UndoAction) => void;
     clear: () => void;
   }
   ```

2. **Wrap all card mutations** with undo action recording:
   ```typescript
   // Example: Move card
   const moveCard = async (cardId, newPos, oldPos) => {
     await cardMutations.updateTransform(cardId, boardId, newPos);

     addUndoAction({
       type: 'card_move',
       do: () => cardMutations.updateTransform(cardId, boardId, newPos),
       undo: () => cardMutations.updateTransform(cardId, boardId, oldPos),
       description: `Move card ${cardId}`
     });
   };
   ```

3. **Batch operations** for multi-select:
   ```typescript
   // Move multiple cards as single undo action
   addUndoAction({
     type: 'card_move',
     do: () => Promise.all(cards.map(c => cardMutations.updateTransform(...))),
     undo: () => Promise.all(cards.map(c => cardMutations.updateTransform(...))),
     description: `Move ${cards.length} cards`
   });
   ```

4. **Debounced content edits** get single undo entry:
   ```typescript
   // TipTap editor - only add undo when save happens
   const debouncedSave = useDebouncedCallback(async (newContent, oldContent) => {
     await cardMutations.updateContent(...);
     addUndoAction({
       type: 'card_content',
       do: () => cardMutations.updateContent(cardId, boardId, 'note', { note_content: newContent }),
       undo: () => cardMutations.updateContent(cardId, boardId, 'note', { note_content: oldContent }),
       description: 'Edit note content'
     });
   }, 1000);
   ```

**UI State Undo (Keep Zundo):**
- Keep Zundo for viewport changes (zoom, pan)
- Separate from card operation undo
- Cmd+Z triggers card undo, not viewport undo (or use different key combo)

**Files Requiring Major Refactor:**
- `lib/stores/canvas-store.ts` - Remove card storage, keep UI state only
- **NEW: `lib/stores/undo-store.ts`** - Custom undo/redo stack (~200 lines)
- All hooks that call mutations - Wrap with undo action recording
- `lib/hooks/useKeyboardShortcuts.ts` - Hook into custom undo store
- `lib/instant/card-mutations.ts` - Export reusable mutation functions for undo/redo

### 2. File Storage Temporary Solution
Since file upload is being deferred:
- Keep `useCanvasDrop` file upload logic in place for now
- May temporarily keep Supabase Storage dependencies
- Or stub out file uploads until Cloudflare R2 implementation
- Decision: Recommend stubbing out for now, implement properly with R2 later

### 3. Real-time Collaboration
InstantDB provides this out of the box via:
- `useBoardCards` hook already subscribed to card changes
- Mutations trigger automatic updates to all connected clients
- No additional work needed beyond implementing mutations

### 4. Type System Simplification
Current types have nested structures (e.g., `note_cards: { content, color }`). After migration, flatten to match InstantDB schema (`note_content`, `note_color`). This will:
- Simplify type definitions in `lib/types.ts`
- Match database schema 1:1
- Reduce conversion overhead

---

*This plan provides a comprehensive, battle-tested approach to migrating from Supabase to InstantDB while maintaining system stability, real-time capabilities, and the ability to rollback if needed.*
