import { db } from "./db";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import {
  users,
  events,
  eventRsvps,
  connections,
  messages,
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
  type EventWithAttendees,
  type UserProfile,
  type MatchData,
  type ConversationData,
} from "@shared/schema";
import { hashPassword, comparePasswords } from "./utils/password";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  upgradeToPremium(id: string): Promise<User | undefined>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsWithAttendees(userId?: string): Promise<EventWithAttendees[]>;
  
  // RSVP operations
  createRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  deleteRsvp(userId: string, eventId: number): Promise<void>;
  getUserRsvps(userId: string): Promise<EventRsvp[]>;
  getEventAttendees(eventId: number): Promise<User[]>;
  
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
  getMentorsForBrowsing(userId: string): Promise<UserProfile[]>;
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

  async upgradeToPremium(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isPremium: true })
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

  async deleteRsvp(userId: string, eventId: number): Promise<void> {
    await db
      .delete(eventRsvps)
      .where(and(eq(eventRsvps.userId, userId), eq(eventRsvps.eventId, eventId)));
  }

  async getUserRsvps(userId: string): Promise<EventRsvp[]> {
    return db.select().from(eventRsvps).where(eq(eventRsvps.userId, userId));
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
          matches.push({
            id: matchUser.id.charCodeAt(0) + sharedEvent.id, // Simple unique ID
            matchedUser: profile,
            event: sharedEvent,
            sharedInterests,
            sharedCompany,
          });
        }
      }
    }

    return matches;
  }

  async getMentorsForBrowsing(userId: string): Promise<UserProfile[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const mentors = await db
      .select()
      .from(users)
      .where(and(eq(users.role, "mentor"), sql`${users.id} != ${userId}`));

    const profiles: UserProfile[] = [];

    for (const mentor of mentors) {
      const { password, ...profile } = mentor;
      
      // Check connection status
      const connection = await this.getConnectionBetweenUsers(userId, mentor.id);
      const connectionStatus = connection?.status === "approved" 
        ? "approved" 
        : connection?.status === "pending" 
          ? "pending" 
          : "none";

      profiles.push({
        ...profile,
        connectionStatus: connectionStatus as "none" | "pending" | "approved",
      });
    }

    return profiles;
  }
}

export const storage = new DatabaseStorage();
