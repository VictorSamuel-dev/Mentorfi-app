import { SHOW_PLACEHOLDERS } from "@shared/featureFlags";
import { MatchNotification, type MatchData } from "../MatchNotification";

const mockMatch: MatchData = {
  id: "1",
  matchedUser: {
    id: "2",
    firstName: "Michael",
    lastName: "Rodriguez",
    role: "mentor",
    company: "Microsoft",
    jobTitle: "Engineering Manager",
  },
  event: {
    id: 1,
    name: "Tech Industry Info Session",
    date: new Date(2024, 11, 18, 14, 0),
  },
  sharedInterests: ["Software Engineering", "Cloud Computing"],
  sharedCompany: "Microsoft",
};

export default function MatchNotificationExample() {
  if (!SHOW_PLACEHOLDERS) {
    return <div className="p-4 text-center text-muted-foreground">Placeholder examples are disabled.</div>;
  }

  const handleViewProfile = (userId: string) => {
    console.log("View profile:", userId);
  };

  const handleViewEvent = (eventId: number) => {
    console.log("View event:", eventId);
  };

  return (
    <div className="max-w-xl">
      <MatchNotification
        match={mockMatch}
        onViewProfile={handleViewProfile}
        onViewEvent={handleViewEvent}
      />
    </div>
  );
}
