import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileCard } from "@/components/ProfileCard";
import { MatchNotification } from "@/components/MatchNotification";
import { ConnectionRequest } from "@/components/ConnectionRequest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Users, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getMatches, getMentors, getPendingConnections, requestConnection, approveConnection, declineConnection } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { MatchData, UserProfile, Connection } from "@shared/schema";

export default function Matches() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: matches = [], isLoading: matchesLoading } = useQuery<MatchData[]>({
    queryKey: ["/api/matches"],
    queryFn: getMatches,
    enabled: !!user,
  });

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/mentors"],
    queryFn: getMentors,
    enabled: !!user,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/connections/pending"],
    queryFn: getPendingConnections,
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: (toUserId: string) => requestConnection(toUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
      toast({ title: "Connection request sent!" });
    },
    onError: () => {
      toast({ title: "Failed to send request", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (connectionId: number) => approveConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "Connection approved!" });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (connectionId: number) => declineConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({ title: "Connection declined" });
    },
    onError: () => {
      toast({ title: "Failed to decline", variant: "destructive" });
    },
  });

  const handleConnect = (profileId: string) => {
    connectMutation.mutate(profileId);
  };

  const handleMessage = (profileId: string) => {
    setLocation("/messages");
  };

  const handleViewProfile = (profileId: string) => {
    console.log("View profile:", profileId);
  };

  const handleApprove = (requestId: number) => {
    approveMutation.mutate(requestId);
  };

  const handleDecline = (requestId: number) => {
    declineMutation.mutate(requestId);
  };

  if (authLoading) {
    return null;
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} notificationCount={requests.length} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Matches & Connections</h1>
            <p className="text-muted-foreground">
              Connect with mentors who share your interests and events
            </p>
          </div>

          <Tabs defaultValue="matches" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matches" className="gap-2" data-testid="tab-matches">
                <Sparkles className="h-4 w-4" />
                New Matches
                {matches.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {matches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mentors" className="gap-2" data-testid="tab-mentors">
                <Users className="h-4 w-4" />
                Browse Mentors
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2" data-testid="tab-requests">
                <Bell className="h-4 w-4" />
                Requests
                {requests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="space-y-4">
              {matchesLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No new matches</p>
                  <p className="text-sm">
                    RSVP to more events to find mentors with shared interests
                  </p>
                </div>
              ) : (
                matches.map((match) => (
                  <MatchNotification
                    key={match.id}
                    match={{
                      ...match,
                      matchedUser: {
                        id: match.matchedUser.id || "",
                        firstName: match.matchedUser.firstName || "",
                        lastName: match.matchedUser.lastName || "",
                        role: (match.matchedUser.role as "mentor" | "mentee") || "mentor",
                        company: match.matchedUser.company || undefined,
                        jobTitle: match.matchedUser.jobTitle || undefined,
                        profileImageUrl: match.matchedUser.profileImageUrl || undefined,
                      },
                    }}
                    onViewProfile={(id) => handleViewProfile(id)}
                    onViewEvent={(eventId) => console.log("View event:", eventId)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="mentors" className="space-y-4">
              {mentorsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : mentors.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No mentors available</p>
                  <p className="text-sm">Check back later for new mentors</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {mentors.map((mentor) => (
                    <ProfileCard
                      key={mentor.id}
                      profile={{
                        id: mentor.id || "",
                        firstName: mentor.firstName || "",
                        lastName: mentor.lastName || "",
                        role: (mentor.role as "mentor" | "mentee") || "mentor",
                        company: mentor.company || undefined,
                        jobTitle: mentor.jobTitle || undefined,
                        interests: mentor.interests || [],
                        profileImageUrl: mentor.profileImageUrl || undefined,
                        isVerified: mentor.isVerified ?? false,
                        connectionStatus: mentor.connectionStatus || "none",
                      }}
                      onConnect={() => handleConnect(mentor.id)}
                      onMessage={() => handleMessage(mentor.id)}
                      onViewProfile={() => handleViewProfile(mentor.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {requestsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-36" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-sm">Connection requests will appear here</p>
                </div>
              ) : (
                requests.map((request) => (
                  <ConnectionRequest
                    key={request.id}
                    request={{
                      id: request.id,
                      from: {
                        id: request.from?.id || "",
                        firstName: request.from?.firstName || "",
                        lastName: request.from?.lastName || "",
                        role: (request.from?.role as "mentor" | "mentee") || "mentee",
                        company: request.from?.company,
                        profileImageUrl: request.from?.profileImageUrl,
                      },
                      message: request.message,
                      sharedEvent: request.event?.name,
                      sharedInterests: [],
                      requestedAt: new Date(request.createdAt),
                    }}
                    onApprove={handleApprove}
                    onDecline={handleDecline}
                    onViewProfile={(id) => handleViewProfile(id)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
