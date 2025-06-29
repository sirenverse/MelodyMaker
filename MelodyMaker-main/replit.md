# Music Studio Application

## Overview

This is a full-stack music creation and composition application built with React, Express, and PostgreSQL. The application provides a comprehensive digital audio workstation (DAW) interface for creating, recording, and managing musical sequences with support for multiple instruments including piano, guitar, bass, and synthesizers.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server components:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Audio Processing**: Web Audio API for real-time audio synthesis
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application with Wouter for routing
- **Component Library**: shadcn/ui components for consistent UI
- **Audio Engine**: Custom Web Audio API implementation for sound synthesis
- **Music Theory Library**: Helper functions for scales, chords, and note calculations
- **Export Functionality**: MIDI and WAV export capabilities

### Backend Architecture
- **REST API**: Express.js server with structured routing
- **Data Layer**: Drizzle ORM with PostgreSQL integration
- **Storage Interface**: Abstracted storage layer with in-memory fallback
- **Request Logging**: Comprehensive API request logging middleware

### Database Schema
- **Sequences Table**: Main entity storing musical compositions
  - `id`: Primary key
  - `name`: Sequence name
  - `bpm`: Tempo (beats per minute)
  - `instrument`: Selected instrument type
  - `notes`: JSON array of note objects with frequency, duration, timestamp
  - `chords`: JSON array of chord progressions
  - `scale`: Musical scale (major, minor, etc.)
  - `key`: Musical key (C, D, etc.)
  - `createdAt`: Timestamp

### Music Components
- **Piano Keyboard**: Interactive piano interface with octave shifting
- **Guitar Fretboard**: Visual guitar fretboard with string/fret notation
- **Chord Builder**: Common chord selection and progression creation
- **Scale Explorer**: Scale visualization and playback
- **Sequence Display**: Real-time recording and playback visualization

## Data Flow

1. **User Interaction**: User plays instruments through piano keyboard or guitar fretboard
2. **Audio Generation**: Web Audio API synthesizes sounds based on note frequencies
3. **Recording**: Notes and chords are captured with timestamps during recording mode
4. **Storage**: Sequences are persisted to PostgreSQL via REST API
5. **Playback**: Stored sequences can be retrieved and played back through the audio engine
6. **Export**: Sequences can be exported as MIDI or WAV files

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **class-variance-authority**: Component styling variants
- **zod**: Runtime type validation

### Audio & Music
- Web Audio API (browser native)
- Custom audio synthesis engine
- MIDI export functionality
- WAV export functionality

### Development Tools
- **Vite**: Frontend build tool with HMR
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Backend bundling for production

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` runs both frontend and backend in development mode
- **Build**: `npm run build` creates production builds for both client and server
- **Production**: `npm run start` serves the built application
- **Database**: Uses environment variable `DATABASE_URL` for PostgreSQL connection
- **Port Configuration**: Server runs on port 5000, exposed as port 80 externally

### Environment Configuration
- PostgreSQL module enabled in Replit environment
- Node.js 20 runtime
- Automatic scaling deployment target
- Development tools configured for Replit IDE integration

## Recent Changes

```
✓ June 24, 2025: Enhanced chord system with 25+ chords per scale
✓ June 24, 2025: Replaced instrument buttons with dropdown selector  
✓ June 24, 2025: Improved UI with gradients, animations, and modern styling
✓ June 24, 2025: Added comprehensive chord collections matching OneMotion
✓ June 24, 2025: Implemented chord removal and better progression display
✓ June 24, 2025: Extended piano to 4 octaves (28 white + 20 black keys) for complete chord coverage
✓ June 24, 2025: Implemented realistic instrument synthesis with harmonics, filters, and envelopes
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Chord system: Comprehensive collections like OneMotion (25+ chords per scale)
UI preference: Modern, clean interface with space-efficient dropdowns
Layout preference: Chord builder below instruments/scales, no scroll wheels
Piano preference: Extended keyboard with more keys for better chord visualization
Audio preference: Realistic instrument tones with proper synthesis techniques
Chord highlighting: OneMotion-style - only one key per chord note (not multiple octaves)
```