# Milanote Clone

A full-stack collaborative note-taking and creative organization app inspired by Milanote — featuring an infinite canvas, boards within boards, and real-time collaboration. Built with **Next.js 16**, **InstantDB**, **Clerk**, and **TypeScript**.

*If you are looking for the Clone using MERN, that has been replaced with this new version. The MERN Clone files can be found [here](https://github.com/Honey-Bagel/Milanote-Clone/tree/e95bd53e48f333e46c4129850e4f8f3e5ee71c9a)*

![Next.js](https://img.shields.io/badge/next.js-16.0.1-black.svg)
![InstantDB](https://img.shields.io/badge/instantdb-0.22.75-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5-blue.svg)

---

## Overview

This version of Milanote Clone represents a complete rebuild from the original MERN stack version.
It now runs on **Next.js 16** with **InstantDB** as the backend — providing a graph database with real-time sync, collaboration, and type-safe queries. Authentication is handled by **Clerk**, offering a modern, secure auth experience.

The app allows users to freely create and arrange multiple card types (notes, images, task lists, links, files, color palettes, columns, boards, and lines) on an infinite canvas — a digital workspace designed for creative organization, mood-boarding, and brainstorming.

---

## Key Features

### Core Functionality
- **Infinite Canvas Workspace**: Built from scratch using React and CSS transforms (`matrix3d`), enabling freeform drag, zoom, and pan.
- **Boards Within Boards**: Recursive structure that allows infinite nesting of ideas with parent-child relationships.
- **Rich Card System**:
  - **Note Cards**: Rich text editing with TipTap (formatting, links, highlights)
  - **Image Cards**: Upload and display images with captions
  - **Task List Cards**: Checkable to-do items
  - **Link Cards**: Embedded links with favicons
  - **File Cards**: Document attachments with metadata
  - **Color Palette Cards**: Color swatches for design work
  - **Column Cards**: Container cards for organizing other cards
  - **Board Cards**: Linked boards for nested workspaces
  - **Line Cards**: Connectors between cards with attachment points
- **Real-time Collaboration**:
  - Live cursor tracking and presence via InstantDB Rooms API
  - Multi-user board editing with instant sync
  - Real-time state updates across all connected clients
- **Authentication**: Clerk authentication with email, OAuth, and social providers
- **Persistent Data**: Graph database with auto-generated TypeScript types from schema
- **Board Sharing**: Public/private boards with share tokens and role-based access (owner/editor/viewer)
- **Advanced Canvas Operations**:
  - Card alignment (top, bottom, left, right)
  - Z-ordering with fractional indexing
  - Card duplication with smart positioning
  - Undo/redo support with Zundo

### Technical Features
- **Next.js App Router**: Server components and edge-optimized routing
- **InstantDB Backend**: Graph database with real-time sync and type-safe queries
- **Auto-generated Types**: TypeScript types automatically generated from [instant.schema.ts](instant.schema.ts)
- **Clerk Authentication**: Modern auth with seamless InstantDB sync
- **Zustand State Store**: Local state management with undo/redo capabilities
- **ShadCN UI + Tailwind CSS**: Clean, minimal UI with composable components
- **TypeScript-Strict Codebase**: Strongly typed, modular, and scalable
- **TipTap Editor**: Rich text editing for note cards
- **Konva Canvas**: Advanced rendering for complex canvas elements

---

## Tech Stack

### Frontend
- **Next.js 16** – React framework with App Router and Server Components
- **TypeScript** – Static typing for reliability and clarity
- **Zustand** – Lightweight state management with undo/redo (Zundo)
- **Tailwind CSS** – Utility-first styling
- **ShadCN UI** – Consistent, accessible UI primitives
- **Lucide Icons** – Clean SVG icons
- **TipTap** – Headless rich text editor for note cards
- **Konva** – Canvas library for advanced rendering
- **React Konva** – React bindings for Konva

### Backend
- **InstantDB** – Graph database with real-time sync and type-safe queries
- **Clerk** – Modern authentication and user management
- **InstantDB Rooms API** – Real-time presence and collaboration
- **Auto-generated Types** – TypeScript types from schema definitions

---

## Architecture

### Data Schema (Graph Database)

The schema is defined in [instant.schema.ts](instant.schema.ts) and includes:

```
$users (System entity)
├── email (unique, indexed)

profiles
├── display_name
├── avatar_url
├── favorite_boards
├── created_at
└── last_active

boards
├── title
├── color
├── parent_board_id (ref: Board)
├── is_public
├── share_token
├── created_at
└── updated_at

board_collaborators (Junction table)
├── role (owner|editor|viewer)
├── created_at
└── updated_at

cards
├── card_type (note|image|task_list|link|file|color_palette|column|board|line)
├── Position: position_x, position_y, width, height, order_key
├── Type-specific fields:
│   ├── note_content, note_color
│   ├── image_url, image_caption
│   ├── tasks[]
│   ├── line_start_x/y, line_end_x/y, attachments
│   └── ... (and more)
├── created_by
├── created_at
└── updated_at
```

**Relationships:**
- `userProfile` - 1:1 between $users and profiles
- `userBoards` - 1:many boards per user (cascade delete)
- `boardParent` - Recursive board hierarchy
- `boardCollaborators` - Many-to-many via junction table
- `boardCards` - 1:many cards per board (cascade delete)

**Permissions:**
Fine-grained access control defined in [instant.perms.ts](instant.perms.ts) with role-based permissions (owner/editor/viewer).

### Core Components
- **Canvas**: Manages all drag/zoom/pan interactions with infinite canvas
- **CanvasElement**: Wrapper for each interactive card with selection/resize
- **CardRenderer**: Dynamically renders cards based on type
- **Element Toolbar**: Quick actions for adding new cards
- **Top Toolbar**: Navigation, settings, and workspace controls
- **Card Components**: Specialized renderers for each card type (note, image, task list, etc.)

### InstantDB Integration
- [lib/instant/db.ts](lib/instant/db.ts): InstantDB initialization with Clerk token auth
- [lib/db/client.ts](lib/db/client.ts): Transaction wrapper utilities (`createEntity`, `updateEntity`, `withBoardUpdate`, etc.)
- [lib/instant/card-mutations.ts](lib/instant/card-mutations.ts): High-level card operations
- [lib/services/board-service.ts](lib/services/board-service.ts): Board CRUD and sharing logic
- [lib/services/card-service.ts](lib/services/card-service.ts): Card CRUD with validation
- [lib/hooks/instant.ts](lib/hooks/instant.ts): Custom hooks for querying InstantDB
- [components/auth/InstantDBAuthSync.tsx](components/auth/InstantDBAuthSync.tsx): Syncs Clerk auth with InstantDB

---

## Project Structure

```
milanote-next/
├── app/
│   ├── (auth)/             # Authentication routes (sign-in, sign-up)
│   ├── (main)/             # Main application routes
│   │   ├── boards/         # Board viewing and editing
│   │   └── dashboard/      # User dashboard
│   └── layout.tsx          # Root layout with providers
├── components/
│   ├── auth/               # Auth sync components (Clerk ↔ InstantDB)
│   ├── canvas/             # Canvas system and card rendering
│   ├── cards/              # Card type components (note, image, task list, etc.)
│   ├── toolbars/           # Element toolbar and top toolbar
│   └── ui/                 # ShadCN UI components
├── lib/
│   ├── instant/            # InstantDB setup and mutations
│   │   ├── db.ts           # Database initialization
│   │   ├── card-mutations.ts  # Card operations
│   │   ├── board-mutations.ts # Board operations
│   │   └── server-queries.ts  # Server-side queries
│   ├── db/
│   │   └── client.ts       # Transaction wrapper utilities
│   ├── services/           # Business logic layer
│   │   ├── board-service.ts   # Board CRUD and sharing
│   │   └── card-service.ts    # Card CRUD with validation
│   ├── hooks/              # React hooks for queries and state
│   │   ├── instant/        # InstantDB-specific hooks
│   │   ├── boards/         # Board query hooks
│   │   └── cards/          # Card query hooks
│   ├── stores/             # Zustand stores
│   └── types.ts            # Shared TypeScript types
├── instant.schema.ts       # InstantDB schema definition
├── instant.perms.ts        # Permission rules
├── public/                 # Static assets
└── README.md
```

---

## Usage

### Creating Cards
1. Use the toolbar buttons to select a card type (note, image, task list, link, etc.)
2. Click on the canvas to place the card
3. Double-click or select to edit content

### Navigating Boards
1. Double-click a board card to open the nested board
2. Use breadcrumbs in the top toolbar to navigate back
3. Use the dashboard to view all your boards

### Board Sharing & Collaboration
1. Click the share button on a board
2. Toggle public/private and copy share link
3. Add collaborators with specific roles (owner/editor/viewer)
4. See live presence of other users on the board

### Canvas Operations
- **Pan**: Click and drag on empty canvas space
- **Zoom**: Use mouse wheel or pinch gesture
- **Select Multiple**: Shift+click or drag selection box
- **Align Cards**: Select multiple cards and use alignment tools
- **Duplicate**: Select cards and use duplicate action
- **Undo/Redo**: Ctrl+Z / Ctrl+Y

### Real-time Collaboration
- Multiple users can edit the same board simultaneously
- See live cursor positions and presence indicators
- Changes sync instantly across all connected clients  

---

## Key Technical Decisions

### Why InstantDB?
- **Type-safe queries**: Auto-generated TypeScript types from schema
- **Built-in real-time**: Native sync and presence without additional setup
- **Graph database**: Natural relationships and nested queries
- **Optimistic updates**: Instant UI feedback with automatic conflict resolution
- **Simple auth integration**: Works seamlessly with Clerk ID tokens

### Why Clerk?
- **Modern auth experience**: Beautiful UI and developer-friendly API
- **Multiple providers**: Email, Google, GitHub, and more out of the box
- **User management**: Built-in user profiles and session handling
- **Easy integration**: First-class Next.js support

### Why Next.js 16?
- **Unified full-stack**: Frontend + backend in one codebase
- **React Server Components**: Improved performance and SEO
- **Edge-ready**: Optimized for Vercel and edge deployment
- **App Router**: Modern routing with layouts and nested routes

### Why Zustand?
- **Lightweight**: Minimal boilerplate for canvas state management
- **Undo/Redo**: Native integration with Zundo for time-travel
- **Performance**: Fine-grained subscriptions prevent unnecessary re-renders

---

## Known Issues & Future Improvements

### Current Status
- ✅ Real-time sync and collaboration working
- ✅ Multiple card types implemented (note, image, task list, link, file, etc.)
- ✅ Undo/redo functionality
- ✅ Board sharing with role-based access
- ✅ Rich text editing for notes
- ⚠️ Mobile UX still needs optimization
- ⚠️ Some advanced features in testing phase

### Roadmap
- [ ] Mobile-responsive canvas controls
- [ ] Board templates and starter packs
- [ ] Export boards as PNG or PDF
- [ ] Comments and reactions on cards
- [ ] @mentions and notifications
- [ ] Advanced search and filtering
- [ ] Keyboard shortcuts panel
- [ ] Dark mode support
- [ ] Board versioning and history
- [ ] API for third-party integrations  

---

## Acknowledgments

- Inspired by [Milanote](https://milanote.com)
