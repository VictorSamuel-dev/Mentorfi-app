import { db } from "./db";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import {
  users,
  events,
  eventRsvps,
  connections,
  messages,
  badges,
  userBadges,
  matches,
  notifications,
  reviews,
  meetings,
  analyticsEvents,
  type User,
  type InsertUser,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertEventRsvp,
  type Connection,
  type InsertConnection,
  type Message,
  type InsertMessage,
  type Match,
  type InsertMatch,
  type Notification,
  type InsertNotification,
  type Review,
  type InsertReview,
  type Meeting,
  type InsertMeeting,
  type InsertAnalyticsEvent,
  type EventWithAttendees,
  type UserProfile,
  type MatchData,
  type UnlockedMatchData,
  type ConversationData,
  type EventAttendeesResponse,
  type VisibleAttendee,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type BadgeDisplay,
  type UserProfileWithBadges,
  type ReviewWithUser,
  type MeetingWithParticipant,
  type MentorAnalytics,
} from "@shared/schema";
import { hashPassword, comparePasswords } from "./utils/password";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  upgradeToPremium(id: string): Promise<User | undefined>;
  downgradeFromPremium(id: string): Promise<User | undefined>;
  updateUserStripeInfo(id: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User | undefined>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsWithAttendees(userId?: string): Promise<EventWithAttendees[]>;
  
  // RSVP operations
  createRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  upsertRsvp(userId: string, eventId: number, status: string): Promise<EventRsvp>;
  deleteRsvp(userId: string, eventId: number): Promise<void>;
  getUserRsvps(userId: string): Promise<EventRsvp[]>;
  getEventAttendees(eventId: number): Promise<User[]>;
  getEventVisibleAttendees(eventId: number, viewerId: string): Promise<EventAttendeesResponse>;
  
  // Mentor capacity
  getMentorApprovedConnectionsInQuarter(mentorId: string): Promise<number>;
  
  // Admin metrics
  getAdminMetrics(): Promise<{
    usersCount: number;
    eventsCount: number;
    rsvpsGoingCount: number;
    rsvpsNotGoingCount: number;
    matchesCount: number;
    requestsPendingCount: number;
    requestsApprovedCount: number;
    requestsDeclinedCount: number;
    connectionsCount: number;
    messagesCount: number;
  }>;
  
  // Connection operations
  createConnection(connection: InsertConnection): Promise<Connection>;
  getConnection(id: number): Promise<Connection | undefined>;
  getConnectionBetweenUsers(userId1: string, userId2: string): Promise<Connection | undefined>;
  updateConnectionStatus(id: number, status: string): Promise<Connection | undefined>;
  getPendingConnectionsForUser(userId: string): Promise<Connection[]>;
  getApprovedConnectionsForUser(userId: string): Promise<Connection[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConnection(connectionId: number): Promise<Message[]>;
  getMessageCountForConnection(connectionId: number): Promise<number>;
  
  // Matching operations
  getMatchesForUser(userId: string): Promise<MatchData[]>;
  getMentorsForBrowsing(userId: string): Promise<UserProfileWithBadges[]>;
  getUnlockedMatchesForUser(userId: string): Promise<UnlockedMatchData[]>;
  getSuggestedMentors(userId: string, filters?: { company?: string; industry?: string; interest?: string; search?: string }): Promise<UserProfileWithBadges[]>;
  computeOverlapScore(userId1: string, userId2: string): Promise<{ score: number; sharedInterests: string[]; sharedCompanies: string[] }>;
  upsertEventMatchesForEvent(eventId: number): Promise<void>;
  generateInterestBasedMatches(userId: string): Promise<void>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getBadgeByCode(code: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getUserBadges(userId: string): Promise<BadgeDisplay[]>;
  awardBadge(userId: string, badgeId: number, metadata?: Record<string, unknown>): Promise<UserBadge>;
  revokeBadge(userId: string, badgeId: number): Promise<void>;
  hasApprovedConnection(userId1: string, userId2: string): Promise<boolean>;
  getUserProfileWithBadges(id: string, viewerId?: string): Promise<UserProfileWithBadges | undefined>;
  getPlatformStats(): Promise<{ mentorCount: number; eventCount: number; connectionCount: number }>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsForUser(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: number, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsForUser(userId: string): Promise<ReviewWithUser[]>;
  getReviewForConnection(connectionId: number, reviewerId: string): Promise<Review | undefined>;
  getAverageRating(userId: string): Promise<{ average: number; count: number }>;

  // Meeting operations
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getMeetingsForUser(userId: string): Promise<MeetingWithParticipant[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  updateMeetingStatus(id: number, status: string): Promise<Meeting | undefined>;

  // Analytics operations
  logAnalyticsEvent(event: InsertAnalyticsEvent): Promise<void>;
  getMentorAnalytics(userId: string): Promise<MentorAnalytics>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(insertUser.password);
    const result = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const { password, ...profile } = user;
    return profile;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  async upgradeToPremium(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isPremium: true })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async downgradeFromPremium(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isPremium: false, stripeSubscriptionId: null })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserStripeInfo(id: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(info)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async getEventsWithAttendees(userId?: string): Promise<EventWithAttendees[]> {
    const allEvents = await this.getEvents();
    const userRsvps = userId ? await this.getUserRsvps(userId) : [];
    const userEventIds = new Set(userRsvps.map((r) => r.eventId));

    const eventsWithAttendees: EventWithAttendees[] = await Promise.all(
      allEvents.map(async (event) => {
        const attendeeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventRsvps)
          .where(eq(eventRsvps.eventId, event.id));
        
        return {
          ...event,
          attendeeCount: Number(attendeeCount[0]?.count || 0),
          isAttending: userEventIds.has(event.id),
        };
      })
    );

    return eventsWithAttendees;
  }

  // RSVP operations
  async createRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const result = await db.insert(eventRsvps).values(rsvp).returning();
    return result[0];
  }

  async upsertRsvp(userId: string, eventId: number, status: string): Promise<EventRsvp> {
    const result = await db
      .insert(eventRsvps)
      .values({ userId, eventId, status })
      .onConflictDoUpdate({
        target: [eventRsvps.userId, eventRsvps.eventId],
        set: { status },
      })
      .returning();
    return result[0];
  }

  async deleteRsvp(userId: string, eventId: number): Promise<void> {
    await db
      .delete(eventRsvps)
      .where(and(eq(eventRsvps.userId, userId), eq(eventRsvps.eventId, eventId)));
  }

  async getUserRsvps(userId: string): Promise<EventRsvp[]> {
    return db.select().from(eventRsvps).where(eq(eventRsvps.userId, userId));
  }

  // Mentor capacity - count approved connections for this quarter (UTC-based)
  async getMentorApprovedConnectionsInQuarter(mentorId: string): Promise<number> {
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const quarter = Math.floor(utcMonth / 3);
    const quarterStart = new Date(Date.UTC(utcYear, quarter * 3, 1, 0, 0, 0, 0));
    const quarterEnd = new Date(Date.UTC(utcYear, (quarter + 1) * 3, 1, 0, 0, 0, 0));

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(
        and(
          eq(connections.toUserId, mentorId),
          eq(connections.status, "approved"),
          sql`${connections.approvedAt} >= ${quarterStart.toISOString()}`,
          sql`${connections.approvedAt} < ${quarterEnd.toISOString()}`
        )
      );
    return Number(result[0]?.count || 0);
  }

  // Admin metrics
  async getAdminMetrics() {
    const [usersResult, eventsResult, goingResult, notGoingResult, matchesResult, pendingResult, approvedResult, declinedResult, connectionsResult, messagesResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(events),
      db.select({ count: sql<number>`count(*)` }).from(eventRsvps).where(eq(eventRsvps.status, "going")),
      db.select({ count: sql<number>`count(*)` }).from(eventRsvps).where(eq(eventRsvps.status, "not_going")),
      db.select({ count: sql<number>`count(*)` }).from(matches),
      db.select({ count: sql<number>`count(*)` }).from(connections).where(eq(connections.status, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(connections).where(eq(connections.status, "approved")),
      db.select({ count: sql<number>`count(*)` }).from(connections).where(eq(connections.status, "declined")),
      db.select({ count: sql<number>`count(*)` }).from(connections),
      db.select({ count: sql<number>`count(*)` }).from(messages),
    ]);

    return {
      usersCount: Number(usersResult[0]?.count || 0),
      eventsCount: Number(eventsResult[0]?.count || 0),
      rsvpsGoingCount: Number(goingResult[0]?.count || 0),
      rsvpsNotGoingCount: Number(notGoingResult[0]?.count || 0),
      matchesCount: Number(matchesResult[0]?.count || 0),
      requestsPendingCount: Number(pendingResult[0]?.count || 0),
      requestsApprovedCount: Number(approvedResult[0]?.count || 0),
      requestsDeclinedCount: Number(declinedResult[0]?.count || 0),
      connectionsCount: Number(connectionsResult[0]?.count || 0),
      messagesCount: Number(messagesResult[0]?.count || 0),
    };
  }

  async getEventAttendees(eventId: number): Promise<User[]> {
    const rsvps = await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId));
    
    if (rsvps.length === 0) return [];
    
    return db
      .select()
      .from(users)
      .where(inArray(users.id, rsvps.map((r) => r.userId)));
  }

  async getEventVisibleAttendees(eventId: number, viewerId: string): Promise<EventAttendeesResponse> {
    const rsvps = await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId));
    
    const totalAttending = rsvps.length;
    
    if (totalAttending === 0) {
      return { totalAttending: 0, visibleAttendees: [] };
    }

    const attendeeIds = rsvps.map((r) => r.userId).filter((id) => id !== viewerId);
    
    if (attendeeIds.length === 0) {
      return { totalAttending, visibleAttendees: [] };
    }

    const approvedConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.status, "approved"),
          or(
            and(
              eq(connections.fromUserId, viewerId),
              inArray(connections.toUserId, attendeeIds)
            ),
            and(
              eq(connections.toUserId, viewerId),
              inArray(connections.fromUserId, attendeeIds)
            )
          )
        )
      );

    const connectedUserIds = new Set(
      approvedConnections.map((conn) =>
        conn.fromUserId === viewerId ? conn.toUserId : conn.fromUserId
      )
    );

    const visibleUserIds = attendeeIds.filter((id) => connectedUserIds.has(id));

    if (visibleUserIds.length === 0) {
      return { totalAttending, visibleAttendees: [] };
    }

    const visibleUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, visibleUserIds));

    const visibleAttendees: VisibleAttendee[] = await Promise.all(
      visibleUsers.map(async (user) => {
        const userBadgesList = await this.getUserBadges(user.id);
        return {
          id: user.id,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          avatarUrl: user.profileImageUrl,
          title: user.jobTitle,
          company: user.company,
          connectionStatus: "approved" as const,
          badges: userBadgesList,
        };
      })
    );

    return { totalAttending, visibleAttendees };
  }

  // Connection operations
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const result = await db.insert(connections).values(connection).returning();
    return result[0];
  }

  async getConnection(id: number): Promise<Connection | undefined> {
    const result = await db.select().from(connections).where(eq(connections.id, id));
    return result[0];
  }

  async getConnectionBetweenUsers(userId1: string, userId2: string): Promise<Connection | undefined> {
    const result = await db
      .select()
      .from(connections)
      .where(
        or(
          and(eq(connections.fromUserId, userId1), eq(connections.toUserId, userId2)),
          and(eq(connections.fromUserId, userId2), eq(connections.toUserId, userId1))
        )
      );
    return result[0];
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const updates: Partial<Connection> = { status };
    if (status === "approved") {
      updates.approvedAt = new Date();
    }
    const result = await db
      .update(connections)
      .set(updates)
      .where(eq(connections.id, id))
      .returning();
    return result[0];
  }

  async getPendingConnectionsForUser(userId: string): Promise<Connection[]> {
    return db
      .select()
      .from(connections)
      .where(and(eq(connections.toUserId, userId), eq(connections.status, "pending")))
      .orderBy(desc(connections.createdAt));
  }

  async getApprovedConnectionsForUser(userId: string): Promise<Connection[]> {
    return db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.status, "approved"),
          or(eq(connections.fromUserId, userId), eq(connections.toUserId, userId))
        )
      )
      .orderBy(desc(connections.approvedAt));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getMessagesByConnection(connectionId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.connectionId, connectionId))
      .orderBy(messages.createdAt);
  }

  async getMessageCountForConnection(connectionId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.connectionId, connectionId));
    return Number(result[0]?.count || 0);
  }

  // Matching operations
  async getMatchesForUser(userId: string): Promise<MatchData[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const userRsvps = await this.getUserRsvps(userId);
    if (userRsvps.length === 0) return [];

    const userEventIds = userRsvps.map((r) => r.eventId);
    const userInterests = user.interests || [];
    const userTargetCompanies = user.targetCompanies || [];
    
    // Get all other users who RSVP'd to the same events
    const otherRsvps = await db
      .select()
      .from(eventRsvps)
      .where(
        and(
          inArray(eventRsvps.eventId, userEventIds),
          sql`${eventRsvps.userId} != ${userId}`
        )
      );

    if (otherRsvps.length === 0) return [];

    const otherUserIds = Array.from(new Set(otherRsvps.map((r) => r.userId)));
    const otherUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, otherUserIds));

    // Filter to mentors if user is mentee, or mentees if user is mentor
    const targetRole = user.role === "mentee" ? "mentor" : "mentee";
    const matchableUsers = otherUsers.filter((u) => u.role === targetRole);

    const matches: MatchData[] = [];

    for (const matchUser of matchableUsers) {
      // Find shared interests
      const matchInterests = matchUser.interests || [];
      const sharedInterests = userInterests.filter((i) => matchInterests.includes(i));
      
      // Find shared company interest
      const sharedCompany = userTargetCompanies.find((c) => 
        matchUser.company?.toLowerCase().includes(c.toLowerCase())
      );

      // Only include if there's some shared context
      if (sharedInterests.length > 0 || sharedCompany) {
        // Find the shared event
        const matchRsvps = otherRsvps.filter((r) => r.userId === matchUser.id);
        const sharedEventId = matchRsvps.find((r) => userEventIds.includes(r.eventId))?.eventId;
        const sharedEvent = sharedEventId ? await this.getEvent(sharedEventId) : undefined;

        if (sharedEvent) {
          const { password, ...profile } = matchUser;
          
          // Get visible badges for mentor (FOUNDING_MENTOR and VERIFIED_MENTOR are always visible)
          const allBadges = await this.getUserBadges(matchUser.id);
          const visibleBadges = matchUser.role === "mentor" 
            ? allBadges.filter(b => b.code === "FOUNDING_MENTOR" || b.code === "VERIFIED_MENTOR")
            : [];
          
          matches.push({
            id: matchUser.id.charCodeAt(0) + sharedEvent.id, // Simple unique ID
            matchedUser: { ...profile, badges: visibleBadges },
            event: sharedEvent,
            sharedInterests,
            sharedCompany,
          });
        }
      }
    }

    return matches;
  }

  async getMentorsForBrowsing(userId: string): Promise<UserProfileWithBadges[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const mentors = await db
      .select()
      .from(users)
      .where(and(eq(users.role, "mentor"), sql`${users.id} != ${userId}`));

    const profiles: UserProfileWithBadges[] = [];

    for (const mentor of mentors) {
      const { password, ...profile } = mentor;
      
      // Check connection status
      const connection = await this.getConnectionBetweenUsers(userId, mentor.id);
      const connectionStatus = connection?.status === "approved" 
        ? "approved" 
        : connection?.status === "pending" 
          ? "pending" 
          : "none";

      // Get badges for mentor (FOUNDING_MENTOR and VERIFIED_MENTOR are always visible)
      const allBadges = await this.getUserBadges(mentor.id);
      const visibleBadges = allBadges.filter(b => 
        b.code === "FOUNDING_MENTOR" || 
        b.code === "VERIFIED_MENTOR" ||
        connectionStatus === "approved"
      );

      profiles.push({
        ...profile,
        connectionStatus: connectionStatus as "none" | "pending" | "approved",
        badges: visibleBadges,
      });
    }

    return profiles;
  }

  // Compute overlap score (shared interests + shared target companies/goals)
  async computeOverlapScore(userId1: string, userId2: string): Promise<{ score: number; sharedInterests: string[]; sharedCompanies: string[] }> {
    const user1 = await this.getUser(userId1);
    const user2 = await this.getUser(userId2);
    
    if (!user1 || !user2) return { score: 0, sharedInterests: [], sharedCompanies: [] };
    
    // Clone arrays to avoid mutating original database objects
    const interests1 = [...(user1.interests || [])];
    const interests2 = [...(user2.interests || [])];
    const companies1 = [...(user1.targetCompanies || [])];
    const companies2 = [...(user2.targetCompanies || [])];
    
    // For mentors, also include their company as a target
    if (user1.role === "mentor" && user1.company) {
      companies1.push(user1.company);
    }
    if (user2.role === "mentor" && user2.company) {
      companies2.push(user2.company);
    }
    
    const sharedInterests = interests1.filter(i => 
      interests2.some(i2 => i2.toLowerCase() === i.toLowerCase())
    );
    
    const sharedCompanies = companies1.filter(c =>
      companies2.some(c2 => c2.toLowerCase() === c.toLowerCase())
    );
    
    // Score: 1 point per shared interest, 2 points per shared company/goal
    const score = sharedInterests.length + (sharedCompanies.length * 2);
    
    return { score, sharedInterests, sharedCompanies };
  }

  // Upsert matches for all mentee-mentor pairs at an event - adds "Shared event context" label
  async upsertEventMatchesForEvent(eventId: number): Promise<void> {
    const MINIMUM_INTEREST_OVERLAP = 1;
    const EVENT_BOOST = 3;
    
    // Get all RSVPs for this event
    const rsvps = await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId));
    
    if (rsvps.length === 0) return;
    
    const rsvpUserIds = rsvps.map(r => r.userId);
    
    // Get all users who RSVP'd
    const rsvpUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, rsvpUserIds));
    
    const mentees = rsvpUsers.filter(u => u.role === "mentee");
    const mentors = rsvpUsers.filter(u => u.role === "mentor");
    
    // For each mentee-mentor pair, compute overlap and upsert match with event context
    for (const mentee of mentees) {
      for (const mentor of mentors) {
        const { score: baseScore } = await this.computeOverlapScore(mentee.id, mentor.id);
        
        // Require at least some interest/goal overlap before applying event boost
        if (baseScore < MINIMUM_INTEREST_OVERLAP) continue;
        
        const boostedScore = baseScore + EVENT_BOOST;
        
        // Check if match already exists for this pair
        const existing = await db
          .select()
          .from(matches)
          .where(and(
            eq(matches.menteeId, mentee.id),
            eq(matches.mentorId, mentor.id)
          ));
        
        const contextLabels = ["Shared event context"];
        
        if (existing.length === 0) {
          // Insert new match with event context
          await db.insert(matches).values({
            menteeId: mentee.id,
            mentorId: mentor.id,
            eventId,
            overlapScore: boostedScore,
            contextLabels,
          });
        } else {
          // Update with event context if score is higher
          const currentLabels = existing[0].contextLabels || [];
          const updatedLabels = currentLabels.includes("Shared event context") 
            ? currentLabels 
            : [...currentLabels, "Shared event context"];
          
          if (boostedScore > existing[0].overlapScore) {
            await db
              .update(matches)
              .set({ 
                overlapScore: boostedScore, 
                eventId,
                contextLabels: updatedLabels,
              })
              .where(eq(matches.id, existing[0].id));
          } else if (!currentLabels.includes("Shared event context")) {
            await db
              .update(matches)
              .set({ contextLabels: updatedLabels })
              .where(eq(matches.id, existing[0].id));
          }
        }
      }
    }
  }

  // Generate interest-based matches for a user (no event required)
  async generateInterestBasedMatches(userId: string): Promise<void> {
    const MINIMUM_OVERLAP_THRESHOLD = 2;
    
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Get potential match candidates (opposite role)
    const candidates = await db
      .select()
      .from(users)
      .where(eq(users.role, user.role === "mentee" ? "mentor" : "mentee"));
    
    for (const candidate of candidates) {
      const { score } = await this.computeOverlapScore(userId, candidate.id);
      
      if (score >= MINIMUM_OVERLAP_THRESHOLD) {
        const menteeId = user.role === "mentee" ? userId : candidate.id;
        const mentorId = user.role === "mentor" ? userId : candidate.id;
        
        // Check if match already exists
        const existing = await db
          .select()
          .from(matches)
          .where(and(
            eq(matches.menteeId, menteeId),
            eq(matches.mentorId, mentorId)
          ));
        
        const contextLabels = ["Shared interests"];
        
        if (existing.length === 0) {
          // Insert new interest-based match (no event)
          await db.insert(matches).values({
            menteeId,
            mentorId,
            overlapScore: score,
            contextLabels,
          });
        } else {
          // Update score if higher and add label if not present
          const currentLabels = existing[0].contextLabels || [];
          const needsLabelUpdate = !currentLabels.includes("Shared interests");
          const needsScoreUpdate = score > existing[0].overlapScore;
          
          if (needsLabelUpdate || needsScoreUpdate) {
            const updatedLabels = needsLabelUpdate 
              ? [...currentLabels, "Shared interests"]
              : currentLabels;
            await db
              .update(matches)
              .set({ 
                overlapScore: Math.max(score, existing[0].overlapScore),
                contextLabels: updatedLabels,
              })
              .where(eq(matches.id, existing[0].id));
          }
        }
      }
    }
  }

  // Get unlocked matches for user (interest-based and event-based matches)
  async getUnlockedMatchesForUser(userId: string): Promise<UnlockedMatchData[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    let userMatches: Match[];
    
    if (user.role === "mentee") {
      userMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.menteeId, userId))
        .orderBy(desc(matches.overlapScore), desc(matches.createdAt));
    } else {
      userMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.mentorId, userId))
        .orderBy(desc(matches.overlapScore), desc(matches.createdAt));
    }
    
    const results: UnlockedMatchData[] = [];
    
    for (const match of userMatches) {
      const matchedUserId = user.role === "mentee" ? match.mentorId : match.menteeId;
      const matchedUser = await this.getUser(matchedUserId);
      
      if (!matchedUser) continue;
      
      const { password, ...profile } = matchedUser;
      
      // Get connection status
      const connection = await this.getConnectionBetweenUsers(userId, matchedUserId);
      const connectionStatus = connection?.status === "approved" 
        ? "approved" 
        : connection?.status === "pending" 
          ? "pending" 
          : "none";
      
      // Get visible badges
      const allBadges = await this.getUserBadges(matchedUserId);
      const visibleBadges = matchedUser.role === "mentor"
        ? allBadges.filter(b => b.code === "FOUNDING_MENTOR" || b.code === "VERIFIED_MENTOR" || connectionStatus === "approved")
        : connectionStatus === "approved" ? allBadges : [];
      
      // Build event info if available
      let eventInfo: UnlockedMatchData["event"] | undefined;
      if (match.eventId) {
        const event = await this.getEvent(match.eventId);
        if (event) {
          eventInfo = {
            id: event.id,
            title: event.name,
            startAt: event.date,
            location: event.location,
          };
        }
      }
      
      results.push({
        matchId: match.id,
        overlapScore: match.overlapScore,
        event: eventInfo,
        contextLabels: match.contextLabels || [],
        person: {
          ...profile,
          connectionStatus: connectionStatus as "none" | "pending" | "approved",
          badges: visibleBadges,
        },
      });
    }
    
    return results;
  }

  async getSuggestedMentors(userId: string, filters?: { company?: string; industry?: string; interest?: string; search?: string }): Promise<UserProfileWithBadges[]> {
    const user = await this.getUser(userId);
    if (!user || user.role !== "mentee") return [];
    
    const mentors = await db
      .select()
      .from(users)
      .where(eq(users.role, "mentor"));
    
    let filtered = mentors;
    
    if (filters?.company) {
      const q = filters.company.toLowerCase();
      filtered = filtered.filter(m => m.company?.toLowerCase().includes(q));
    }
    if (filters?.industry) {
      const q = filters.industry.toLowerCase();
      filtered = filtered.filter(m => m.industry?.toLowerCase() === q);
    }
    if (filters?.interest) {
      const q = filters.interest.toLowerCase();
      filtered = filtered.filter(m => 
        m.interests?.some(i => i.toLowerCase().includes(q)) ||
        m.expertise?.some(e => e.toLowerCase().includes(q))
      );
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q) ||
        m.jobTitle?.toLowerCase().includes(q) ||
        m.industry?.toLowerCase().includes(q) ||
        m.interests?.some(i => i.toLowerCase().includes(q)) ||
        m.expertise?.some(e => e.toLowerCase().includes(q))
      );
    }
    
    const mentorsWithScores: { mentor: User; score: number }[] = [];
    
    for (const mentor of filtered) {
      const { score } = await this.computeOverlapScore(userId, mentor.id);
      mentorsWithScores.push({ mentor, score });
    }
    
    mentorsWithScores.sort((a, b) => b.score - a.score);
    const topMentors = mentorsWithScores.slice(0, 20);
    
    const results: UserProfileWithBadges[] = [];
    
    for (const { mentor } of topMentors) {
      const { password, ...profile } = mentor;
      
      const connection = await this.getConnectionBetweenUsers(userId, mentor.id);
      const connectionStatus = connection?.status === "approved" 
        ? "approved" 
        : connection?.status === "pending" 
          ? "pending" 
          : "none";
      
      const allBadges = await this.getUserBadges(mentor.id);
      const visibleBadges = allBadges.filter(b => 
        b.code === "FOUNDING_MENTOR" || 
        b.code === "VERIFIED_MENTOR" ||
        connectionStatus === "approved"
      );
      
      results.push({
        ...profile,
        connectionStatus: connectionStatus as "none" | "pending" | "approved",
        badges: visibleBadges,
      });
    }
    
    return results;
  }

  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async getBadgeByCode(code: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(eq(badges.code, code));
    return result[0];
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const result = await db.insert(badges).values(badge).returning();
    return result[0];
  }

  async getUserBadges(userId: string): Promise<BadgeDisplay[]> {
    const result = await db
      .select({
        id: badges.id,
        code: badges.code,
        name: badges.name,
        tier: badges.tier,
        textColor: badges.textColor,
        bgColor: badges.bgColor,
        borderColor: badges.borderColor,
        iconSvg: badges.iconSvg,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(and(
        eq(userBadges.userId, userId),
        sql`${userBadges.revokedAt} IS NULL`
      ));
    
    return result;
  }

  async awardBadge(userId: string, badgeId: number, metadata?: Record<string, unknown>): Promise<UserBadge> {
    const existing = await db
      .select()
      .from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId),
        sql`${userBadges.revokedAt} IS NULL`
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db
      .insert(userBadges)
      .values({ userId, badgeId, metadata })
      .returning();
    return result[0];
  }

  async revokeBadge(userId: string, badgeId: number): Promise<void> {
    await db
      .update(userBadges)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId),
        sql`${userBadges.revokedAt} IS NULL`
      ));
  }

  async hasApprovedConnection(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.getConnectionBetweenUsers(userId1, userId2);
    return connection?.status === "approved";
  }

  async getUserProfileWithBadges(id: string, viewerId?: string): Promise<UserProfileWithBadges | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const { password, ...profile } = user;
    const userBadgesList = await this.getUserBadges(id);
    
    // Filter badges based on visibility rules
    let visibleBadges: BadgeDisplay[] = [];
    
    if (user.role === "mentor") {
      // Mentor badges (FOUNDING_MENTOR, VERIFIED_MENTOR) are always visible
      visibleBadges = userBadgesList.filter(b => 
        b.code === "FOUNDING_MENTOR" || 
        b.code === "VERIFIED_MENTOR"
      );
    }
    
    // If viewer exists and has approved connection, show all badges
    if (viewerId && viewerId !== id) {
      const hasConnection = await this.hasApprovedConnection(viewerId, id);
      if (hasConnection) {
        visibleBadges = userBadgesList;
      }
    }
    
    // User viewing their own profile sees all their badges
    if (viewerId === id) {
      visibleBadges = userBadgesList;
    }

    return {
      ...profile,
      badges: visibleBadges,
    };
  }

  async getPlatformStats(): Promise<{ mentorCount: number; eventCount: number; connectionCount: number }> {
    const [mentorResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "mentor"));
    
    const [eventResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events);
    
    const [connectionResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(eq(connections.status, "approved"));
    
    return {
      mentorCount: Number(mentorResult?.count || 0),
      eventCount: Number(eventResult?.count || 0),
      connectionCount: Number(connectionResult?.count || 0),
    };
  }
  // =====================
  // NOTIFICATION OPERATIONS
  // =====================

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getNotificationsForUser(userId: string, limit = 50): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result?.count || 0);
  }

  async markNotificationRead(id: number, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  // =====================
  // REVIEW OPERATIONS
  // =====================

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async getReviewsForUser(userId: string): Promise<ReviewWithUser[]> {
    const userReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));

    const enriched: ReviewWithUser[] = [];
    for (const review of userReviews) {
      const [reviewer] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, review.reviewerId));

      if (reviewer) {
        enriched.push({ ...review, reviewer });
      }
    }
    return enriched;
  }

  async getReviewForConnection(connectionId: number, reviewerId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.connectionId, connectionId), eq(reviews.reviewerId, reviewerId)));
    return review;
  }

  async getAverageRating(userId: string): Promise<{ average: number; count: number }> {
    const [result] = await db
      .select({
        avg: sql<number>`COALESCE(AVG(rating), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.revieweeId, userId));
    return {
      average: Number(Number(result?.avg || 0).toFixed(1)),
      count: Number(result?.count || 0),
    };
  }

  // =====================
  // MEETING OPERATIONS
  // =====================

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [created] = await db.insert(meetings).values(meeting).returning();
    return created;
  }

  async getMeetingsForUser(userId: string): Promise<MeetingWithParticipant[]> {
    const userConnections = await this.getApprovedConnectionsForUser(userId);
    const connectionIds = userConnections.map(c => c.id);

    if (connectionIds.length === 0) return [];

    const userMeetings = await db
      .select()
      .from(meetings)
      .where(inArray(meetings.connectionId, connectionIds))
      .orderBy(desc(meetings.scheduledAt));

    const enriched: MeetingWithParticipant[] = [];
    for (const meeting of userMeetings) {
      const conn = userConnections.find(c => c.id === meeting.connectionId);
      if (!conn) continue;
      const otherUserId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
      const [otherUser] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          company: users.company,
        })
        .from(users)
        .where(eq(users.id, otherUserId));

      if (otherUser) {
        enriched.push({ ...meeting, otherUser });
      }
    }
    return enriched;
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async updateMeetingStatus(id: number, status: string): Promise<Meeting | undefined> {
    const [updated] = await db
      .update(meetings)
      .set({ status })
      .where(eq(meetings.id, id))
      .returning();
    return updated;
  }

  // =====================
  // ANALYTICS OPERATIONS
  // =====================

  async logAnalyticsEvent(event: InsertAnalyticsEvent): Promise<void> {
    await db.insert(analyticsEvents).values(event);
  }

  async getMentorAnalytics(userId: string): Promise<MentorAnalytics> {
    const [viewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.subjectUserId, userId),
        eq(analyticsEvents.eventType, "profile_view")
      ));

    const [connectionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(and(
        or(eq(connections.fromUserId, userId), eq(connections.toUserId, userId)),
        eq(connections.status, "approved")
      ));

    const [messagesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.senderId, userId));

    const [meetingsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(meetings)
      .where(
        inArray(meetings.connectionId,
          db.select({ id: connections.id }).from(connections).where(
            and(
              or(eq(connections.fromUserId, userId), eq(connections.toUserId, userId)),
              eq(connections.status, "approved")
            )
          )
        )
      );

    const ratingResult = await this.getAverageRating(userId);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentViewsRaw = await db
      .select({
        date: sql<string>`TO_CHAR(created_at, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)`,
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.subjectUserId, userId),
        eq(analyticsEvents.eventType, "profile_view"),
        sql`created_at >= ${sevenDaysAgo}`
      ))
      .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`);

    const recentMessagesRaw = await db
      .select({
        date: sql<string>`TO_CHAR(created_at, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(and(
        eq(messages.senderId, userId),
        sql`created_at >= ${sevenDaysAgo}`
      ))
      .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`);

    const recentActivity: { date: string; views: number; messages: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const viewEntry = recentViewsRaw.find(r => r.date === dateStr);
      const msgEntry = recentMessagesRaw.find(r => r.date === dateStr);
      recentActivity.push({
        date: dateStr,
        views: Number(viewEntry?.count || 0),
        messages: Number(msgEntry?.count || 0),
      });
    }

    return {
      profileViews: Number(viewsResult?.count || 0),
      totalConnections: Number(connectionsResult?.count || 0),
      totalMessages: Number(messagesResult?.count || 0),
      totalMeetings: Number(meetingsResult?.count || 0),
      averageRating: ratingResult.average,
      totalReviews: ratingResult.count,
      recentActivity,
    };
  }
}

export const storage = new DatabaseStorage();
