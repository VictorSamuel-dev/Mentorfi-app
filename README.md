# Mentorfy

A career mentorship platform connecting college students with Fortune 500 professionals through intentional, goals-based matching.

## Overview

Mentorfy enables meaningful mentorship connections by matching students with mentors based on shared career interests, goals, and target companies. Unlike traditional networking platforms, Mentorfy focuses on intentional relationship-building with built-in guardrails that protect both mentors and mentees.

## Key Features

### For Students (Mentees)
- **Goal-Based Matching** - Get matched with mentors aligned to your specific career goals
- **Mentor Discovery** - Browse mentors by industry, company, and expertise
- **Connection Requests** - Request mentorship with personalized messages
- **Career Events** - Optional event-based context for networking (career fairs, info sessions)
- **Goal Setting** - Define up to 3 career goals with a personal goal statement

### For Mentors
- **Approval-Based Connections** - Control who you mentor by approving connection requests
- **Capacity Management** - Set limits on connections per quarter
- **Profile Customization** - Showcase your experience, company, and mentoring preferences
- **Badge Recognition** - Earn badges like Founding Mentor and Verified Mentor

### Platform Features
- **Gated Messaging** - Free tier includes limited messages per connection to encourage meaningful conversations
- **Smart Matching** - Algorithm matches based on shared interests, target companies, and goals
- **Event Coordination** - Optional career events as context for connections
- **Premium Tier** - Extended messaging and advanced filters for deeper engagement

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with secure password hashing
- **File Storage**: Replit Object Storage for profile images
- **Routing**: Wouter

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/VictorSamuel-dev/Mentorfi-app.git
cd Mentorfi-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
```

4. Push database schema
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
├── server/                 # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── utils/             # Server utilities
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle schema and Zod validation
└── public/                 # Static assets
```

## Pricing

| Feature | Free | Premium ($9.99/mo) |
|---------|------|-------------------|
| Profile creation | Yes | Yes |
| Mentor discovery | Yes | Yes |
| Connection requests | Yes | Yes |
| Messaging | Limited | Extended |
| Matching | Standard | Priority visibility |
| Advanced filters | - | Yes |
| Event tools | Optional | Optional |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary software.

## Contact

For questions or support, please visit our [Contact page](https://mentorfy.replit.app/contact).
