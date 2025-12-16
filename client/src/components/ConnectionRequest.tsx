import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ConnectionRequestData {
  id: number;
  from: {
    id: number;
    firstName: string;
    lastName: string;
    role: "mentor" | "mentee";
    company?: string;
    profileImageUrl?: string;
  };
  message?: string;
  sharedEvent?: string;
  sharedInterests: string[];
  requestedAt: Date;
}

interface ConnectionRequestProps {
  request: ConnectionRequestData;
  onApprove?: (requestId: number) => void;
  onDecline?: (requestId: number) => void;
  onViewProfile?: (userId: number) => void;
}

export function ConnectionRequest({
  request,
  onApprove,
  onDecline,
  onViewProfile,
}: ConnectionRequestProps) {
  const { from, message, sharedEvent, sharedInterests, requestedAt } = request;

  const getInitials = () => {
    return `${from.firstName[0]}${from.lastName[0]}`.toUpperCase();
  };

  return (
    <Card data-testid={`card-request-${request.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar
            className="h-12 w-12 cursor-pointer"
            onClick={() => onViewProfile?.(from.id)}
          >
            <AvatarImage src={from.profileImageUrl} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={() => onViewProfile?.(from.id)}
                >
                  {from.firstName} {from.lastName}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {from.role === "mentor" ? "Mentor" : "Mentee"}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(requestedAt, { addSuffix: true })}
              </span>
            </div>

            {from.company && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building2 className="h-3 w-3" />
                <span>{from.company}</span>
              </div>
            )}

            {sharedEvent && (
              <p className="text-sm text-primary mt-2">
                Meeting at: {sharedEvent}
              </p>
            )}

            {message && (
              <p className="text-sm mt-2 p-2 rounded bg-muted/50">
                "{message}"
              </p>
            )}

            {sharedInterests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {sharedInterests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                className="gap-2"
                onClick={() => onApprove?.(request.id)}
                data-testid={`button-approve-${request.id}`}
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => onDecline?.(request.id)}
                data-testid={`button-decline-${request.id}`}
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
