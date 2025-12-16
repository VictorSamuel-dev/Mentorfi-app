# Mentorfy Design Guidelines

## Design Approach
**Reference-Based Strategy:** Drawing from LinkedIn's professional credibility and Eventbrite's event-focused discovery patterns.

**Core Principles:**
- Professional trustworthiness through clean, structured layouts
- Clear visual hierarchy that guides users from discovery → connection → conversation
- Efficient information density without overwhelming users
- Event-centric visual language that makes opportunities immediately scannable

---

## Typography System

**Font Families:**
- Primary: Inter or System UI Stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)
- Headings: Semi-bold to Bold (600-700)
- Body: Regular to Medium (400-500)

**Type Scale:**
- Hero/Page Titles: `text-4xl` to `text-5xl` (font-weight: 700)
- Section Headers: `text-2xl` to `text-3xl` (font-weight: 600)
- Card Titles: `text-lg` to `text-xl` (font-weight: 600)
- Body Text: `text-base` (font-weight: 400)
- Metadata/Labels: `text-sm` (font-weight: 500, subtle opacity)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16, 24**
- Component padding: `p-4` to `p-6`
- Section spacing: `gap-8`, `space-y-12`
- Card margins: `mb-6`, `gap-6`
- Page containers: `max-w-7xl mx-auto px-6`

**Grid Patterns:**
- Event Cards: 3-column grid on desktop (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Profile Sections: 2-column split (sidebar + main content)
- Match Notifications: Single column with clear cards
- Dashboard: Flexible grid adapting to content density

---

## Component Library

### Navigation
- Sticky top navigation with platform logo, search, and user avatar
- Primary nav items: Events, Matches, Messages, Profile
- Mobile: Collapsible hamburger menu
- Notification badge indicators for new matches/messages

### Profile Cards
- Professional headshot (circular, 80-120px)
- Name, title, company in hierarchy
- Shared interests as pill badges (`px-3 py-1 rounded-full`)
- CTA buttons: "Request Connection" or "Message" based on status
- LinkedIn-inspired layout: Left sidebar (photo, stats) + Main content area

### Event Cards
- Rectangular cards with subtle shadow and border
- Event image placeholder at top (16:9 aspect ratio)
- Event name, date, location, tags clearly stacked
- Attendance indicator showing mutual connections
- "RSVP" or "Attending" status badge
- Hover: Subtle lift effect with increased shadow

### Match Notifications
- Card-based alerts with mentor/mentee preview
- Shared interest/company highlighted
- Event name with date prominently displayed
- Clear "View Profile" CTA
- Icon indicating match type (same event, shared interest)

### Messaging Interface
- Two-panel layout: Conversation list (left) + Active chat (right)
- Approval status banner for pending requests
- Message bubbles: Sender (right-aligned), Recipient (left-aligned)
- Timestamp metadata below messages
- Input area fixed at bottom with send button

### Buttons & CTAs
- Primary: Solid background, medium weight (`px-6 py-3 rounded-lg font-medium`)
- Secondary: Border outline with transparent fill
- On images: Backdrop blur effect (`backdrop-blur-sm bg-white/20`)
- No custom hover states needed (use default component styling)

### Status Badges
- Pills with rounded corners for: "Attending", "Pending", "Approved"
- Industry/Interest tags: Subtle background with border
- Consistent sizing: `text-sm px-3 py-1`

---

## Page Layouts

### Landing Page (Marketing)
- **Hero Section:** Full-width with professional imagery showing networking/mentorship (students and professionals). Centered headline emphasizing "Connect with Fortune 500 mentors at your next career event." Primary CTA: "Get Started" with backdrop blur button overlay.
- **How It Works:** 3-column feature grid explaining: Browse Events → Find Matches → Connect
- **Event Showcase:** Carousel or grid of upcoming featured events
- **Social Proof:** Stats section (2-4 columns): "X mentors", "Y events", "Z connections made"
- **CTA Section:** Large, centered final push to sign up with supporting benefit text

### Dashboard (Authenticated)
- Top stats bar: Upcoming events, active matches, pending requests
- Three-section layout: Events Feed, Match Notifications, Quick Actions
- Sidebar navigation for mobile collapse

### Events Page
- Filter bar at top: Industry, Company, Date range, Event type
- 3-column event card grid with search functionality
- "Your RSVPs" section highlighting attended events

### Profile Page
- Left sidebar: Profile photo, stats (events attended, connections)
- Main content: Bio, interests, target companies, connection history
- Edit mode: Inline form fields matching view layout

### Admin Panel
- Table-based layout for mentor verification queue
- Event management cards with edit/delete actions
- Clean, data-focused presentation

---

## Icons
**Library:** Heroicons (outline and solid variants via CDN)
- Navigation: home, calendar, chat, user-circle
- Actions: plus, check, x-mark, arrow-right
- Status: bell (notifications), check-circle (verified), clock (pending)

---

## Images

**Hero Section:**
- Large, professional image (1920×800px) showing diverse professionals and students networking at a career event or mentorship session
- Warm, inviting atmosphere with natural lighting
- People engaged in conversation, laptop/materials visible
- Overlay: Dark gradient from bottom (80% opacity) to transparent

**Event Cards:**
- Placeholder images (600×400px) representing various event types:
  - Career fair: Booths and professional interactions
  - Info session: Corporate presentation setting
  - Workshop: Collaborative learning environment
- Consistent aspect ratio across all event imagery

**Profile Photos:**
- Professional headshots, circular crop
- Fallback: Initials in colored circle background

---

## Accessibility & Quality Standards
- Maintain WCAG AA contrast ratios
- Focus states on all interactive elements
- Semantic HTML throughout
- Form labels clearly associated with inputs
- Keyboard navigation fully supported