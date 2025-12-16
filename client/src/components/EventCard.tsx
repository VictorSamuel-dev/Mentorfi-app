import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Building2 } from "lucide-react";
import { format } from "date-fns";

export interface EventData {
  id: number;
  name: string;
  date: Date;
  location: string;
  isVirtual?: boolean;
  type: "career_fair" | "info_session" | "workshop";
  company?: string;
  industry: string[];
  attendeeCount: number;
  isAttending?: boolean;
}

interface EventCardProps {
  event: EventData;
  onRSVP?: (eventId: number) => void;
  onViewDetails?: (eventId: number) => void;
}

const eventTypeLabels = {
  career_fair: "Career Fair",
  info_session: "Info Session",
  workshop: "Workshop",
};

export function EventCard({ event, onRSVP, onViewDetails }: EventCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-event-${event.id}`}>
      <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <Building2 className="h-12 w-12 text-primary/40" />
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {eventTypeLabels[event.type]}
          </Badge>
          {event.isAttending && (
            <Badge className="text-xs">Attending</Badge>
          )}
        </div>
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.name}</h3>
        
        {event.company && (
          <p className="text-sm text-muted-foreground mb-2">{event.company}</p>
        )}
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{format(event.date, "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{event.isVirtual ? "Virtual Event" : event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>{event.attendeeCount} attending</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-3">
          {event.industry.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant={event.isAttending ? "secondary" : "default"}
          className="flex-1"
          onClick={() => onRSVP?.(event.id)}
          data-testid={`button-rsvp-${event.id}`}
        >
          {event.isAttending ? "Cancel RSVP" : "RSVP"}
        </Button>
        <Button
          variant="outline"
          onClick={() => onViewDetails?.(event.id)}
          data-testid={`button-view-event-${event.id}`}
        >
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}
