import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/components/EventCard";
import { MatchNotification } from "@/components/MatchNotification";
import { ProfileDialog, type ProfileDialogData } from "@/components/ProfileDialog";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { Link, useLocation } from "wouter";
import { Calendar, Users, MessageSquare, ArrowRight, Sparkles, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getEvents, getUnlockedMatches, getConversations, cancelRsvp, rsvpToEvent } from "@/lib/api";
import { getProfileCompleteness } from "@shared/schema";
import type { EventWithAttendees, UnlockedMatchData, ConversationData, Event, Connection } from "@shared/schema";

interface CareerInsight {
  pattern: string;
  description: string;
  relevantMentorCount: number;
}

async function getApprovedConnections(): Promise<Connection[]> {
  const res = await fetch("/api/connections/approved", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch connections");
  return res.json();
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventWithAttendees[]>({
    queryKey: ["/api/events"],
    queryFn: getEvents,
    enabled: !!user,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<UnlockedMatchData[]>({
    queryKey: ["/api/matches/new"],
    queryFn: getUnlockedMatches,
    enabled: !!user,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationData[]>({
    queryKey: ["/api/conversations"],
    queryFn: getConversations,
    enabled: !!user,
  });

  const { data: approvedConnections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections/approved"],
    queryFn: getApprovedConnections,
    enabled: !!user,
  });

  const [selectedProfile, setSelectedProfile] = useState<ProfileDialogData | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const { toast } = useToast();

  const [careerInsights, setCareerInsights] = useState<CareerInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  const handleGetInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/ai/career-insights", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCareerInsights(data.insights || []);
      setInsightsLoaded(true);
    } catch {
      toast({ title: "Could not load career insights", variant: "destructive" });
    } finally {
      setInsightsLoading(false);
    }
  };

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, isAttending }: { eventId: number; isAttending: boolean }) => {
      if (isAttending) {
        await cancelRsvp(eventId);
      } else {
        await rsvpToEvent(eventId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "RSVP Updated",
        description: "Your RSVP status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRSVP = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      rsvpMutation.mutate({ eventId, isAttending: event.isAttending });
    }
  };

  const handleEventViewDetails = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event as Event);
      setEventDialogOpen(true);
    }
  };

  const handleViewProfile = (userId: string) => {
    const match = matches.find(m => m.person.id === userId);
    if (match) {
      setSelectedProfile({
        id: match.person.id,
        firstName: match.person.firstName,
        lastName: match.person.lastName,
        email: null,
        role: match.person.role,
        company: match.person.company || null,
        jobTitle: match.person.jobTitle || null,
        interests: match.person.interests || null,
        targetCompanies: match.person.targetCompanies || null,
        profileImageUrl: match.person.profileImageUrl || null,
        isPremium: null,
        badges: match.person.badges,
        connectionStatus: match.person.connectionStatus || "none",
      });
      setProfileDialogOpen(true);
    }
  };

  const handleViewEvent = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event as Event);
      setEventDialogOpen(true);
    } else {
      const match = matches.find(m => m.event?.id === eventId);
      if (match?.event) {
        setSelectedEvent({
          id: match.event.id,
          name: match.event.title,
          date: match.event.startAt || new Date(),
          description: null,
          location: match.event.location || "",
          isVirtual: false,
          type: "career_fair",
          company: null,
          industry: null,
          createdAt: null,
        } as Event);
        setEventDialogOpen(true);
      }
    }
  };

  const handleConnect = (userId: string) => {
    setProfileDialogOpen(false);
    setLocation("/matches");
  };

  const handleMessage = (userId: string) => {
    setProfileDialogOpen(false);
    setLocation("/messages");
  };

  if (authLoading) {
    return null;
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const myEvents = events.filter((e) => e.isAttending);
  const unreadMessages = conversations.filter((c) => c.unreadCount > 0).length;

  const stats = [
    { label: "Upcoming Events", value: myEvents.length, icon: Calendar, href: "/events" },
    { label: "New Matches", value: matches.length, icon: Sparkles, href: "/matches" },
    { label: "Connections", value: approvedConnections.length, icon: Users, href: "/connections" },
    { label: "Unread Messages", value: unreadMessages, icon: MessageSquare, href: "/messages" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} notificationCount={matches.length} role={user.role} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, {user.firstName || "there"}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your mentorship journey
            </p>
          </div>

          {(() => {
            const { percent, missingFields } = getProfileCompleteness(user);
            if (percent >= 100) return null;
            return (
              <Card className="mb-6 border-primary/20" data-testid="card-profile-completion">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        Your profile is {percent}% complete
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {missingFields.length <= 3
                          ? `Add your ${missingFields.join(", ").toLowerCase()} to get better matches.`
                          : `Complete ${missingFields.length} more fields to get the best matches.`}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <Link href={user.role === "mentor" && !user.onboardingComplete ? "/onboarding" : "/profile"}>
                          <Button size="sm" variant="outline" data-testid="button-complete-profile">
                            Complete profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover-elevate cursor-pointer" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                      {stat.value > 0 && (
                        <Badge variant="secondary">{stat.value}</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Upcoming Events</h2>
                <Link href="/events">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {eventsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              ) : myEvents.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming events yet</p>
                    <p className="text-sm mt-1">Events will appear here as they are added</p>
                    <Link href="/events">
                      <Button variant="ghost" className="mt-2">Browse events</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myEvents.slice(0, 2).map((event) => (
                    <EventCard
                      key={event.id}
                      event={{
                        ...event,
                        industry: event.industry || [],
                        isVirtual: event.isVirtual ?? false,
                      }}
                      onRSVP={handleRSVP}
                      onViewDetails={handleEventViewDetails}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Matches</h2>
                <Link href="/matches">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {matchesLoading ? (
                <Skeleton className="h-48" />
              ) : matches.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No matches yet</p>
                    <p className="text-sm mt-1">Matches will appear as mentors and events are added</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 3).map((match) => (
                    <MatchNotification
                      key={match.matchId}
                      match={{
                        id: String(match.matchId),
                        event: match.event ? {
                          id: match.event.id,
                          name: match.event.title,
                          date: match.event.startAt ? new Date(match.event.startAt) : new Date(),
                        } : undefined,
                        contextLabels: match.contextLabels || [],
                        sharedInterests: match.person.interests || [],
                        sharedCompany: match.person.company || undefined,
                        matchedUser: {
                          id: match.person.id || "",
                          firstName: match.person.firstName || "",
                          lastName: match.person.lastName || "",
                          role: (match.person.role as "mentor" | "mentee") || "mentor",
                          company: match.person.company || undefined,
                          jobTitle: match.person.jobTitle || undefined,
                          profileImageUrl: match.person.profileImageUrl || undefined,
                          badges: match.person.badges,
                        },
                      }}
                      onViewProfile={handleViewProfile}
                      onViewEvent={handleViewEvent}
                    />
                  ))}
                </div>
              )}

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/events">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Calendar className="h-4 w-4" />
                      Browse upcoming events
                    </Button>
                  </Link>
                  <Link href="/matches">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      Find mentors
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Check messages
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {user.role === "mentee" && (
                <Card className="mt-4" data-testid="card-career-insights">
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Career Insights
                    </CardTitle>
                    {!insightsLoaded && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={handleGetInsights}
                        disabled={insightsLoading}
                        data-testid="button-get-insights"
                      >
                        {insightsLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {insightsLoading ? "Analyzing..." : "Get AI Insights"}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!insightsLoaded && !insightsLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Get personalized career insights based on your mentor network and interests.
                      </p>
                    ) : insightsLoading ? (
                      <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analyzing your career data...</span>
                      </div>
                    ) : careerInsights.length > 0 ? (
                      <div className="space-y-3">
                        {careerInsights.map((insight, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium">{insight.pattern}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {insight.relevantMentorCount} mentors
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {selectedProfile && (
        <ProfileDialog
          profile={selectedProfile}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          onConnect={handleConnect}
          onMessage={handleMessage}
        />
      )}

      <EventDetailsDialog
        event={selectedEvent}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        isAuthenticated={!!user}
      />
    </div>
  );
}
