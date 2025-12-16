import { MatchNotification, type MatchData } from "../MatchNotification";

// todo: remove mock functionality
const mockMatch: MatchData = {
  id: 1,
  matchedUser: {
    id: 2,
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
  const handleViewProfile = (userId: number) => {
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
