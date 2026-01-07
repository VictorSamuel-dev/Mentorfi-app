import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MessageSquare, UserPlus, CheckCircle, Sparkles } from "lucide-react";
import { BadgeRow } from "@/components/UserBadge";
import type { BadgeDisplay } from "@shared/schema";

export interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  role: "mentor" | "mentee";
  company?: string;
  jobTitle?: string;
  interests: string[];
  targetCompanies?: string[];
  profileImageUrl?: string;
  isVerified?: boolean;
  connectionStatus?: "none" | "pending" | "approved";
  badges?: BadgeDisplay[];
}

interface ProfileCardProps {
  profile: ProfileData;
  sharedInterests?: string[];
  sharedEvent?: string;
  onConnect?: (profileId: string) => void;
  onMessage?: (profileId: string) => void;
  onViewProfile?: (profileId: string) => void;
  isSuggested?: boolean;
}

export function ProfileCard({
  profile,
  sharedInterests = [],
  sharedEvent,
  onConnect,
  onMessage,
  onViewProfile,
  isSuggested = false,
}: ProfileCardProps) {
  const getInitials = () => {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="hover-elevate" data-testid={`card-profile-${profile.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={profile.profileImageUrl} />
            <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">
                {profile.firstName} {profile.lastName}
              </h3>
              {profile.isVerified && (
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              )}
              <Badge variant="secondary" className="text-xs">
                {profile.role === "mentor" ? "Mentor" : "Mentee"}
              </Badge>
              {isSuggested && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested
                </Badge>
              )}
              {profile.badges && profile.badges.length > 0 && (
                <BadgeRow badges={profile.badges} variant="pill" maxDisplay={2} />
              )}
            </div>

            {profile.role === "mentor" && profile.jobTitle && profile.company && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building2 className="h-3 w-3" />
                <span>
                  {profile.jobTitle} at {profile.company}
                </span>
              </div>
            )}

            {sharedEvent && (
              <p className="text-sm text-primary mt-2">
                Attending: {sharedEvent}
              </p>
            )}

            <div className="flex flex-wrap gap-1 mt-3">
              {profile.interests.slice(0, 4).map((interest) => (
                <Badge
                  key={interest}
                  variant={sharedInterests.includes(interest) ? "default" : "outline"}
                  className="text-xs"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {profile.connectionStatus === "approved" ? (
            <Button
              className="flex-1 gap-2"
              onClick={() => onMessage?.(profile.id)}
              data-testid={`button-message-${profile.id}`}
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
          ) : profile.connectionStatus === "pending" ? (
            <Button
              variant="secondary"
              className="flex-1"
              disabled
              data-testid={`button-pending-${profile.id}`}
            >
              Request Pending
            </Button>
          ) : (
            <Button
              className="flex-1 gap-2"
              onClick={() => onConnect?.(profile.id)}
              data-testid={`button-connect-${profile.id}`}
            >
              <UserPlus className="h-4 w-4" />
              Request Connection
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onViewProfile?.(profile.id)}
            data-testid={`button-view-profile-${profile.id}`}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
