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
  UserProfileWithBadges
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

export async function getSuggestedMentors(): Promise<UserProfileWithBadges[]> {
  const res = await fetch("/api/mentors/suggested", { credentials: "include" });
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
