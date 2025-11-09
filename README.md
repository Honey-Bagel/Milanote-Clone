# Milanote Clone

A full-stack collaborative note-taking and creative organization app inspired by Milanote — featuring an infinite canvas, boards within boards, and real-time collaboration. Built with **Next.js 14**, **Supabase**, and **TypeScript**.

*If you are looking for the Clone using MERN, that has been replaced with this new version. The MERN Clone files can be found [here](https://github.com/Honey-Bagel/Milanote-Clone/tree/e95bd53e48f333e46c4129850e4f8f3e5ee71c9a)*

![Next.js](https://img.shields.io/badge/next.js-14.2.0-black.svg)
![Supabase](https://img.shields.io/badge/supabase-live-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5-blue.svg)

---

## Overview

This new version of Milanote Clone represents a complete rebuild from the original MERN stack version.  
It now runs entirely on **Next.js** with **Supabase** as the backend — providing authentication, database, storage, and realtime updates in one unified platform.

The app allows users to freely create and arrange notes, boards, and images on an infinite canvas — a digital workspace designed for creative organization, mood-boarding, and brainstorming.

---

## Key Features

### Core Functionality
- **Infinite Canvas Workspace**: Built from scratch using React and CSS transforms (`matrix3d`), enabling freeform drag, zoom, and pan.
- **Boards Within Boards**: Recursive structure that allows infinite nesting of ideas.
- **Card System**:
  - Notes with editable text
  - Boards for sub-canvases
  - Future: Image and media cards (via Supabase Storage)
- **Realtime Collaboration** *(planned)*:
  - Live cursor tracking and state sync through Supabase Realtime
  - Multi-user board editing
- **Authentication**: Supabase Auth with email and OAuth provider support
- **Persistent Data**: Cards and boards stored in Supabase Postgres tables
- **Settings Panel**: Basic workspace settings with expandable options

### Technical Features
- **Next.js App Router**: Server components and edge-optimized routing
- **Supabase Backend**: Unified backend for Auth, DB, and Realtime
- **Zustand State Store**: Local state management for canvas interactions
- **ShadCN UI + Tailwind CSS**: Clean, minimal UI with composable components
- **TypeScript-Strict Codebase**: Strongly typed, modular, and scalable

---

## Tech Stack

### Frontend
- **Next.js 14** – React framework with App Router and Server Components  
- **TypeScript** – Static typing for reliability and clarity  
- **Zustand** – Lightweight state management  
- **Tailwind CSS** – Utility-first styling  
- **ShadCN UI** – Consistent, accessible UI primitives  
- **Lucide Icons** – Clean SVG icons  

### Backend (via Supabase)
- **PostgreSQL** – Scalable relational database  
- **Auth** – User authentication and session handling  
- **Realtime** – Subscription-based updates for live collaboration  
- **Storage** – Secure image and asset uploads  
- **Edge Functions** – Custom backend logic (future integration)

---

## Architecture

### Data Schema (Simplified)
```
User
├── id (uuid)
├── email
├── username
└── created_at

Board
├── id (uuid)
├── title
├── owner_id (ref: User)
├── parent_id (nullable, ref: Board)
└── position {x, y}

Card
├── id (uuid)
├── type (enum: "note" | "board" | "image")
├── board_id (ref: Board)
├── content (jsonb)
├── position {x, y}
└── created_at
```

### Core Components
- **Canvas**: Manages all drag/zoom interactions
- **CanvasElement**: Wrapper for each interactive card
- **CardRenderer**: Dynamically renders cards based on type
- **Element Toolbar**: Quick actions for adding new cards or boards
- **Top Toolbar**: Access to global settings and workspace info

### Supabase Integration
- `lib/supabase/client.ts`: Configures client instance
- `lib/data/cards.ts`: CRUD operations for cards
- `lib/stores/canvas-store.ts`: Local canvas state synced with server data

---

## Project Structure

```
milanote-clone/
├── app/
│   ├── ui/board/           # Canvas and toolbar interfaces
│   └── layout.tsx          # Next.js layout components
├── components/
│   ├── canvas/             # Canvas + card rendering system
│   └── ui/                 # Reusable UI components (toolbars, modals)
├── lib/
│   ├── data/               # Supabase CRUD helpers
│   ├── stores/             # Zustand stores for state management
│   ├── supabase/           # Supabase client config
│   └── types.ts            # Shared TypeScript types
├── public/                 # Static assets
├── styles/                 # Tailwind global styles
└── README.md
```

---

## Usage

### Creating Cards
1. Use the **Add Note** or **Add Board** button in the toolbar  
2. Drop the card anywhere on the canvas  
3. Double-click to edit or rename  

### Navigating Boards
1. Double-click a board card to open it  
2. Use breadcrumbs or the top toolbar to go back  

### Settings
- Access via the **Settings** icon in the top toolbar  
- Modify workspace settings (theme, behavior, etc.)  

### Future Collaboration
- When realtime is enabled, multiple users will see live updates instantly through Supabase channels  

---

## Key Technical Decisions

### Why Supabase?
- Provides full backend services (Auth, DB, Realtime, Storage) without managing servers  
- Simplifies architecture and improves scalability  
- Fits naturally with Next.js edge functions and static ISR

### Why Next.js 14?
- Unified frontend + backend code in one environment  
- React Server Components improve performance and developer experience  
- Simplifies deployment to Vercel or similar edge platforms

### Why Zustand?
- Lightweight and minimal boilerplate for canvas state  
- Simpler than Redux for real-time, event-driven UI

---

## Known Issues & Future Improvements

### Current Limitations
- Realtime sync not yet active (planned for next release)  
- Image cards pending Supabase Storage integration  
- No undo/redo functionality yet  
- Mobile UX still in progress

### Roadmap
- [ ] Supabase Realtime sync for live collaboration  
- [ ] Image uploads and file attachments  
- [ ] Text formatting and color palettes  
- [ ] Export boards as PNG or PDF  
- [ ] Offline caching and persistence  
- [ ] Comments and reactions  

---

## Acknowledgments

- Inspired by [Milanote](https://milanote.com)
