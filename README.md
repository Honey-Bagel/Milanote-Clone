# Notera

A full-stack collaborative visual workspace — featuring an infinite canvas, boards within boards, real-time collaboration, and a rich card system for creative organization. Built with **Next.js**, **InstantDB**, **Clerk**, and **TypeScript**.

*Previously known as "Milanote Clone". The original MERN version can be found [here](https://github.com/Honey-Bagel/Milanote-Clone/tree/e95bd53e48f333e46c4129850e4f8f3e5ee71c9a).*

![Next.js](https://img.shields.io/badge/next.js-16-black.svg)
![InstantDB](https://img.shields.io/badge/instantdb-0.22.118-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5-blue.svg)
![Stripe](https://img.shields.io/badge/stripe-integrated-635bff.svg)

---

## Overview

Notera is a complete rebuild from the ground up. It runs on **Next.js** with **InstantDB** as the real-time graph database, **Clerk** for authentication, and **Stripe** for billing. The app provides a digital workspace where users can freely arrange cards, nest boards, collaborate live, and organize creative projects visually.

---

## Features

### Canvas & Cards
- **Infinite Canvas**: Built from scratch with React and CSS `matrix3d` transforms — freeform drag, pan, and zoom with pinch gesture support
- **Boards Within Boards**: Recursive board hierarchy with parent-child navigation and breadcrumb trail
- **12+ Card Types**:
    - **Note** — Rich text editing via TipTap (formatting, highlights, links)
    - **Image** — Upload with caption and alt text support
    - **Task List** — Checkbox items with reorderable rows
    - **Link** — Embedded previews with favicons
    - **File** — Document attachments with metadata
    - **Color Palette** — Design swatch collections
    - **Column** — Container card for grouping other cards
    - **Board** — Nested board references for infinite depth
    - **Line** — Connectors between cards with bezier curves and attachment points
    - **Drawing** — Freehand sketch strokes via `perfect-freehand`
    - **Presentation Node** — Slideshow step markers
    - **Text** — Lightweight plain text label

### Real-time Collaboration
- Live cursor tracking and presence via InstantDB Rooms API
- Collaborator color indicators (20 vibrant preset colors per user)
- Selected-card outlines showing what each collaborator is editing
- Stacked colored borders when multiple users select the same card
- Multi-user board editing with instant sync across all clients

### Board Management
- Public/private boards with shareable tokens and QR codes
- Role-based collaborator access: **owner**, **editor**, **viewer**
- Board customization: title, color, background color, and icon
- Favorite boards, board duplication, and activity tracking
- Recursive board hierarchy with breadcrumb navigation

### Canvas Operations
- Multi-select with drag selection box
- Card alignment (top, bottom, left, right, center)
- Z-ordering via fractional indexing
- Duplication with smart positioning
- Undo/redo with full history (Zundo)
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, etc.)
- Optional grid snapping

### Billing & Subscriptions
- Freemium model: **Free**, **Standard**, **Pro** tiers
- Stripe integration (monthly & yearly billing)
- Subscription management: upgrade, downgrade, cancel
- Storage quotas with usage tracking and reservation system
- Payment method management, invoice viewing, and Stripe customer portal
- Pending tier changes (downgrade at end of billing period)

### Feature Requests
- Public voting board for feature suggestions at `/feature-requests`
- User submission with categories (Feature, Improvement, Bug Fix, Integration)
- Rate limiting: 1 submission per 24 hours per user
- Admin approval workflow: **Pending → Approved → In Progress → Completed**
- Admin panel at `/admin/feature-requests` (requires `is_admin` flag)

### Integrations
- **Google Drive** — Browse and import documents and folders directly into Notera
- **Pinterest** — Save pins and boards
- **Cloudflare R2** — File storage with pre-signed upload URLs
- **Resend** — Transactional email notifications
- **PostHog** — Product analytics

### User Profiles & Preferences
- Avatar upload with crop tool
- User preferences: autosave, grid snap, notifications, collaboration settings
- Referral program with tracking and rewards
- Account deletion with 30-day grace period and restore flow

---

## Tech Stack

### Frontend
- **Next.js 16** — App Router, Server Components, edge-optimized routing
- **React 19** — Latest with concurrent features
- **TypeScript** — Strict mode throughout
- **Tailwind CSS 4** — Utility-first styling
- **ShadCN UI + Radix UI** — Accessible, composable component primitives
- **Zustand** — Canvas state management with Immer + devtools
- **Zundo** — Undo/redo time-travel middleware for Zustand
- **TipTap 3** — Headless rich text editor for note cards
- **@dnd-kit** — Drag-and-drop for canvas and reorderable lists
- **Perfect Freehand** — Smooth freehand drawing strokes
- **Lucide Icons** — SVG icon set

### Backend & Database
- **InstantDB 0.22** — Real-time graph database with type-safe queries and Rooms API
- **Clerk 6** — Authentication (email, OAuth, social providers) with webhook sync
- **Upstash Redis** — Rate limiting and caching
- **Next.js API Routes** — 42 server-side endpoints

### Payments & Storage
- **Stripe** — Subscriptions, invoices, payment methods, webhooks
- **Cloudflare R2** — S3-compatible object storage for files and images

### Utilities
- **Fractional Indexing** — Insert-anywhere card ordering
- **Nanoid** — ID generation
- **Date-fns** — Date utilities
- **Sonner** — Toast notifications
- **QRCode** — Board share QR generation
- **React Easy Crop** — Avatar and image crop tool
- **Modern Screenshot** — Board thumbnail snapshots

---

## Architecture

### Data Schema

Defined in [instant.schema.ts](instant.schema.ts):

```
$users (Clerk-managed)
profiles          → display_name, avatar_url, subscription_tier, storage_bytes_used, is_admin
user_preferences  → gridSnapEnabled, autoSaveEnabled, emailNotifications, showPresenceIndicators
boards            → title, color, background_color, icon, parent_board_id, is_public, share_token
board_collaborators (role: owner|editor|viewer)
cards             → card_type, position_x/y, width, height, order_key + type-specific fields
linked_accounts   → OAuth tokens (Google Drive, Pinterest) with encryption
templates         → name, category, template_data (JSON), is_public, is_featured
activity_log      → actor_id, board_id, action, metadata
notifications     → recipient_id, notification_type, is_read, aggregated summaries
feature_requests  → title, description, category, status, vote_count
feature_votes     → user → feature_request link
referrals         → code, referral_attributions, referral_rewards
stripe_webhook_events, clerk_webhook_events (idempotency tracking)
```

**Rooms (Real-time Presence):**
`board.presence` → `{ color, name, image, selectedCardIds, cursorX, cursorY }`

### Permissions

Fine-grained rules in [instant.perms.ts](instant.perms.ts):
- **Boards** — Public or owner/collaborator access; hidden if owner deleted
- **Cards** — View if board is accessible; edit/delete for owner and editor roles
- **Profiles** — Own profile only; billing fields strictly owner-only
- **Templates** — Public read; admin-only write
- **Notifications** — Users see only their own
- **Webhooks** — Server-only, no client access

### Key Patterns

- **InteractionMode** state machine: `idle → selecting | dragging | resizing | editing | connecting | panning | drawing | presentation_basic | presentation_playing`
- **CardService** namespace with individual exports for backward compatibility
- **Barrel re-exports** for large file splits without updating 30+ consumers
- **Webhook idempotency** via event ID tracking to prevent duplicate processing
- **Storage reservation** to prevent TOCTOU race conditions on file uploads

---

## Project Structure

```
Notera/
├── app/
│   ├── admin/                    # Admin pages (templates, feature requests)
│   ├── api/                      # 42 API routes
│   │   ├── billing/              # Stripe (checkout, subscription, invoices, portal)
│   │   ├── upload/               # R2 presigned URLs
│   │   ├── import/               # Google Drive import
│   │   ├── oauth/                # OAuth flows (Google Drive, Pinterest)
│   │   ├── webhooks/             # Stripe & Clerk webhook handlers
│   │   ├── cron/                 # Background jobs (deletion, cleanup)
│   │   └── ...
│   ├── auth/                     # Sign-in, sign-up pages
│   ├── board/                    # Board canvas ([id] + public/[token])
│   ├── dashboard/                # User dashboard with board list
│   ├── feature-requests/         # Public feature voting board
│   ├── pricing/                  # Pricing page
│   ├── sandbox/                  # Demo/sandbox mode
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── canvas/                   # Canvas + all card renderers (30+ files)
│   ├── billing/                  # Pricing cards, subscription modals
│   ├── feature-requests/         # Feature submission and voting UI
│   ├── landing/                  # Landing page sections
│   ├── onboarding/               # Tour and onboarding flow
│   ├── templates/                # Template browser
│   ├── presentation/             # Presentation mode overlay
│   └── ui/                       # ShadCN components
│
├── lib/
│   ├── instant/                  # InstantDB setup (db.ts, adminDb.ts, mutations)
│   ├── services/                 # Business logic (28 files, card/ split into 13)
│   ├── hooks/                    # React hooks (11 directories)
│   ├── stores/                   # Zustand stores (canvas/ split into 4 files)
│   ├── utils/                    # Canvas transforms, ordering, drawing, logger
│   ├── billing/                  # Stripe utilities
│   ├── email/                    # Resend email templates
│   └── types/                    # Shared TypeScript types
│
├── instant.schema.ts             # InstantDB schema
├── instant.perms.ts              # Permission rules
├── vercel.json                   # Cron job configuration
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- InstantDB app ([instantdb.com](https://instantdb.com))
- Clerk app ([clerk.com](https://clerk.com))
- Stripe account ([stripe.com](https://stripe.com))
- Cloudflare R2 bucket
- Upstash Redis database

### Installation

```bash
git clone https://github.com/Honey-Bagel/Notera.git
cd Notera
pnpm install
```

### Environment Variables

Create `.env.local` with the following:

```env
# InstantDB
NEXT_PUBLIC_INSTANT_APP_ID=
INSTANT_ADMIN_TOKEN=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY_V1=
INTEGRATION_ENCRYPTION_KEY_VERSION=v1

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_STANDARD_YEARLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Google Drive Integration (optional)
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=

# Pinterest Integration (optional)
NEXT_PUBLIC_PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
pnpm start
```

---

## Usage

### Creating Cards
1. Use the toolbar to select a card type
2. Click on the canvas to place it
3. Double-click to edit content

### Navigating Boards
1. Double-click a board card to open the nested board
2. Use the breadcrumb trail to navigate back up
3. Use the dashboard to view all your boards

### Board Sharing & Collaboration
1. Click the share button on a board
2. Toggle public/private and copy the share link or QR code
3. Add collaborators by email with specific roles
4. See live cursors and card selections from other collaborators

### Canvas Operations
- **Pan**: Click and drag on empty canvas space
- **Zoom**: Mouse wheel or pinch gesture
- **Multi-select**: Shift+click or drag a selection box
- **Align**: Select multiple cards, use alignment tools in the toolbar
- **Duplicate**: Select cards and use the duplicate action
- **Undo/Redo**: `Ctrl+Z` / `Ctrl+Y`
- **Delete**: `Delete` or `Backspace`

---

## Current Status

| Area | Status |
|---|---|
| Real-time sync and collaboration | ✅ |
| All 12+ card types | ✅ |
| Undo/redo | ✅ |
| Board sharing and roles | ✅ |
| Rich text editing | ✅ |
| Stripe billing | ✅ |
| Feature request system | ✅ |
| Google Drive integration | ✅ |
| Referral system | ✅ |
| Admin templates | ✅ |
| Mobile canvas UX | ⚠️ Needs work |

### Roadmap
- [ ] Mobile-responsive canvas controls
- [ ] Export boards as PNG or PDF
- [ ] Comments and reactions on cards
- [ ] Advanced board search and filtering
- [ ] Keyboard shortcuts panel
- [ ] Board versioning and history
- [ ] API for third-party integrations

---

## Acknowledgments

- Inspired by [Milanote](https://milanote.com)
