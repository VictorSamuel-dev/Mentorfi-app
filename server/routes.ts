import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertConnectionSchema, insertMessageSchema } from "@shared/schema";
import { comparePasswords } from "./utils/password";
import "./types";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

// Message limit for free users
const FREE_MESSAGE_LIMIT = 2;

// Auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // =====================
  // AUTH ROUTES
  // =====================
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        role: role || "mentee",
      });

      req.session.userId = user.id;
      const { password: _, ...profile } = user;
      res.json({ user: profile });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await comparePasswords(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      const { password: _, ...profile } = user;
      res.json({ user: profile });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.json({ user: null });
    }

    const profile = await storage.getUserProfile(req.session.userId);
    res.json({ user: profile || null });
  });

  // =====================
  // USER ROUTES
  // =====================

  app.get("/api/users/profile", requireAuth, async (req, res) => {
    const profile = await storage.getUserProfile(req.session.userId!);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  });

  app.patch("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, company, jobTitle, interests, targetCompanies, profileImageUrl } = req.body;
      
      const updated = await storage.updateUser(req.session.userId!, {
        firstName,
        lastName,
        company,
        jobTitle,
        interests,
        targetCompanies,
        profileImageUrl,
      });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...profile } = updated;
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Update failed" });
    }
  });

  app.post("/api/users/upgrade", requireAuth, async (req, res) => {
    try {
      const updated = await storage.upgradeToPremium(req.session.userId!);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...profile } = updated;
      res.json(profile);
    } catch (error) {
      console.error("Upgrade error:", error);
      res.status(500).json({ error: "Upgrade failed" });
    }
  });

  // =====================
  // EVENT ROUTES
  // =====================

  app.get("/api/events", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const events = await storage.getEventsWithAttendees(userId);
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const validated = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validated);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create event error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.post("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.session.userId!;

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const rsvp = await storage.createRsvp({ userId, eventId });
      res.json(rsvp);
    } catch (error) {
      console.error("RSVP error:", error);
      res.status(500).json({ error: "Failed to RSVP" });
    }
  });

  app.delete("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteRsvp(req.session.userId!, eventId);
      res.json({ success: true });
    } catch (error) {
      console.error("Cancel RSVP error:", error);
      res.status(500).json({ error: "Failed to cancel RSVP" });
    }
  });

  app.get("/api/events/:id/attendees-visible", requireAuth, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const viewerId = req.session.userId!;

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const result = await storage.getEventVisibleAttendees(eventId, viewerId);
      res.json(result);
    } catch (error) {
      console.error("Get visible attendees error:", error);
      res.status(500).json({ error: "Failed to fetch attendees" });
    }
  });

  // =====================
  // CONNECTION ROUTES
  // =====================

  app.get("/api/connections/pending", requireAuth, async (req, res) => {
    try {
      const connections = await storage.getPendingConnectionsForUser(req.session.userId!);
      
      // Enrich with user data
      const enriched = await Promise.all(
        connections.map(async (conn) => {
          const fromUser = await storage.getUserProfile(conn.fromUserId);
          const event = conn.eventId ? await storage.getEvent(conn.eventId) : undefined;
          return {
            ...conn,
            from: fromUser,
            event,
          };
        })
      );
      
      res.json(enriched);
    } catch (error) {
      console.error("Get pending connections error:", error);
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  app.get("/api/connections/approved", requireAuth, async (req, res) => {
    try {
      const connections = await storage.getApprovedConnectionsForUser(req.session.userId!);
      res.json(connections);
    } catch (error) {
      console.error("Get approved connections error:", error);
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  app.post("/api/connections", requireAuth, async (req, res) => {
    try {
      const { toUserId, message, eventId } = req.body;
      const fromUserId = req.session.userId!;

      if (!toUserId) {
        return res.status(400).json({ error: "Target user ID required" });
      }

      // Check if connection already exists
      const existing = await storage.getConnectionBetweenUsers(fromUserId, toUserId);
      if (existing) {
        return res.status(400).json({ error: "Connection already exists", connection: existing });
      }

      const connection = await storage.createConnection({
        fromUserId,
        toUserId,
        message,
        eventId,
        status: "pending",
      });

      res.json(connection);
    } catch (error) {
      console.error("Create connection error:", error);
      res.status(500).json({ error: "Failed to create connection" });
    }
  });

  app.patch("/api/connections/:id/approve", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnection(connectionId);

      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      if (connection.toUserId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await storage.updateConnectionStatus(connectionId, "approved");
      res.json(updated);
    } catch (error) {
      console.error("Approve connection error:", error);
      res.status(500).json({ error: "Failed to approve connection" });
    }
  });

  app.patch("/api/connections/:id/decline", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnection(connectionId);

      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      if (connection.toUserId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await storage.updateConnectionStatus(connectionId, "declined");
      res.json(updated);
    } catch (error) {
      console.error("Decline connection error:", error);
      res.status(500).json({ error: "Failed to decline connection" });
    }
  });

  // =====================
  // MESSAGING ROUTES
  // =====================

  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const connections = await storage.getApprovedConnectionsForUser(userId);

      const conversations = await Promise.all(
        connections.map(async (conn) => {
          const otherUserId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
          const participant = await storage.getUserProfile(otherUserId);
          const messages = await storage.getMessagesByConnection(conn.id);
          const messageCount = messages.length;
          
          // Check if locked (non-premium user with 2+ messages)
          const isLocked = !user?.isPremium && messageCount >= FREE_MESSAGE_LIMIT;

          const lastMessage = messages[messages.length - 1];

          return {
            connectionId: conn.id,
            participant,
            messages,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.createdAt,
            unreadCount: 0, // Simplified for MVP
            isLocked,
            messageCount,
          };
        })
      );

      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:connectionId/messages", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);

      const connection = await storage.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (connection.fromUserId !== userId && connection.toUserId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (connection.status !== "approved") {
        return res.status(403).json({ error: "Connection not approved" });
      }

      const messages = await storage.getMessagesByConnection(connectionId);
      const messageCount = messages.length;
      const isLocked = !user?.isPremium && messageCount >= FREE_MESSAGE_LIMIT;

      res.json({ messages, isLocked, messageCount });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:connectionId/messages", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      const userId = req.session.userId!;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Message content required" });
      }

      const connection = await storage.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (connection.fromUserId !== userId && connection.toUserId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (connection.status !== "approved") {
        return res.status(403).json({ error: "Connection not approved" });
      }

      // Check message limit for non-premium users
      const user = await storage.getUser(userId);
      const messageCount = await storage.getMessageCountForConnection(connectionId);

      if (!user?.isPremium && messageCount >= FREE_MESSAGE_LIMIT) {
        return res.status(403).json({ 
          error: "Message limit reached",
          isLocked: true,
          message: "Upgrade to continue this conversation and unlock event coordination."
        });
      }

      const message = await storage.createMessage({
        connectionId,
        senderId: userId,
        content: content.trim(),
      });

      const newCount = messageCount + 1;
      const isLocked = !user?.isPremium && newCount >= FREE_MESSAGE_LIMIT;

      res.json({ message, isLocked, messageCount: newCount });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // =====================
  // MATCHING ROUTES
  // =====================

  app.get("/api/matches", requireAuth, async (req, res) => {
    try {
      const matches = await storage.getMatchesForUser(req.session.userId!);
      res.json(matches);
    } catch (error) {
      console.error("Get matches error:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get("/api/mentors", requireAuth, async (req, res) => {
    try {
      const mentors = await storage.getMentorsForBrowsing(req.session.userId!);
      console.log("Mentors with badges:", mentors.map(m => ({ email: m.email, badges: m.badges })));
      res.json(mentors);
    } catch (error) {
      console.error("Get mentors error:", error);
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  // =====================
  // BADGE ROUTES
  // =====================

  // Get all badges (public)
  app.get("/api/badges", async (req, res) => {
    try {
      const allBadges = await storage.getBadges();
      res.json(allBadges);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Get badges for a specific user
  app.get("/api/users/:id/badges", requireAuth, async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const viewerId = req.session.userId!;
      
      const profile = await storage.getUserProfileWithBadges(targetUserId, viewerId);
      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ badges: profile.badges || [] });
    } catch (error) {
      console.error("Get user badges error:", error);
      res.status(500).json({ error: "Failed to fetch user badges" });
    }
  });

  // Get user profile with badges (respects visibility rules)
  app.get("/api/users/:id/profile-with-badges", requireAuth, async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const viewerId = req.session.userId!;
      
      const profile = await storage.getUserProfileWithBadges(targetUserId, viewerId);
      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Get user profile with badges error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Admin-only: Award a badge to a user
  app.post("/api/badges/award", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId, badgeCode, metadata } = req.body;
      
      if (!userId || !badgeCode) {
        return res.status(400).json({ error: "userId and badgeCode are required" });
      }

      const badge = await storage.getBadgeByCode(badgeCode);
      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const userBadge = await storage.awardBadge(userId, badge.id, metadata);
      res.json({ success: true, userBadge });
    } catch (error) {
      console.error("Award badge error:", error);
      res.status(500).json({ error: "Failed to award badge" });
    }
  });

  // Admin-only: Revoke a badge from a user
  app.post("/api/badges/revoke", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId, badgeCode } = req.body;
      
      if (!userId || !badgeCode) {
        return res.status(400).json({ error: "userId and badgeCode are required" });
      }

      const badge = await storage.getBadgeByCode(badgeCode);
      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }

      await storage.revokeBadge(userId, badge.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Revoke badge error:", error);
      res.status(500).json({ error: "Failed to revoke badge" });
    }
  });

  // =====================
  // ADMIN ROUTES (Basic)
  // =====================

  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Basic stats for admin panel
      const events = await storage.getEvents();
      res.json({
        eventCount: events.length,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Register object storage routes
  registerObjectStorageRoutes(app);

  // Seed badges on server start
  const { seedBadges } = await import("./seed/seedBadges");
  await seedBadges();

  return httpServer;
}
