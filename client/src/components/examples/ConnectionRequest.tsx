import { SHOW_PLACEHOLDERS } from "@shared/featureFlags";
import { ConnectionRequest, type ConnectionRequestData } from "../ConnectionRequest";
import { useState } from "react";

const mockRequest: ConnectionRequestData = {
  id: 1,
  from: {
    id: "3",
    firstName: "Alex",
    lastName: "Johnson",
    role: "mentee",
    company: "Stanford University",
  },
  message: "Hi! I saw you're attending the Tech Career Fair. I'm very interested in product management at Google and would love to learn from your experience.",
  sharedEvent: "Tech Career Fair 2024",
  sharedInterests: ["Product Management", "AI/ML"],
  requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

export default function ConnectionRequestExample() {
  const [visible, setVisible] = useState(true);

  if (!SHOW_PLACEHOLDERS) {
    return <div className="p-4 text-center text-muted-foreground">Placeholder examples are disabled.</div>;
  }

  const handleApprove = (requestId: number) => {
    setVisible(false);
  };

  const handleDecline = (requestId: number) => {
    setVisible(false);
  };

  const handleViewProfile = (userId: string) => {
    console.log("View profile:", userId);
  };

  if (!visible) {
    return <div className="text-center text-muted-foreground p-4">Request handled</div>;
  }

  return (
    <div className="max-w-xl">
      <ConnectionRequest
        request={mockRequest}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}
