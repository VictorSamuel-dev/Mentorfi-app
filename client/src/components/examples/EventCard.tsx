import { EventCard, type EventData } from "../EventCard";
import { useState } from "react";

// todo: remove mock functionality
const mockEvent: EventData = {
  id: 1,
  name: "Tech Career Fair 2024",
  date: new Date(2024, 11, 20, 10, 0),
  location: "San Francisco Convention Center",
  isVirtual: false,
  type: "career_fair",
  company: "Multiple Companies",
  industry: ["Technology", "Software", "AI/ML"],
  attendeeCount: 245,
  isAttending: false,
};

export default function EventCardExample() {
  const [event, setEvent] = useState(mockEvent);

  const handleRSVP = (eventId: number) => {
    console.log("RSVP toggled for event:", eventId);
    setEvent((prev) => ({ ...prev, isAttending: !prev.isAttending }));
  };

  const handleViewDetails = (eventId: number) => {
    console.log("View details for event:", eventId);
  };

  return (
    <div className="max-w-sm">
      <EventCard
        event={event}
        onRSVP={handleRSVP}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}
