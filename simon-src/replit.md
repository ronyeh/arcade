# Simon Says Memory Game

## Overview

This is a browser-based Simon Says memory game built with TypeScript, PixiJS for graphics, and Tone.js for audio. The game features a classic sequence-memory gameplay with modern enhancements including bonus rounds, power-ups, and multiple interaction methods (keyboard and mouse/touch).

## System Architecture

### Frontend Architecture
- **Framework**: Vanilla TypeScript with PIXI.js for 2D graphics rendering
- **Build System**: ESBuild for fast TypeScript compilation and bundling
- **Audio Engine**: Tone.js for procedural audio generation and sound effects
- **Deployment**: Static file serving with custom Node.js HTTP server

### Key Technologies
- TypeScript for type-safe development
- PIXI.js for hardware-accelerated 2D graphics
- Tone.js for Web Audio API abstraction
- ESBuild for modern bundling and transpilation
- Node.js for development server

## Key Components

### Core Game Classes

1. **Game.ts** - Main game controller and state management
   - Handles game loop, sequence generation, and player input validation
   - Manages round progression and scoring system
   - Coordinates between all other components

2. **Square.ts** - Individual game button/square component
   - Manages visual states (active/inactive, hidden/visible)
   - Handles flash animations for sequence display
   - Provides interaction capabilities

3. **AudioManager.ts** - Sound and music management
   - Uses Tone.js for generating musical tones
   - Provides different audio feedback for game events
   - Handles Web Audio API initialization

4. **BonusManager.ts** - Power-up and bonus round system
   - Manages bonus availability and activation
   - Implements hint system, extra lives, and 50/50 power-ups
   - Triggered every 5 rounds

### Input System
- **Keyboard Support**: F, D, J, K keys mapped to squares
- **Mouse/Touch Support**: Click/tap interaction on squares
- **Bonus Shortcuts**: H for hints, X for 50/50 power-up

### Visual Design
- Responsive CSS with gradient backgrounds
- PIXI.js canvas for smooth animations
- Color-coded squares with audio-visual feedback
- Clean UI with score tracking and game status

## Data Flow

1. **Game Initialization**
   - PIXI application setup and canvas mounting
   - Audio context initialization
   - Event listener registration

2. **Sequence Generation**
   - Random square selection for each round
   - Sequence grows by one element each round
   - Audio-visual playback of sequence

3. **Player Input Processing**
   - Input validation against current sequence
   - Immediate feedback for correct/incorrect moves
   - Life system with game over conditions

4. **Bonus Round Activation**
   - Triggered every 5th round
   - Player chooses from three power-up options
   - Power-ups persist until used or game ends

## External Dependencies

### CDN Resources
- **PIXI.js**: Graphics rendering library loaded from CDN
- **Tone.js**: Web Audio API wrapper loaded from CDN

### Build Dependencies
- **ESBuild**: Fast TypeScript bundler and transpiler
- **TypeScript**: Type checking and compilation
- **@types/node**: Node.js type definitions

### Development Tools
- Custom Node.js HTTP server for local development
- Live reload capabilities through Replit workflows
- CORS-enabled serving for development

## Deployment Strategy

### Build Process
1. ESBuild compiles TypeScript source to JavaScript bundle
2. Static assets (HTML, CSS) copied to distribution directory
3. Bundle includes source maps for debugging

### Serving Strategy
- Custom Node.js HTTP server serves static files
- MIME type detection for proper content delivery
- CORS headers enabled for development
- Port 5000 default with configurable options

### Production Considerations
- Minification enabled via NODE_ENV=production
- External libraries loaded from CDN to reduce bundle size
- Static file caching headers for performance

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 13, 2025. Initial setup