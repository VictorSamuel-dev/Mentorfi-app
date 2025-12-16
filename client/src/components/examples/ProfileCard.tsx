import { ProfileCard, type ProfileData } from "../ProfileCard";
import { useState } from "react";

// todo: remove mock functionality
const mockProfile: ProfileData = {
  id: 1,
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

  const handleConnect = (profileId: number) => {
    console.log("Connection requested for profile:", profileId);
    setProfile((prev) => ({ ...prev, connectionStatus: "pending" as const }));
  };

  const handleMessage = (profileId: number) => {
    console.log("Open message for profile:", profileId);
  };

  const handleViewProfile = (profileId: number) => {
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
