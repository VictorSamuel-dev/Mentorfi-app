import { SHOW_PLACEHOLDERS } from "@shared/featureFlags";
import { ProfileCard, type ProfileData } from "../ProfileCard";
import { useState } from "react";

const mockProfile: ProfileData = {
  id: "1",
  firstName: "Sarah",
  lastName: "Chen",
  role: "mentor",
  company: "Google",
  jobTitle: "Senior Product Manager",
  interests: ["Product Management", "AI/ML", "Startups", "Leadership"],
  isVerified: true,
  connectionStatus: "none",
};

export default function ProfileCardExample() {
  const [profile, setProfile] = useState(mockProfile);

  if (!SHOW_PLACEHOLDERS) {
    return <div className="p-4 text-center text-muted-foreground">Placeholder examples are disabled.</div>;
  }

  const handleConnect = (profileId: string) => {
    setProfile((prev) => ({ ...prev, connectionStatus: "pending" as const }));
  };

  const handleMessage = (profileId: string) => {
    console.log("Open message for profile:", profileId);
  };

  const handleViewProfile = (profileId: string) => {
    console.log("View profile:", profileId);
  };

  return (
    <div className="max-w-md">
      <ProfileCard
        profile={profile}
        sharedInterests={["AI/ML", "Product Management"]}
        sharedEvent="Tech Career Fair 2024"
        onConnect={handleConnect}
        onMessage={handleMessage}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}
