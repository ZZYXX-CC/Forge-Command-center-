# Neural Command & Chat System Documentation

## Location
`src/components/ui/NeuralCommandMap.tsx`

## Overview
The Neural Command Map is the central hub for monitoring and interacting with the AI Agent network. It provides a multi-view interface for strategic oversight and direct tactical communication.

## Core Views

### 1. Map View (`view === 'map'`)
- **Purpose**: Visualizes the neural topology of the agent network.
- **Tech**: SVG-based rendering with `framer-motion` for smooth node transitions and edge animations.
- **Interaction**: 
  - Drag nodes to reorganize the layout.
  - Zoom and pan using the mouse wheel and canvas dragging.
  - Click nodes to open the **Agent Dossier** (Detail Panel).
  - Hover nodes to highlight immediate neural connections.

### 2. Roster View (`view === 'roster'`)
- **Purpose**: High-density list view for auditing agent health and models.
- **Organization**: Categorized by Tier (Core, Support, Pipeline).
- **Status**: Real-time health indicators using the FORGE status color system.

### 3. Chat View (`view === 'chat'`)
- **Purpose**: Direct communication interface.
- **Channels**:
  - **Neural Network**: Broadcast channel for system-wide directives.
  - **Individual Agents**: Private channels for specific agent tasks.
- **Intelligence Tools**: A contextual sidebar that provides deep-links to logs, memory browsers, and configurations for the active agent.

## Design System Integration

### Status Colors
Status colors are synchronized with the global design system in `src/index.css`. 
In the code, use the following mapping constants for consistency:
- `STATUS_BG_CLASSES`: Tailwind classes for background colors.
- `STATUS_TEXT_CLASSES`: Tailwind classes for text colors.

### Icons
Uses the `ForgeIcon` primitive with the `solar` Bold Duotone icon set.

## Engineering Notes
- **State Management**: Local React state handles view switching and active channels.
- **Animations**: `AnimatePresence` is used for smooth transitions between Map, Roster, and Chat views.
- **Responsiveness**: Mobile-first approach with specific breakpoints for small screens (e.g., hiding text labels on buttons, collapsing sidebars).
