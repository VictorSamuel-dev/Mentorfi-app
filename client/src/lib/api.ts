import { apiRequest, queryClient } from "./queryClient";
import type { 
  User, 
  Event, 
  EventWithAttendees, 
  UserProfile, 
  MatchData, 
  UnlockedMatchData,
  Connection,
  Message,
  ConversationData,
  EventAttendeesResponse,
  UserProfileWithBadges,
  Notification,
  Review,
  ReviewWithUser,
  Meeting,
  MeetingWithParticipant,
  MentorAnalytics,
} from "@shared/schema";

// Auth API
export async function register(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}): Promise<{ user: UserProfile }> {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
}

export async function login(email: string, password: string): Promise<{ user: UserProfile }> {
  const res = await apiRequest("POST", "/api/auth/login", { email, password });
  return res.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
  queryClient.clear();
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  const data = await res.json();
  return data.user;
}

// Profile API
export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await apiRequest("PATCH", "/api/users/profile", data);
  return res.json();
}

export async function upgradeToPremium(): Promise<UserProfile> {
  const res = await apiRequest("POST", "/api/users/upgrade");
  return res.json();
}

// Events API
export async function getEvents(): Promise<EventWithAttendees[]> {
  const res = await fetch("/api/events", { credentials: "include" });
  return res.json();
}

export async function rsvpToEvent(eventId: number): Promise<void> {
  await apiRequest("POST", `/api/events/${eventId}/rsvp`);
}

export async function cancelRsvp(eventId: number): Promise<void> {
  await apiRequest("DELETE", `/api/events/${eventId}/rsvp`);
}

export async function getEventVisibleAttendees(eventId: number): Promise<EventAttendeesResponse> {
  const res = await fetch(`/api/events/${eventId}/attendees-visible`, { credentials: "include" });
  return res.json();
}

// Connections API
export async function getPendingConnections(): Promise<Connection[]> {
  const res = await fetch("/api/connections/pending", { credentials: "include" });
  return res.json();
}

export async function requestConnection(toUserId: string, message?: string, eventId?: number): Promise<Connection> {
  const res = await apiRequest("POST", "/api/connections", { toUserId, message, eventId });
  return res.json();
}

export async function approveConnection(connectionId: number): Promise<Connection> {
  const res = await apiRequest("PATCH", `/api/connections/${connectionId}/approve`);
  return res.json();
}

export async function declineConnection(connectionId: number): Promise<Connection> {
  const res = await apiRequest("PATCH", `/api/connections/${connectionId}/decline`);
  return res.json();
}

// Matches API
export async function getMatches(): Promise<MatchData[]> {
  const res = await fetch("/api/matches", { credentials: "include" });
  return res.json();
}

export async function getUnlockedMatches(): Promise<UnlockedMatchData[]> {
  const res = await fetch("/api/matches/new", { credentials: "include" });
  return res.json();
}

export async function getMentors(): Promise<UserProfileWithBadges[]> {
  const res = await fetch("/api/mentors", { credentials: "include" });
  return res.json();
}

export async function getSuggestedMentors(filters?: { company?: string; industry?: string; interest?: string; search?: string }): Promise<UserProfileWithBadges[]> {
  const params = new URLSearchParams();
  if (filters?.company) params.set("company", filters.company);
  if (filters?.industry) params.set("industry", filters.industry);
  if (filters?.interest) params.set("interest", filters.interest);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  const res = await fetch(`/api/mentors/suggested${qs ? `?${qs}` : ""}`, { credentials: "include" });
  return res.json();
}

// Conversations/Messages API
export async function getConversations(): Promise<ConversationData[]> {
  const res = await fetch("/api/conversations", { credentials: "include" });
  return res.json();
}

export async function getMessages(connectionId: number): Promise<{ messages: Message[]; isLocked: boolean; messageCount: number }> {
  const res = await fetch(`/api/conversations/${connectionId}/messages`, { credentials: "include" });
  return res.json();
}

export async function sendMessage(connectionId: number, content: string): Promise<{ message: Message; isLocked: boolean; messageCount: number }> {
  const res = await apiRequest("POST", `/api/conversations/${connectionId}/messages`, { content });
  return res.json();
}

// Notifications API
export async function getNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications", { credentials: "include" });
  return res.json();
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
  const data = await res.json();
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiRequest("PATCH", `/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("POST", "/api/notifications/mark-all-read");
}

// Reviews API
export async function createReview(data: { connectionId: number; revieweeId: string; rating: number; comment?: string }): Promise<Review> {
  const res = await apiRequest("POST", "/api/reviews", data);
  return res.json();
}

export async function getReviewsForUser(userId: string): Promise<{ reviews: ReviewWithUser[]; averageRating: number; totalReviews: number }> {
  const res = await fetch(`/api/reviews/user/${userId}`, { credentials: "include" });
  return res.json();
}

export async function getReviewForConnection(connectionId: number): Promise<{ review: Review | null }> {
  const res = await fetch(`/api/reviews/connection/${connectionId}`, { credentials: "include" });
  return res.json();
}

// Meetings API
export async function createMeeting(data: { connectionId: number; title: string; scheduledAt: string; durationMinutes?: number; format?: string; location?: string; notes?: string }): Promise<Meeting> {
  const res = await apiRequest("POST", "/api/meetings", data);
  return res.json();
}

export async function getMeetings(): Promise<MeetingWithParticipant[]> {
  const res = await fetch("/api/meetings", { credentials: "include" });
  return res.json();
}

export async function updateMeetingStatus(id: number, status: string): Promise<Meeting> {
  const res = await apiRequest("PATCH", `/api/meetings/${id}/status`, { status });
  return res.json();
}

// Analytics API
export async function getMentorAnalytics(): Promise<MentorAnalytics> {
  const res = await fetch("/api/analytics/mentor", { credentials: "include" });
  return res.json();
}

export async function logProfileView(userId: string): Promise<void> {
  await apiRequest("POST", "/api/analytics/profile-view", { userId });
}
