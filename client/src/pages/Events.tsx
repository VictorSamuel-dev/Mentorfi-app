import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getEvents, rsvpToEvent, cancelRsvp } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EventWithAttendees, Event } from "@shared/schema";

const industries = ["All", "Technology", "Finance", "Consulting", "Product Management"];

export default function Events() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery<EventWithAttendees[]>({
    queryKey: ["/api/events"],
    queryFn: getEvents,
  });

  const rsvpMutation = useMutation({
    mutationFn: (eventId: number) => rsvpToEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "RSVP confirmed!" });
    },
    onError: () => {
      toast({ title: "Failed to RSVP", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId: number) => cancelRsvp(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "RSVP cancelled" });
    },
    onError: () => {
      toast({ title: "Failed to cancel RSVP", variant: "destructive" });
    },
  });

  const handleRSVP = (eventId: number) => {
    const event = events.find((e) => e.id === eventId);
    if (!user) {
      toast({ title: "Please log in to RSVP", variant: "destructive" });
      return;
    }
    if (event?.isAttending) {
      cancelMutation.mutate(eventId);
    } else {
      rsvpMutation.mutate(eventId);
    }
  };

  const handleViewDetails = (eventId: number) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setDetailsOpen(true);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesIndustry =
      industryFilter === "All" ||
      (event.industry || []).some((i) =>
        i.toLowerCase().includes(industryFilter.toLowerCase())
      );
    const matchesType = typeFilter === "All" || event.type === typeFilter;
    const matchesMyEvents = !showMyEvents || event.isAttending;
    return matchesSearch && matchesIndustry && matchesType && matchesMyEvents;
  });

  const myEventsCount = events.filter((e) => e.isAttending).length;

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={!!user} user={user} notificationCount={0} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-1">Career Events</h1>
              <p className="text-muted-foreground">
                Find events and connect with mentors who share your interests
              </p>
            </div>
            {user && (
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
            )}
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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No events available yet</p>
              <p className="text-sm">New events will be posted here as they become available. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    type: event.type as "career_fair" | "info_session" | "workshop",
                    industry: event.industry || [],
                    isVirtual: event.isVirtual ?? false,
                  }}
                  onRSVP={handleRSVP}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />

      <EventDetailsDialog
        event={selectedEvent}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        isAuthenticated={!!user}
      />
    </div>
  );
}
