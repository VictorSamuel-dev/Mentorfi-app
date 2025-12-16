import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCard, type EventData } from "@/components/EventCard";
import { MatchNotification, type MatchData } from "@/components/MatchNotification";
import { Link } from "wouter";
import { Calendar, Users, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

// todo: remove mock functionality
const mockUser = {
  firstName: "Jordan",
  lastName: "Smith",
  email: "jordan.smith@university.edu",
  profileImageUrl: undefined,
};

const mockUpcomingEvents: EventData[] = [
  {
    id: 1,
    name: "Tech Career Fair 2024",
    date: new Date(2024, 11, 20, 10, 0),
    location: "San Francisco Convention Center",
    isVirtual: false,
    type: "career_fair",
    industry: ["Technology", "Software"],
    attendeeCount: 245,
    isAttending: true,
  },
  {
    id: 5,
    name: "Amazon Leadership Workshop",
    date: new Date(2024, 11, 28, 13, 0),
    location: "Virtual",
    isVirtual: true,
    type: "workshop",
    company: "Amazon",
    industry: ["Technology", "Leadership"],
    attendeeCount: 124,
    isAttending: true,
  },
];

const mockRecentMatch: MatchData = {
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
};

const stats = [
  { label: "Upcoming Events", value: 2, icon: Calendar, href: "/events" },
  { label: "New Matches", value: 3, icon: Sparkles, href: "/matches" },
  { label: "Active Connections", value: 5, icon: Users, href: "/matches" },
  { label: "Unread Messages", value: 2, icon: MessageSquare, href: "/messages" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={mockUser} notificationCount={3} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, {mockUser.firstName}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your mentorship journey
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover-elevate cursor-pointer" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
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
              <div className="space-y-4">
                {mockUpcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={() => {}}
                    onViewDetails={() => {}}
                  />
                ))}
              </div>
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
              <MatchNotification
                match={mockRecentMatch}
                onViewProfile={() => {}}
                onViewEvent={() => {}}
              />

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
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
