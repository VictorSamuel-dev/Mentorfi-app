import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  Users,
  Building2,
  MessageCircle,
  UserCheck,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { getEventVisibleAttendees } from "@/lib/api";
import type { Event, EventAttendeesResponse, VisibleAttendee } from "@shared/schema";

interface EventDetailsDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
}

const eventTypeLabels: Record<string, string> = {
  career_fair: "Career Fair",
  info_session: "Info Session",
  workshop: "Workshop",
};

function AttendeeCard({
  attendee,
  onMessage,
}: {
  attendee: VisibleAttendee;
  onMessage: (userId: string) => void;
}) {
  const initials = attendee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-visible" data-testid={`card-attendee-${attendee.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={attendee.avatarUrl || undefined} alt={attendee.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{attendee.name}</p>
            {(attendee.title || attendee.company) && (
              <p className="text-sm text-muted-foreground truncate">
                {attendee.title}
                {attendee.title && attendee.company && " at "}
                {attendee.company}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="gap-1">
              <UserCheck className="h-3 w-3" />
              Connected
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => onMessage(attendee.id)}
              data-testid={`button-message-${attendee.id}`}
            >
              <MessageCircle className="h-3 w-3" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AttendeesPlaceholder({ totalAttending }: { totalAttending: number }) {
  return (
    <div className="text-center py-8 px-4 border border-dashed rounded-md bg-muted/30">
      <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
      <p className="text-muted-foreground mb-1">
        {totalAttending} {totalAttending === 1 ? "person" : "people"} attending
      </p>
      <p className="text-sm text-muted-foreground/70">
        Attendees are visible once a connection is approved
      </p>
    </div>
  );
}

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
  isAuthenticated,
}: EventDetailsDialogProps) {
  const [, setLocation] = useLocation();

  const { data: attendeesData, isLoading: attendeesLoading } =
    useQuery<EventAttendeesResponse>({
      queryKey: ["/api/events", event?.id, "attendees-visible"],
      queryFn: () => getEventVisibleAttendees(event!.id),
      enabled: !!event && isAuthenticated,
    });

  const handleMessage = (userId: string) => {
    setLocation(`/messages?user=${userId}`);
    onOpenChange(false);
  };

  if (!event) return null;

  const totalAttending = attendeesData?.totalAttending ?? 0;
  const visibleAttendees = attendeesData?.visibleAttendees ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant="secondary">
              {eventTypeLabels[event.type] || event.type}
            </Badge>
          </div>
          <DialogTitle className="text-xl mt-2">{event.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{event.isVirtual ? "Virtual Event" : event.location}</span>
            </div>
            {event.company && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>Hosted by {event.company}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{totalAttending} attending</span>
            </div>
          </div>

          {event.description && (
            <div>
              <h4 className="font-medium mb-2">About this event</h4>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}

          {event.industry && event.industry.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.industry.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees
              {totalAttending > 0 && (
                <span className="text-muted-foreground font-normal">
                  ({totalAttending})
                </span>
              )}
            </h4>

            {!isAuthenticated ? (
              <div className="text-center py-8 px-4 border border-dashed rounded-md bg-muted/30">
                <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">
                  Log in to see attendees
                </p>
                <Button size="sm" onClick={() => setLocation("/auth")}>
                  Log In
                </Button>
              </div>
            ) : attendeesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : visibleAttendees.length > 0 ? (
              <div className="space-y-3">
                {visibleAttendees.map((attendee) => (
                  <AttendeeCard
                    key={attendee.id}
                    attendee={attendee}
                    onMessage={handleMessage}
                  />
                ))}
                {totalAttending > visibleAttendees.length && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {totalAttending - visibleAttendees.length} more{" "}
                    {totalAttending - visibleAttendees.length === 1
                      ? "attendee"
                      : "attendees"}{" "}
                    (visible once connected)
                  </p>
                )}
              </div>
            ) : (
              <AttendeesPlaceholder totalAttending={totalAttending} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
