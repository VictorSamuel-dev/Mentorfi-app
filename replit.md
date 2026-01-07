# Mentorfy

## Overview

Mentorfy is a career mentorship platform that connects college students with Fortune 500 professionals through shared career event attendance. The platform enables users to discover career events, find mentors attending the same events, and build meaningful professional relationships through a gated messaging system.

Key features include:
- Event discovery and RSVP management (career fairs, info sessions, workshops)
- Smart matching based on shared events, interests, and target companies
- Gated messaging where mentors approve connection requests before messaging
- Freemium model with message limits for free users and unlimited messaging for premium

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode)
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API under /api prefix
- **Authentication**: Session-based with express-session and MemoryStore (development)
- **Password Security**: scrypt-based hashing with timing-safe comparison

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Database**: PostgreSQL (DATABASE_URL environment variable required)

### Design Patterns
- **Monorepo Structure**: client/, server/, shared/ directories
- **Shared Types**: TypeScript types and Zod schemas in shared/ used by both client and server
- **API Client**: Centralized API functions in client/src/lib/api.ts
- **Storage Abstraction**: IStorage interface in server/storage.ts for database operations

### Key Business Logic
- Free users limited to 2 messages per connection (FREE_MESSAGE_LIMIT constant)
- Connection gating: mentees request, mentors approve before messaging
- Event-based matching: users matched based on shared event RSVPs and interests
- Premium upgrade unlocks unlimited messaging

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via DATABASE_URL environment variable
- **connect-pg-simple**: Session storage (production-ready option available)

### Authentication
- **express-session**: Session management
- **Replit Auth Integration**: Optional OpenID Connect authentication via server/replit_integrations/auth/

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitives (dialogs, dropdowns, tabs, etc.)
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library

### Build & Development
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database migrations and schema push

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key (optional, has dev fallback)