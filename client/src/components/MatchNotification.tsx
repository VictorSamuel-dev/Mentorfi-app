import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles, Building2 } from "lucide-react";
import { format } from "date-fns";

export interface MatchData {
  id: number;
  matchedUser: {
    id: number;
    firstName: string;
    lastName: string;
    role: "mentor" | "mentee";
    company?: string;
    jobTitle?: string;
    profileImageUrl?: string;
  };
  event: {
    id: number;
    name: string;
    date: Date;
  };
  sharedInterests: string[];
  sharedCompany?: string;
}

interface MatchNotificationProps {
  match: MatchData;
  onViewProfile?: (userId: number) => void;
  onViewEvent?: (eventId: number) => void;
}

export function MatchNotification({
  match,
  onViewProfile,
  onViewEvent,
}: MatchNotificationProps) {
  const { matchedUser, event, sharedInterests, sharedCompany } = match;

  const getInitials = () => {
    return `${matchedUser.firstName[0]}${matchedUser.lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="border-l-4 border-l-primary" data-testid={`card-match-${match.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm mb-3">
              <span className="font-medium">New Match!</span> You and a{" "}
              {matchedUser.role} from{" "}
              <span className="font-medium">{sharedCompany || matchedUser.company}</span>{" "}
              will be attending the same event.
            </p>

            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={matchedUser.profileImageUrl} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">
                    {matchedUser.firstName} {matchedUser.lastName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {matchedUser.role === "mentor" ? "Mentor" : "Mentee"}
                  </Badge>
                </div>
                {matchedUser.jobTitle && matchedUser.company && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>
                      {matchedUser.jobTitle} at {matchedUser.company}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {event.name} - {format(event.date, "MMM d, yyyy")}
              </span>
            </div>

            {sharedInterests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                <span className="text-xs text-muted-foreground mr-1">
                  Shared interests:
                </span>
                {sharedInterests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => onViewProfile?.(matchedUser.id)}
                data-testid={`button-view-match-profile-${match.id}`}
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => onViewEvent?.(event.id)}
                data-testid={`button-view-match-event-${match.id}`}
              >
                View Event
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
