import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - mentors and mentees
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("mentee"), // "mentor", "mentee", "admin"
  company: text("company"),
  jobTitle: text("job_title"),
  interests: text("interests").array(),
  targetCompanies: text("target_companies").array(),
  profileImageUrl: text("profile_image_url"),
  isVerified: boolean("is_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  isPremium: boolean("is_premium").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  // Mentee-specific fields
  school: text("school"),
  program: text("program"),
  gradYear: integer("grad_year"),
  menteeGoals: text("mentee_goals").array().default([]),
  menteeGoalStatement: text("mentee_goal_statement"),
  // Mentor-specific fields
  industry: text("industry"),
  yearsExperience: integer("years_experience"),
  expertise: text("expertise").array(),
  bio: text("bio"),
  maxConnectionsPerQuarter: integer("max_connections_per_quarter").default(2),
  preferredFormats: jsonb("preferred_formats").default([]),
  requiredMaterials: jsonb("required_materials").default({}),
  onboardingComplete: boolean("onboarding_complete").default(false),
  // Work email verification
  workEmail: text("work_email"),
  workEmailVerified: boolean("work_email_verified").default(false),
  workEmailVerificationCode: text("work_email_verification_code"),
  workEmailVerificationExpires: timestamp("work_email_verification_expires"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  company: true,
  jobTitle: true,
  interests: true,
  targetCompanies: true,
  profileImageUrl: true,
  school: true,
  program: true,
  gradYear: true,
  menteeGoals: true,
  menteeGoalStatement: true,
  industry: true,
  yearsExperience: true,
  expertise: true,
  bio: true,
  maxConnectionsPerQuarter: true,
  preferredFormats: true,
  requiredMaterials: true,
  onboardingComplete: true,
  workEmail: true,
  workEmailVerified: true,
  workEmailVerificationCode: true,
  workEmailVerificationExpires: true,
  emailVerified: true,
  emailVerificationToken: true,
  emailVerificationExpires: true,
});

// Available mentee goal options for matching
export const MENTEE_GOAL_OPTIONS = [
  "Career direction / exploration",
  "Resume feedback",
  "Interview prep",
  "Breaking into a target company",
  "Networking strategy",
  "Grad school guidance",
  "Leadership & professional growth",
  "Switching careers",
  "First job / internship guidance",
] as const;

export const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance & Banking",
  "Consulting",
  "Healthcare",
  "Energy",
  "Consumer Goods",
  "Media & Entertainment",
  "Telecommunications",
  "Automotive",
  "Aerospace & Defense",
  "Retail",
  "Real Estate",
  "Education",
  "Government",
  "Non-profit",
  "Other",
] as const;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export function getProfileCompleteness(user: Omit<User, 'password'> | null): { percent: number; missingFields: string[] } {
  if (!user) return { percent: 0, missingFields: [] };

  const missing: string[] = [];

  if (!user.firstName) missing.push("First name");
  if (!user.lastName) missing.push("Last name");

  if (user.role === "mentor") {
    if (!user.company) missing.push("Company");
    if (!user.jobTitle) missing.push("Job title");
    if (!user.industry) missing.push("Industry");
    if (!user.interests || user.interests.length === 0) missing.push("Interests");
    if (!user.bio) missing.push("Bio");
    const totalFields = 7;
    const filled = totalFields - missing.length;
    return { percent: Math.round((filled / totalFields) * 100), missingFields: missing };
  }

  if (!user.school) missing.push("School");
  if (!user.interests || user.interests.length === 0) missing.push("Interests");
  if (!user.targetCompanies || user.targetCompanies.length === 0) missing.push("Target companies");
  if (!user.menteeGoals || user.menteeGoals.length === 0) missing.push("Mentorship goals");
  const totalFields = 6;
  const filled = totalFields - missing.length;
  return { percent: Math.round((filled / totalFields) * 100), missingFields: missing };
}

// Events table
export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  isVirtual: boolean("is_virtual").default(false),
  type: text("type").notNull().default("career_fair"), // "career_fair", "info_session", "workshop"
  company: text("company"),
  industry: text("industry").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event RSVPs - tracks who is attending which event
export const eventRsvps = pgTable("event_rsvps", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: integer("event_id").notNull().references(() => events.id),
  status: text("status").notNull().default("going"), // "going", "not_going"
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("event_rsvps_user_event_idx").on(table.userId, table.eventId),
]);

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  createdAt: true,
});

export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;

