import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Briefcase, Target, Heart, Crown, MessageSquare, UserPlus } from "lucide-react";
import { BadgeRow } from "@/components/UserBadge";
import type { BadgeDisplay } from "@shared/schema";

export interface ProfileDialogData {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  interests?: string[] | null;
  targetCompanies?: string[] | null;
  profileImageUrl?: string | null;
  isPremium?: boolean | null;
  badges?: BadgeDisplay[];
  connectionStatus?: "none" | "pending" | "approved";
}

interface ProfileDialogProps {
  profile: ProfileDialogData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: (profileId: string) => void;
  onMessage?: (profileId: string) => void;
}

export function ProfileDialog({
  profile,
  open,
  onOpenChange,
  onConnect,
  onMessage,
}: ProfileDialogProps) {
  if (!profile) return null;

  const getInitials = () => {
    const first = profile.firstName?.[0] || "";
    const last = profile.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-profile">
        <DialogHeader>
          <DialogTitle className="sr-only">Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.profileImageUrl || undefined} />
            <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {profile.firstName} {profile.lastName}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs capitalize">
                {profile.role}
              </Badge>
              {profile.isPremium && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Crown className="h-3 w-3" />
                  <span className="text-xs font-medium">Premium</span>
                </div>
              )}
            </div>
          </div>

          {profile.badges && profile.badges.length > 0 && (
            <BadgeRow badges={profile.badges} variant="pill" maxDisplay={3} />
          )}

          {profile.jobTitle && profile.company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{profile.jobTitle} at {profile.company}</span>
            </div>
          )}

          <div className="w-full space-y-4 mt-4">
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Heart className="h-4 w-4" />
                  <span>Interests</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.targetCompanies && profile.targetCompanies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Target className="h-4 w-4" />
                  <span>Target Companies</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.targetCompanies.map((company) => (
                    <Badge key={company} variant="outline" className="text-xs">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full mt-4">
            {profile.connectionStatus === "approved" ? (
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  onMessage?.(profile.id);
                  onOpenChange(false);
                }}
                data-testid="button-dialog-message"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
            ) : profile.connectionStatus === "pending" ? (
              <Button variant="secondary" className="flex-1" disabled>
                Request Pending
              </Button>
            ) : (
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  onConnect?.(profile.id);
                  onOpenChange(false);
                }}
                data-testid="button-dialog-connect"
              >
                <UserPlus className="h-4 w-4" />
                Request Connection
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
