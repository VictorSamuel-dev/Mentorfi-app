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

### Badge System
- **Badge Types**: FOUNDING_MENTOR (gold, special tier), VERIFIED_MENTOR (blue, trust tier), EARLY_SUPPORTER (slate, community tier)
- **Visibility Rules**: 
  - Mentor badges (FOUNDING_MENTOR, VERIFIED_MENTOR) are always visible to everyone
  - Other badges only visible to users with approved connections
- **Admin Controls**: POST /api/badges/award and POST /api/badges/revoke for admin-only badge management
- **UI Components**: UserBadge (pill/compact/icon variants), BadgeRow for multiple badges
- **Integration Points**: ProfileCard, EventDetailsDialog attendee cards, mentor browsing

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

### Feature Flags
- **SHOW_PLACEHOLDERS**: Located in `shared/featureFlags.ts`, defaults to `false`. When `false`, all placeholder/mock data is disabled (seed.ts skips seeding, example components show disabled message, StatsSection shows beta-appropriate stats). Set to `true` for demo purposes to re-enable sample events, mentors, mentees, and mock data.

### Stripe Integration
- **stripe-replit-sync**: Manages webhook processing, schema creation, and data sync
- **Stripe Client**: `server/stripeClient.ts` - fetches credentials from Replit connection API
- **Webhook Handler**: `server/webhookHandlers.ts` - processes Stripe webhooks via stripe-replit-sync
- **Stripe Service**: `server/stripeService.ts` - checkout sessions, customer management, portal sessions
- **Seed Products**: `server/seed-products.ts` - creates Mentorfy Premium product ($9.99/month) in Stripe
- **Webhook Route**: POST `/api/stripe/webhook` registered BEFORE `express.json()` in `server/index.ts`
- **API Routes**: GET `/api/stripe/products`, POST `/api/stripe/checkout`, GET `/api/stripe/subscription`, POST `/api/stripe/portal`, GET `/api/stripe/publishable-key`
- **Frontend Pages**: `/pricing` (Stripe checkout), `/premium` (subscription management)
- **Database**: `stripe_customer_id` and `stripe_subscription_id` columns on users table; stripe schema managed automatically by stripe-replit-sync

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key (optional, has dev fallback)