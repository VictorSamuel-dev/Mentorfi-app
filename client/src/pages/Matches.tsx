import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileCard } from "@/components/ProfileCard";
import { ConnectionRequest } from "@/components/ConnectionRequest";
import { ProfileDialog, type ProfileDialogData } from "@/components/ProfileDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Users, Bell, MapPin, Calendar, Unlock, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUnlockedMatches, getSuggestedMentors, getPendingConnections, requestConnection, approveConnection, declineConnection } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Redirect } from "wouter";
import type { UnlockedMatchData, UserProfileWithBadges, Connection } from "@shared/schema";
import { INDUSTRY_OPTIONS } from "@shared/schema";
import { format } from "date-fns";
import { UserBadge } from "@/components/UserBadge";

export default function Matches() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [searchText, setSearchText] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data: unlockedMatches = [], isLoading: matchesLoading } = useQuery<UnlockedMatchData[]>({
    queryKey: ["/api/matches/new"],
    queryFn: getUnlockedMatches,
    enabled: !!user,
  });

  const mentorFilters = {
    search: debouncedSearch || undefined,
    industry: industryFilter || undefined,
  };

  const { data: suggestedMentors = [], isLoading: mentorsLoading } = useQuery<UserProfileWithBadges[]>({
    queryKey: ["/api/mentors/suggested", mentorFilters],
    queryFn: () => getSuggestedMentors(mentorFilters),
    enabled: !!user && user.role === "mentee",
  });
  
  const hasActiveFilters = !!debouncedSearch || !!industryFilter;
  
  const clearFilters = () => {
    setSearchText("");
    setIndustryFilter("");
  };
  
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDialogData | null>(null);

  const { data: requests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/connections/pending"],
    queryFn: getPendingConnections,
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: (toUserId: string) => requestConnection(toUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentors/suggested"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/matches/new"] });
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
    const matchedProfile = unlockedMatches.find(m => m.person.id === profileId)?.person;
    const mentorProfile = suggestedMentors.find(m => m.id === profileId);
    const profile = matchedProfile || mentorProfile;
    
    if (profile) {
      setSelectedProfile({
        id: profile.id || "",
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: null,
        role: profile.role,
        company: profile.company,
        jobTitle: profile.jobTitle,
        interests: profile.interests,
        targetCompanies: profile.targetCompanies,
        profileImageUrl: profile.profileImageUrl,
        isPremium: null,
        badges: profile.badges,
        connectionStatus: profile.connectionStatus || "none",
      });
      setProfileDialogOpen(true);
    }
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
    return <Redirect to="/auth" />;
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
                <Unlock className="h-4 w-4" />
                New Matches
                {unlockedMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unlockedMatches.length}
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
              ) : unlockedMatches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Unlock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No matches yet</p>
                  <p className="text-sm max-w-md mx-auto">
                    Matches will appear here as mentors join and events are added. Complete your profile and add interests to improve matching.
                  </p>
                </div>
              ) : (
                unlockedMatches.map((match) => {
                  const person = match.person;
                  const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim() || "User";
                  const initials = `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase() || "U";
                  
                  return (
                    <Card key={match.matchId} data-testid={`card-match-${match.matchId}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={person.profileImageUrl || undefined} alt={fullName} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{fullName}</h3>
                              {person.badges?.map((badge) => (
                                <UserBadge key={badge.code} badge={badge} variant="icon" />
                              ))}
                            </div>
                            
                            {(person.jobTitle || person.company) && (
                              <p className="text-muted-foreground text-sm">
                                {person.jobTitle}{person.jobTitle && person.company ? " at " : ""}{person.company}
                              </p>
                            )}
                            
                            <div className="mt-3 p-3 bg-muted/50 rounded-md">
                              <div className="flex items-center gap-2 text-sm">
                                <Unlock className="h-4 w-4 text-primary" />
                                <span className="font-medium">Unlocked at:</span>
                                <span>{match.event.title}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                {match.event.startAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(match.event.startAt), "MMM d, yyyy")}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{match.event.location}</span>
                                </div>
                              </div>
                              <div className="mt-2 text-sm">
                                <Badge variant="secondary">{match.overlapScore} shared interests</Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {person.connectionStatus === "none" && (
                              <Button 
                                onClick={() => handleConnect(person.id)}
                                disabled={connectMutation.isPending}
                                data-testid={`button-connect-${person.id}`}
                              >
                                Connect
                              </Button>
                            )}
                            {person.connectionStatus === "pending" && (
                              <Button variant="secondary" disabled>
                                Pending
                              </Button>
                            )}
                            {person.connectionStatus === "approved" && (
                              <Button 
                                variant="secondary"
                                onClick={() => handleMessage(person.id)}
                                data-testid={`button-message-${person.id}`}
                              >
                                Message
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              onClick={() => handleViewProfile(person.id)}
                              data-testid={`button-view-profile-${person.id}`}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="mentors" className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap" data-testid="mentor-filters">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, company, or skill..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-9"
                    data-testid="input-mentor-search"
                  />
                </div>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-industry">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              {mentorsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : suggestedMentors.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    {hasActiveFilters ? "No mentors match your filters" : "Mentors will appear once approved"}
                  </p>
                  <p className="text-sm">
                    {hasActiveFilters 
                      ? "Try adjusting your search or clearing filters."
                      : "Our mentor network is growing. Add interests to your profile so we can match you when mentors join."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters} data-testid="button-clear-filters-empty">
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {suggestedMentors.map((mentor) => (
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
                        badges: mentor.badges,
                      }}
                      onConnect={() => handleConnect(mentor.id)}
                      onMessage={() => handleMessage(mentor.id)}
                      onViewProfile={() => handleViewProfile(mentor.id)}
                      isSuggested={true}
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
                        menteeGoals: request.from?.menteeGoals,
                        menteeGoalStatement: request.from?.menteeGoalStatement,
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
      
      <ProfileDialog
        profile={selectedProfile}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onConnect={handleConnect}
        onMessage={handleMessage}
      />
    </div>
  );
}
