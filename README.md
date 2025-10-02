# Milanote Clone

A full-stack collaborative note-taking application inspired by Milanote, featuring an infinite canvas workspace with real-time collaboration capabilities. Built with the MERN stack and modern web technologies.

![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

## Overview

This application provides a flexible, infinite canvas workspace where users can create, organize, and collaborate on notes and boards in real-time. The drag-and-drop interface with free-form positioning makes it ideal for brainstorming, project planning, and creative workflows.

## Key Features

### Core Functionality
- **Infinite Canvas Workspace**: Drag, drop, and arrange objects freely using Fabric.js
- **Multi-Object Support**: 
  - Text notes with auto-resizing
  - Nested boards for hierarchical organization
  - Image uploads with Firebase Storage integration
- **Real-Time Collaboration**: 
  - Live cursor tracking
  - Instant object updates across all connected users
  - Room-based Socket.IO connections
- **Breadcrumb Navigation**: Intuitive navigation through nested board hierarchies
- **Advanced Object Management**:
  - Multi-select with custom controls
  - Dynamic color customization with BlockPicker
  - Keyboard shortcuts (Delete/Backspace to remove objects)
  - Pan and zoom controls (Shift + drag, mouse wheel)

### Technical Features
- **Discriminator Pattern**: MongoDB discriminators for polymorphic Item model (Notes, Boards, Images)
- **JWT Authentication**: Secure token-based authentication with httpOnly cookies
- **Access Control**: Owner and collaborator-based permissions system
- **Custom Canvas Objects**: Extended Fabric.js classes for rich interactive components
- **Responsive Design**: Dynamic canvas resizing with Tailwind CSS styling
- **State Management**: React Context API for global state (Auth, Notes, Boards, Active Objects)

## Tech Stack

### Frontend
- **React 18.3.1** - UI framework with hooks-based architecture
- **Fabric.js 6.4.3** - Canvas manipulation and rendering engine
- **Socket.IO Client** - Real-time bidirectional communication
- **Axios** - HTTP client for API requests
- **React Router v6** - Client-side routing with nested routes
- **Tailwind CSS** - Utility-first styling
- **Material-UI** - Component library for breadcrumbs and icons
- **Framer Motion** - Smooth animations for toolbar transitions
- **React Color** - Color picker component

### Backend
- **Node.js & Express.js** - RESTful API server
- **MongoDB & Mongoose** - NoSQL database with ODM
- **Socket.IO** - WebSocket server for real-time features
- **JWT (jsonwebtoken)** - Secure authentication tokens
- **bcrypt** - Password hashing
- **Firebase Admin SDK** - Cloud storage for image uploads
- **Multer** - Multipart/form-data handling for file uploads

## Architecture

### Database Schema
```
User
├── email (unique)
├── username
├── password (hashed)
└── rootBoard (ref: Board)

Item (Base Schema - Discriminator Pattern)
├── type (enum: "note", "board", "image")
├── board (ref: Board)
└── timestamps

Note (extends Item)
├── title
├── content
├── color
├── position {x, y}
├── width
└── height

Board (extends Item)
├── title
├── owner (ref: User)
├── collaborators [ref: User]
├── root (boolean)
└── position {x, y}

Image (extends Item)
├── src (Firebase Storage URL)
├── position {x, y}
├── scale {x, y}
└── dimensions
```

### Custom Canvas Objects
- **Base Class**: Shared functionality for all canvas objects
- **Note Class**: Auto-resizing textbox with grouped rect background
- **Board Class**: Navigable containers with custom border on selection
- **Image Class**: Scalable images with custom resize controls

### Real-Time Architecture
- Socket.IO rooms for board-specific updates
- Event types: `itemCreated`, `itemUpdated`, `itemDeleted`, `cursorMove`
- Optimistic UI updates with server confirmation

## Project Structure

```
milanote-clone/
├── backend/
│   ├── controllers/     # Request handlers (auth, boards, items, images)
│   ├── middleware/      # Authentication & authorization
│   ├── models/          # Mongoose schemas with discriminators
│   ├── routes/          # Express route definitions
│   ├── util/            # Socket singleton, Firebase, JWT helpers
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React Context providers
│   │   ├── hooks/       # Custom hooks (canvas, auth, contexts)
│   │   ├── pages/       # Route components
│   │   ├── services/    # API service layers
│   │   └── utils/       # Canvas utilities, custom objects
│   └── package.json
└── README.md
```

## Usage

### Creating Notes
1. Drag the "Add Note" button from the toolbar onto the canvas
2. Drop at desired location
3. Double-click to edit text content
4. Click and drag to reposition

### Creating Boards
1. Drag "Add Board" button from toolbar
2. Double-click the board title to rename
3. Double-click the board icon to navigate into it
4. Use breadcrumbs to navigate back

### Uploading Images
1. Drag and drop image files directly onto the canvas
2. Resize using the corner control
3. Reposition by dragging

### Collaboration
1. Share board by clicking Settings → Share
2. Add collaborators by email
3. Real-time updates appear automatically for all users

## Key Technical Decisions

### Why Fabric.js?
- Native canvas manipulation is complex and low-level
- Fabric.js provides high-level object-oriented API
- Built-in support for transformations, groups, and events
- Excellent performance for large numbers of objects

### MongoDB Discriminators
- Single collection for all canvas items (Notes, Boards, Images)
- Shared base schema with type-specific extensions
- Efficient queries and unified API endpoints
- Clean polymorphic data model

### Socket.IO Rooms
- Board-specific event broadcasting
- Reduces unnecessary network traffic
- Scalable architecture for multiple concurrent boards
- Simple room join/leave on navigation

### Context API Over Redux
- Simpler setup for medium-sized application
- Hooks-based API integrates naturally with React
- Sufficient for current state management needs
- Easy to migrate to Redux if complexity increases

## Known Issues & Future Improvements

### Current Limitations
- Canvas edge detection could be more robust
- No undo/redo functionality
- Limited export options
- Mobile responsiveness needs improvement

### Roadmap
- [ ] Enhanced UI/UX with modern design patterns
- [ ] Additional object types (lines, arrows, shapes)
- [ ] Rich text editing with formatting
- [ ] Export to PDF/PNG
- [ ] Mobile app with React Native
- [ ] Offline support with service workers
- [ ] Version history and rollback
- [ ] Comments and reactions on objects
- [ ] Search functionality across all boards

## Acknowledgments

- Inspired by [Milanote](https://milanote.com)

---

**Note**: This is a portfolio project created for educational purposes. It is not affiliated with or endorsed by Milanote.
