import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertConnectionSchema, insertMessageSchema } from "@shared/schema";
import { comparePasswords, hashPassword } from "./utils/password";
import "./types";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { emailService } from "./emailService";

// Message limit for free users
const FREE_MESSAGE_LIMIT = 4;

// Auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Admin middleware
async function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const user = await storage.getUser(req.session.userId);
  if (user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // =====================
  // PUBLIC STATS
  // =====================
  
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Get platform stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

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

      if (user.email) {
        emailService.sendWelcomeEmail(
          user.email,
          user.firstName || "there",
          user.role || "mentee"
        ).catch(() => {});
      }

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

  app.post("/api/auth/change-email", requireAuth, async (req, res) => {
    try {
      const { newEmail, password } = req.body;

      if (!newEmail || !password) {
        return res.status(400).json({ message: "New email and password are required" });
      }

      const emailSchema = z.string().email();
      const emailResult = emailSchema.safeParse(newEmail);
      if (!emailResult.success) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      if (newEmail.toLowerCase() === user.email?.toLowerCase()) {
        return res.status(400).json({ message: "New email must be different from your current email" });
      }

      const existing = await storage.getUserByEmail(newEmail);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      await storage.updateUser(req.session.userId!, { email: newEmail });

      res.json({ success: true });
    } catch (error) {
      console.error("Change email error:", error);
      res.status(500).json({ message: "Failed to change email" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const valid = await comparePasswords(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(req.session.userId!, hashedPassword);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
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
      const { 
        firstName, lastName, company, jobTitle, interests, targetCompanies, profileImageUrl,
        school, program, gradYear,
        menteeGoals, menteeGoalStatement,
        industry, yearsExperience, expertise, bio,
        maxConnectionsPerQuarter, preferredFormats, requiredMaterials,
        onboardingComplete, role
      } = req.body;
      
      // Validate menteeGoals (max 3, must be from allowed options)
      let normalizedGoals: string[] | undefined;
      if (menteeGoals !== undefined) {
        if (!Array.isArray(menteeGoals)) {
          return res.status(400).json({ error: "menteeGoals must be an array" });
        }
        // Filter to only allowed options, trim, and limit to 3
        const { MENTEE_GOAL_OPTIONS } = await import("@shared/schema");
        const allowedSet = new Set(MENTEE_GOAL_OPTIONS);
        normalizedGoals = menteeGoals
          .filter((g: unknown) => typeof g === "string" && allowedSet.has(g.trim()))
          .slice(0, 3);
      }
      
      // Validate menteeGoalStatement (max 200 chars)
      let normalizedStatement: string | undefined;
      if (menteeGoalStatement !== undefined) {
        if (typeof menteeGoalStatement !== "string") {
          return res.status(400).json({ error: "menteeGoalStatement must be a string" });
        }
        normalizedStatement = menteeGoalStatement.trim().slice(0, 200);
      }
      
      const validRole = role === 'mentor' || role === 'mentee' ? role : undefined;

      const updated = await storage.updateUser(req.session.userId!, {
        firstName,
        lastName,
        company,
        jobTitle,
        interests,
        targetCompanies,
        profileImageUrl,
        school,
        program,
        gradYear,
        menteeGoals: normalizedGoals,
        menteeGoalStatement: normalizedStatement,
        industry,
        yearsExperience,
        expertise,
        bio,
        maxConnectionsPerQuarter,
        preferredFormats,
        requiredMaterials,
        onboardingComplete,
        ...(validRole ? { role: validRole } : {}),
      });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate interest-based matches after profile update
      await storage.generateInterestBasedMatches(req.session.userId!);

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
  // STRIPE ROUTES
  // =====================

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Stripe publishable key error:", error);
      res.status(500).json({ error: "Failed to get Stripe key" });
    }
  });

  app.get("/api/stripe/products", async (_req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      const productsMap = new Map<string, any>();
      for (const row of rows) {
        const r = row as any;
        if (!productsMap.has(r.product_id)) {
          productsMap.set(r.product_id, {
            id: r.product_id,
            name: r.product_name,
            description: r.product_description,
            active: r.product_active,
            metadata: r.product_metadata,
            prices: []
          });
        }
        if (r.price_id) {
          productsMap.get(r.product_id).prices.push({
            id: r.price_id,
            unit_amount: r.unit_amount,
            currency: r.currency,
            recurring: r.recurring,
            active: r.price_active,
          });
        }
      }
      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Stripe products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/stripe/checkout", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        console.error("Checkout: user not found for session userId:", req.session.userId);
        return res.status(404).json({ error: "User not found" });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        try {
          const customer = await stripeService.createCustomer(user.email, user.id);
          await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
          customerId = customer.id;
        } catch (custErr: any) {
          console.error("Stripe customer creation failed:", custErr?.message || custErr);
          return res.status(500).json({ error: "Failed to create Stripe customer" });
        }
      }

      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const baseUrl = `${proto}://${host}`;

      const checkoutSession = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/premium?success=true`,
        `${baseUrl}/premium?canceled=true`,
        user.id
      );

      res.json({ url: checkoutSession.url });
    } catch (error: any) {
      console.error("Checkout error:", error?.message || error);
      if (error?.raw) {
        console.error("Stripe API error:", error.raw.message, "code:", error.raw.code, "status:", error.raw.statusCode);
      }
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.get("/api/stripe/subscription", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }
      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription });
    } catch (error) {
      console.error("Subscription fetch error:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  app.post("/api/stripe/sync-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.stripeCustomerId) {
        return res.json({ isPremium: false, synced: false });
      }

      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const subsResult = await db.execute(
        sql`SELECT id, status FROM stripe.subscriptions WHERE customer = ${user.stripeCustomerId} AND status IN ('active', 'trialing') LIMIT 1`
      );

      const activeSub = subsResult.rows[0] as any;

      if (activeSub && !user.isPremium) {
        await storage.updateUserStripeInfo(user.id, { stripeSubscriptionId: activeSub.id });
        await storage.upgradeToPremium(user.id);
        return res.json({ isPremium: true, synced: true });
      }

      if (!activeSub && user.isPremium) {
        await storage.downgradeFromPremium(user.id);
        return res.json({ isPremium: false, synced: true });
      }

      return res.json({ isPremium: user.isPremium || false, synced: false });
    } catch (error) {
      console.error("Stripe sync status error:", error);
      res.status(500).json({ error: "Failed to sync status" });
    }
  });

  app.post("/api/stripe/portal", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const portalSession = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${req.protocol}://${req.get('host')}/premium`
      );

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Portal session error:", error);
      res.status(500).json({ error: "Failed to create portal session" });
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

  app.post("/api/events", requireAdmin, async (req, res) => {
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
      const { status = "going" } = req.body;

      if (!["going", "not_going"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'going' or 'not_going'" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const rsvp = await storage.upsertRsvp(userId, eventId, status);
      
      // Generate matches for this event after RSVP (only if going)
      if (status === "going") {
        await storage.upsertEventMatchesForEvent(eventId);
      }
      
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

  app.get("/api/connections/approved/enriched", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const connections = await storage.getApprovedConnectionsForUser(userId);
      
      const enriched = await Promise.all(
        connections.map(async (conn) => {
          const otherUserId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
          const otherUser = await storage.getUserProfile(otherUserId);
          const event = conn.eventId ? await storage.getEvent(conn.eventId) : undefined;
          
          let contextLabel: string | undefined;
          if (event) {
            contextLabel = `Connected via ${event.name}`;
          } else if (conn.message) {
            contextLabel = "Matched by goals/interests";
          }
          
          return {
            connection: conn,
            otherUser,
            contextLabel,
          };
        })
      );
      
      res.json(enriched.filter(e => e.otherUser));
    } catch (error) {
      console.error("Get enriched approved connections error:", error);
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

      const mentor = await storage.getUser(toUserId);
      const mentee = await storage.getUser(fromUserId);
      
      await storage.createNotification({
        userId: toUserId,
        type: "connection_request",
        title: "New Connection Request",
        content: `${mentee?.firstName || "A mentee"} has requested to connect with you.`,
        entityType: "connection",
        entityId: connection.id,
        isRead: false,
      });

      if (mentor?.email && mentee) {
        emailService.sendConnectionRequestEmail(
          mentor.email,
          mentor.firstName || "Mentor",
          `${mentee.firstName || ""} ${mentee.lastName || ""}`.trim() || "A mentee",
          message
        ).catch(() => {});
      }

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

      // Check mentor capacity
      const mentor = await storage.getUser(req.session.userId!);
      const maxConnections = mentor?.maxConnectionsPerQuarter || 2;
      const currentConnections = await storage.getMentorApprovedConnectionsInQuarter(req.session.userId!);
      
      if (currentConnections >= maxConnections) {
        return res.status(409).json({ 
          error: "You've reached your mentoring capacity for this quarter.",
          currentConnections,
          maxConnections
        });
      }

      const updated = await storage.updateConnectionStatus(connectionId, "approved");
      
      await storage.createNotification({
        userId: connection.fromUserId,
        type: "connection_approved",
        title: "Connection Approved",
        content: `${mentor?.firstName || "Your mentor"} has approved your connection request. You can now start messaging!`,
        entityType: "connection",
        entityId: connectionId,
        isRead: false,
      });

      await storage.logAnalyticsEvent({
        userId: req.session.userId!,
        eventType: "connection_approved",
        subjectUserId: connection.fromUserId,
        connectionId,
      });
      
      const mentee = await storage.getUser(connection.fromUserId);
      if (mentee?.email) {
        emailService.sendConnectionApprovedEmail(
          mentee.email,
          mentee.firstName || "there",
          `${mentor?.firstName || ""} ${mentor?.lastName || ""}`.trim() || "Your mentor"
        ).catch(() => {});
      }
      
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

      const otherUserId = connection.fromUserId === userId ? connection.toUserId : connection.fromUserId;
      const sender = await storage.getUser(userId);
      await storage.createNotification({
        userId: otherUserId,
        type: "new_message",
        title: "New Message",
        content: `${sender?.firstName || "Someone"} sent you a message.`,
        entityType: "message",
        entityId: connectionId,
        isRead: false,
      });

      const recipient = await storage.getUser(otherUserId);
      if (recipient?.email) {
        emailService.sendNewMessageEmail(
          recipient.email,
          recipient.firstName || "there",
          `${sender?.firstName || ""} ${sender?.lastName || ""}`.trim() || "Someone"
        ).catch(() => {});
      }

      await storage.logAnalyticsEvent({
        userId,
        eventType: "message_sent",
        subjectUserId: otherUserId,
        connectionId,
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

  // Get unlocked matches (event-based)
  app.get("/api/matches/new", requireAuth, async (req, res) => {
    try {
      const matches = await storage.getUnlockedMatchesForUser(req.session.userId!);
      res.json(matches);
    } catch (error) {
      console.error("Get unlocked matches error:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get("/api/mentors", requireAuth, async (req, res) => {
    try {
      const mentors = await storage.getMentorsForBrowsing(req.session.userId!);
      res.json(mentors);
    } catch (error) {
      console.error("Get mentors error:", error);
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  // Get suggested mentors (interest-based, no shared event required, supports filtering)
  app.get("/api/mentors/suggested", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "mentee") {
        return res.status(403).json({ error: "Only mentees can view suggested mentors" });
      }
      
      const filters = {
        company: req.query.company as string | undefined,
        industry: req.query.industry as string | undefined,
        interest: req.query.interest as string | undefined,
        search: req.query.search as string | undefined,
      };
      
      const mentors = await storage.getSuggestedMentors(req.session.userId!, filters);
      res.json(mentors);
    } catch (error) {
      console.error("Get suggested mentors error:", error);
      res.status(500).json({ error: "Failed to fetch suggested mentors" });
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
  // NOTIFICATION ROUTES
  // =====================

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifs = await storage.getNotificationsForUser(req.session.userId!);
      res.json(notifs);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to fetch count" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(parseInt(req.params.id), req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  // =====================
  // REVIEW ROUTES
  // =====================

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const { connectionId, revieweeId, rating, comment } = req.body;
      const reviewerId = req.session.userId!;

      if (!connectionId || !revieweeId || !rating) {
        return res.status(400).json({ error: "connectionId, revieweeId, and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const connection = await storage.getConnection(connectionId);
      if (!connection || connection.status !== "approved") {
        return res.status(400).json({ error: "Connection must be approved to leave a review" });
      }

      if (connection.fromUserId !== reviewerId && connection.toUserId !== reviewerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const existing = await storage.getReviewForConnection(connectionId, reviewerId);
      if (existing) {
        return res.status(400).json({ error: "You already reviewed this connection" });
      }

      const review = await storage.createReview({
        connectionId,
        reviewerId,
        revieweeId,
        rating,
        comment: comment?.trim() || null,
      });

      const reviewer = await storage.getUser(reviewerId);
      await storage.createNotification({
        userId: revieweeId,
        type: "review_received",
        title: "New Review",
        content: `${reviewer?.firstName || "Someone"} left you a ${rating}-star review.`,
        entityType: "review",
        entityId: review.id,
        isRead: false,
      });

      const reviewee = await storage.getUser(revieweeId);
      if (reviewee?.email) {
        emailService.sendReviewReceivedEmail(
          reviewee.email,
          reviewee.firstName || "there",
          `${reviewer?.firstName || ""} ${reviewer?.lastName || ""}`.trim() || "Someone",
          rating
        ).catch(() => {});
      }

      await storage.logAnalyticsEvent({
        userId: reviewerId,
        eventType: "review_submitted",
        subjectUserId: revieweeId,
        connectionId,
      });

      res.json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/reviews/user/:userId", requireAuth, async (req, res) => {
    try {
      const reviews = await storage.getReviewsForUser(req.params.userId);
      const rating = await storage.getAverageRating(req.params.userId);
      res.json({ reviews, averageRating: rating.average, totalReviews: rating.count });
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/connection/:connectionId", requireAuth, async (req, res) => {
    try {
      const review = await storage.getReviewForConnection(
        parseInt(req.params.connectionId),
        req.session.userId!
      );
      res.json({ review: review || null });
    } catch (error) {
      console.error("Get review for connection error:", error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });

  // =====================
  // MEETING ROUTES
  // =====================

  app.post("/api/meetings", requireAuth, async (req, res) => {
    try {
      const { connectionId, title, scheduledAt, durationMinutes, format, location, notes } = req.body;
      const schedulerId = req.session.userId!;

      if (!connectionId || !title || !scheduledAt) {
        return res.status(400).json({ error: "connectionId, title, and scheduledAt are required" });
      }

      const connection = await storage.getConnection(connectionId);
      if (!connection || connection.status !== "approved") {
        return res.status(400).json({ error: "Connection must be approved to schedule a meeting" });
      }

      if (connection.fromUserId !== schedulerId && connection.toUserId !== schedulerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const meeting = await storage.createMeeting({
        connectionId,
        schedulerId,
        title,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 30,
        format: format || "video_call",
        location: location || null,
        notes: notes || null,
        status: "scheduled",
      });

      const otherUserId = connection.fromUserId === schedulerId ? connection.toUserId : connection.fromUserId;
      const scheduler = await storage.getUser(schedulerId);
      await storage.createNotification({
        userId: otherUserId,
        type: "meeting_scheduled",
        title: "Meeting Scheduled",
        content: `${scheduler?.firstName || "Someone"} scheduled a meeting: "${title}"`,
        entityType: "meeting",
        entityId: meeting.id,
        isRead: false,
      });

      const otherUser = await storage.getUser(otherUserId);
      if (otherUser?.email) {
        emailService.sendMeetingScheduledEmail(
          otherUser.email,
          otherUser.firstName || "there",
          `${scheduler?.firstName || ""} ${scheduler?.lastName || ""}`.trim() || "Someone",
          title,
          scheduledAt,
          format || "video_call"
        ).catch(() => {});
      }

      await storage.logAnalyticsEvent({
        userId: schedulerId,
        eventType: "meeting_scheduled",
        subjectUserId: otherUserId,
        connectionId,
      });

      res.json(meeting);
    } catch (error) {
      console.error("Create meeting error:", error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.get("/api/meetings", requireAuth, async (req, res) => {
    try {
      const meetingsList = await storage.getMeetingsForUser(req.session.userId!);
      res.json(meetingsList);
    } catch (error) {
      console.error("Get meetings error:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.patch("/api/meetings/:id/status", requireAuth, async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'completed' or 'cancelled'" });
      }

      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const connection = await storage.getConnection(meeting.connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      const userId = req.session.userId!;
      if (connection.fromUserId !== userId && connection.toUserId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await storage.updateMeetingStatus(meetingId, status);

      const otherUserId = connection.fromUserId === userId ? connection.toUserId : connection.fromUserId;
      const user = await storage.getUser(userId);
      await storage.createNotification({
        userId: otherUserId,
        type: "meeting_updated",
        title: `Meeting ${status === "completed" ? "Completed" : "Cancelled"}`,
        content: `${user?.firstName || "Someone"} marked the meeting "${meeting.title}" as ${status}.`,
        entityType: "meeting",
        entityId: meetingId,
        isRead: false,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update meeting status error:", error);
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  // =====================
  // ANALYTICS ROUTES
  // =====================

  app.get("/api/analytics/mentor", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "mentor") {
        return res.status(403).json({ error: "Mentor access required" });
      }
      const analytics = await storage.getMentorAnalytics(req.session.userId!);
      res.json(analytics);
    } catch (error) {
      console.error("Get mentor analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics/profile-view", requireAuth, async (req, res) => {
    try {
      const { userId: viewedUserId } = req.body;
      if (!viewedUserId || viewedUserId === req.session.userId) {
        return res.json({ success: true });
      }
      await storage.logAnalyticsEvent({
        userId: req.session.userId!,
        eventType: "profile_view",
        subjectUserId: viewedUserId,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Log profile view error:", error);
      res.status(500).json({ error: "Failed to log view" });
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

  // Comprehensive admin metrics endpoint
  app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
    try {
      const metrics = await storage.getAdminMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Admin metrics error:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Register object storage routes
  registerObjectStorageRoutes(app);

  // ── Enterprise lead endpoint ──────────────────────────────────────
  const enterpriseRateLimit = new Map<string, number[]>();

  app.post("/api/enterprise/lead", async (req: Request, res: Response) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      // Rate limit: max 3 submissions per IP per hour
      const now = Date.now();
      const windowMs = 60 * 60 * 1000;
      const timestamps = (enterpriseRateLimit.get(ip) || []).filter(t => now - t < windowMs);
      if (timestamps.length >= 3) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
      }

      // Honeypot check
      if (req.body.website) {
        return res.status(200).json({ success: true });
      }

      const schema = z.object({
        fullName: z.string().min(1, "Full name is required").max(200),
        workEmail: z.string().email("Valid work email is required").max(320),
        organization: z.string().min(1, "Organization is required").max(200),
        roleTitle: z.string().max(200).optional().default(""),
        estimatedUsers: z.enum(["<100", "100-500", "500-2000", "2000+"]),
        notes: z.string().max(2000).optional().default(""),
        website: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid form data", details: parsed.error.flatten().fieldErrors });
      }

      const { fullName, workEmail, organization, roleTitle, estimatedUsers, notes } = parsed.data;

      timestamps.push(now);
      enterpriseRateLimit.set(ip, timestamps);

      emailService.sendEnterpriseleadNotification({
        fullName,
        workEmail,
        organization,
        roleTitle: roleTitle || undefined,
        estimatedUsers,
        notes: notes || undefined,
      }).catch(() => {});

      console.log(`[Enterprise Lead] ${fullName} from ${organization} (${workEmail})`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Enterprise Lead] Error:", err.message);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  });

  // Seed badges on server start
  const { seedBadges } = await import("./seed/seedBadges");
  await seedBadges();

  return httpServer;
}
