import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard, type EventData } from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Calendar } from "lucide-react";

// todo: remove mock functionality
const mockEvents: EventData[] = [
  {
    id: 1,
    name: "Tech Career Fair 2024",
    date: new Date(2024, 11, 20, 10, 0),
    location: "San Francisco Convention Center",
    isVirtual: false,
    type: "career_fair",
    company: "Multiple Companies",
    industry: ["Technology", "Software", "AI/ML"],
    attendeeCount: 245,
    isAttending: true,
  },
  {
    id: 2,
    name: "Google Product Management Info Session",
    date: new Date(2024, 11, 18, 14, 0),
    location: "Virtual",
    isVirtual: true,
    type: "info_session",
    company: "Google",
    industry: ["Technology", "Product Management"],
    attendeeCount: 89,
    isAttending: false,
  },
  {
    id: 3,
    name: "Resume Workshop with Microsoft Recruiters",
    date: new Date(2024, 11, 22, 11, 0),
    location: "Stanford University",
    isVirtual: false,
    type: "workshop",
    company: "Microsoft",
    industry: ["Technology", "Career Development"],
    attendeeCount: 56,
    isAttending: false,
  },
  {
    id: 4,
    name: "Finance Industry Networking Night",
    date: new Date(2024, 11, 25, 18, 0),
    location: "New York City",
    isVirtual: false,
    type: "career_fair",
    company: "Goldman Sachs, JP Morgan, Morgan Stanley",
    industry: ["Finance", "Investment Banking"],
    attendeeCount: 178,
    isAttending: false,
  },
  {
    id: 5,
    name: "Amazon Leadership Principles Workshop",
    date: new Date(2024, 11, 28, 13, 0),
    location: "Virtual",
    isVirtual: true,
    type: "workshop",
    company: "Amazon",
    industry: ["Technology", "Leadership"],
    attendeeCount: 124,
    isAttending: true,
  },
  {
    id: 6,
    name: "Consulting Case Interview Prep",
    date: new Date(2025, 0, 5, 10, 0),
    location: "Harvard Business School",
    isVirtual: false,
    type: "workshop",
    company: "McKinsey, BCG, Bain",
    industry: ["Consulting", "Strategy"],
    attendeeCount: 67,
    isAttending: false,
  },
];

const mockUser = {
  firstName: "Jordan",
  lastName: "Smith",
  email: "jordan.smith@university.edu",
  profileImageUrl: undefined,
};

const industries = ["All", "Technology", "Finance", "Consulting", "Product Management"];
const eventTypes = ["All", "career_fair", "info_session", "workshop"];

export default function Events() {
  const [events, setEvents] = useState(mockEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showMyEvents, setShowMyEvents] = useState(false);

  const handleRSVP = (eventId: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isAttending: !e.isAttending,
              attendeeCount: e.isAttending
                ? e.attendeeCount - 1
                : e.attendeeCount + 1,
            }
          : e
      )
    );
  };

  const handleViewDetails = (eventId: number) => {
    console.log("View details for event:", eventId);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesIndustry =
      industryFilter === "All" ||
      event.industry.some((i) =>
        i.toLowerCase().includes(industryFilter.toLowerCase())
      );
    const matchesType = typeFilter === "All" || event.type === typeFilter;
    const matchesMyEvents = !showMyEvents || event.isAttending;
    return matchesSearch && matchesIndustry && matchesType && matchesMyEvents;
  });

  const myEventsCount = events.filter((e) => e.isAttending).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={mockUser} notificationCount={3} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-1">Career Events</h1>
              <p className="text-muted-foreground">
                Find events and connect with mentors who share your interests
              </p>
            </div>
            <Button
              variant={showMyEvents ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowMyEvents(!showMyEvents)}
              data-testid="button-my-events"
            >
              <Calendar className="h-4 w-4" />
              My Events
              {myEventsCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {myEventsCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-events"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-industry">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-type">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="career_fair">Career Fair</SelectItem>
                <SelectItem value="info_session">Info Session</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRSVP={handleRSVP}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
