import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileCard, type ProfileData } from "@/components/ProfileCard";
import { MatchNotification, type MatchData } from "@/components/MatchNotification";
import { ConnectionRequest, type ConnectionRequestData } from "@/components/ConnectionRequest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Bell } from "lucide-react";

// todo: remove mock functionality
const mockUser = {
  firstName: "Jordan",
  lastName: "Smith",
  email: "jordan.smith@university.edu",
  profileImageUrl: undefined,
};

const mockMatches: MatchData[] = [
  {
    id: 1,
    matchedUser: {
      id: 2,
      firstName: "Sarah",
      lastName: "Chen",
      role: "mentor",
      company: "Google",
      jobTitle: "Senior Product Manager",
    },
    event: {
      id: 1,
      name: "Tech Career Fair 2024",
      date: new Date(2024, 11, 20, 10, 0),
    },
    sharedInterests: ["Product Management", "AI/ML"],
    sharedCompany: "Google",
  },
  {
    id: 2,
    matchedUser: {
      id: 3,
      firstName: "Michael",
      lastName: "Rodriguez",
      role: "mentor",
      company: "Microsoft",
      jobTitle: "Engineering Manager",
    },
    event: {
      id: 3,
      name: "Resume Workshop with Microsoft Recruiters",
      date: new Date(2024, 11, 22, 11, 0),
    },
    sharedInterests: ["Software Engineering", "Cloud Computing"],
  },
];

const mockProfiles: ProfileData[] = [
  {
    id: 4,
    firstName: "Emily",
    lastName: "Wang",
    role: "mentor",
    company: "Meta",
    jobTitle: "Data Scientist",
    interests: ["Data Science", "AI/ML", "Python"],
    isVerified: true,
    connectionStatus: "none",
  },
  {
    id: 5,
    firstName: "David",
    lastName: "Kim",
    role: "mentor",
    company: "Amazon",
    jobTitle: "Software Development Engineer",
    interests: ["Backend Development", "System Design", "AWS"],
    isVerified: true,
    connectionStatus: "pending",
  },
  {
    id: 6,
    firstName: "Lisa",
    lastName: "Thompson",
    role: "mentor",
    company: "Goldman Sachs",
    jobTitle: "Investment Banking Associate",
    interests: ["Finance", "M&A", "Valuation"],
    isVerified: false,
    connectionStatus: "approved",
  },
];

const mockRequests: ConnectionRequestData[] = [
  {
    id: 1,
    from: {
      id: 7,
      firstName: "Alex",
      lastName: "Johnson",
      role: "mentee",
      company: "Stanford University",
    },
    message: "Hi! I saw you're attending the Tech Career Fair. I'm interested in product management and would love to learn from your experience at Google.",
    sharedEvent: "Tech Career Fair 2024",
    sharedInterests: ["Product Management", "AI/ML"],
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    from: {
      id: 8,
      firstName: "Casey",
      lastName: "Brown",
      role: "mentee",
      company: "MIT",
    },
    sharedInterests: ["Software Engineering"],
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export default function Matches() {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [requests, setRequests] = useState(mockRequests);

  const handleConnect = (profileId: number) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, connectionStatus: "pending" as const } : p
      )
    );
  };

  const handleMessage = (profileId: number) => {
    console.log("Open message for profile:", profileId);
  };

  const handleViewProfile = (profileId: number) => {
    console.log("View profile:", profileId);
  };

  const handleApprove = (requestId: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleDecline = (requestId: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={mockUser} notificationCount={3} />
      
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
                <Badge variant="secondary" className="ml-1">
                  {mockMatches.length}
                </Badge>
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
              {mockMatches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No new matches</p>
                  <p className="text-sm">
                    RSVP to more events to find mentors with shared interests
                  </p>
                </div>
              ) : (
                mockMatches.map((match) => (
                  <MatchNotification
                    key={match.id}
                    match={match}
                    onViewProfile={handleViewProfile}
                    onViewEvent={(eventId) => console.log("View event:", eventId)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="mentors" className="space-y-4">
              <div className="grid gap-4">
                {profiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onConnect={handleConnect}
                    onMessage={handleMessage}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-sm">Connection requests will appear here</p>
                </div>
              ) : (
                requests.map((request) => (
                  <ConnectionRequest
                    key={request.id}
                    request={request}
                    onApprove={handleApprove}
                    onDecline={handleDecline}
                    onViewProfile={handleViewProfile}
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