// Connections - mentor-mentee connection requests
export const connections = pgTable("connections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // "pending", "approved", "declined"
  message: text("message"),
  eventId: integer("event_id").references(() => events.id), // optional: the event that triggered the connection
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;

// Messages - chat between connected users
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  connectionId: integer("connection_id").notNull().references(() => connections.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Badges table - badge definitions
export const badges = pgTable("badges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  tier: text("tier").notNull().default("community"), // "special", "trust", "community"
  textColor: text("text_color").notNull().default("#FFFFFF"),
  bgColor: text("bg_color").notNull().default("#0B1220"),
  borderColor: text("border_color").notNull().default("#2563EB"),
  iconSvg: text("icon_svg"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User badges - awarded badges to users
export const userBadges = pgTable("user_badges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  awardedAt: timestamp("awarded_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  metadata: jsonb("metadata"),
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  awardedAt: true,
  revokedAt: true,
});

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Matches table - tracks unlocked mentor-mentee matches based on interests/goals
export const matches = pgTable("matches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  menteeId: varchar("mentee_id").notNull().references(() => users.id),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  eventId: integer("event_id").references(() => events.id),
  overlapScore: integer("overlap_score").notNull().default(0),
  contextLabels: text("context_labels").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("matches_mentor_mentee_idx").on(table.mentorId, table.menteeId),
]);

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Notifications table - in-app notifications
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "connection_approved", "connection_request", "new_message", "review_received", "meeting_scheduled", "meeting_updated"
  title: text("title").notNull(),
  content: text("content").notNull(),
  entityType: text("entity_type"), // "connection", "message", "review", "meeting"
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Reviews table - mentor ratings and feedback
export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  connectionId: integer("connection_id").notNull().references(() => connections.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("reviews_connection_reviewer_idx").on(table.connectionId, table.reviewerId),
]);

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Meetings table - scheduled 1-on-1 calls
export const meetings = pgTable("meetings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  connectionId: integer("connection_id").notNull().references(() => connections.id),
  schedulerId: varchar("scheduler_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  format: text("format").notNull().default("video_call"), // "video_call", "phone_call", "in_person"
  location: text("location"),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// Mentor availability slots - recurring weekly windows
export const mentorAvailabilitySlots = pgTable("mentor_availability_slots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: text("start_time").notNull(), // "09:00" (24h format)
  endTime: text("end_time").notNull(), // "17:00" (24h format)
});

export const insertAvailabilitySlotSchema = createInsertSchema(mentorAvailabilitySlots).omit({
  id: true,
});

export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type AvailabilitySlot = typeof mentorAvailabilitySlots.$inferSelect;

// Mentor blocked dates - specific dates mentors are unavailable
export const mentorBlockedDates = pgTable("mentor_blocked_dates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  blockedDate: text("blocked_date").notNull(), // "2026-03-15" (ISO date string)
  reason: text("reason"),
});

export const insertBlockedDateSchema = createInsertSchema(mentorBlockedDates).omit({
  id: true,
});

export type InsertBlockedDate = z.infer<typeof insertBlockedDateSchema>;
export type BlockedDate = typeof mentorBlockedDates.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Analytics events table - tracks user activity
export const analyticsEvents = pgTable("analytics_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(), // "profile_view", "message_sent", "connection_approved", "meeting_scheduled"
  subjectUserId: varchar("subject_user_id"),
  connectionId: integer("connection_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// Extended types for frontend use
export interface EventWithAttendees extends Event {
  attendeeCount: number;
  isAttending: boolean;
}

export interface UserProfile extends Omit<User, 'password'> {
  connectionStatus?: "none" | "pending" | "approved";
}

export interface MatchData {
  id: number;
  matchedUser: UserProfileWithBadges;
  event: Event;
  sharedInterests: string[];
  sharedCompany?: string;
}

export interface UnlockedMatchData {
  matchId: number;
  overlapScore: number;
  event?: {
    id: number;
    title: string;
    startAt: Date | null;
    location: string;
  };
  contextLabels: string[];
  person: UserProfileWithBadges;
}

export interface ConversationData {
  connectionId: number;
  participant: UserProfile;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  messages: Message[];
  isLocked: boolean;
  messageCount: number;
}

// Visible attendee with connection status
export interface VisibleAttendee {
  id: string;
  name: string;
  avatarUrl: string | null;
  title: string | null;
  company: string | null;
  connectionStatus: "approved";
  badges?: Badge[];
}

// Badge display data for frontend
export interface BadgeDisplay {
  id: number;
  code: string;
  name: string;
  tier: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconSvg?: string | null;
}

// User with badges for profile display
export interface UserProfileWithBadges extends UserProfile {
  badges?: BadgeDisplay[];
}

export interface EventAttendeesResponse {
  totalAttending: number;
  visibleAttendees: VisibleAttendee[];
}

export interface ReviewWithUser extends Review {
  reviewer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    role: string;
  };
}

export interface MeetingWithParticipant extends Meeting {
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    company: string | null;
  };
}

export interface MentorAnalytics {
  profileViews: number;
  totalConnections: number;
  totalMessages: number;
  totalMeetings: number;
  averageRating: number;
  totalReviews: number;
  recentActivity: { date: string; views: number; messages: number }[];
}
