import { MessagingInterface, type Conversation } from "../MessagingInterface";
import { useState } from "react";

// todo: remove mock functionality
const mockConversations: Conversation[] = [
  {
    id: 1,
    participant: {
      id: 2,
      firstName: "Sarah",
      lastName: "Chen",
      company: "Google",
      role: "mentor",
    },
    lastMessage: "Looking forward to meeting you at the event!",
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 2,
    messages: [
      { id: 1, senderId: 2, content: "Hi! I saw your profile and noticed we're both attending the Tech Career Fair.", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: 2, senderId: 1, content: "Yes! I'm really excited to learn more about product management at Google.", timestamp: new Date(Date.now() - 90 * 60 * 1000) },
      { id: 3, senderId: 2, content: "Great! I'd be happy to share my experience. What specific areas are you curious about?", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
      { id: 4, senderId: 2, content: "Looking forward to meeting you at the event!", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
    ],
  },
  {
    id: 2,
    participant: {
      id: 3,
      firstName: "Michael",
      lastName: "Rodriguez",
      company: "Microsoft",
      role: "mentor",
    },
    lastMessage: "Sounds good, see you there!",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    messages: [
      { id: 5, senderId: 3, content: "Welcome to Mentorfy! I'm happy to connect.", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { id: 6, senderId: 1, content: "Thank you! I noticed we're both attending the Info Session.", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      { id: 7, senderId: 3, content: "Sounds good, see you there!", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    ],
  },
];

export default function MessagingInterfaceExample() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedId, setSelectedId] = useState<number | undefined>(1);
  const currentUserId = 1;

  const handleSelectConversation = (conversationId: number) => {
    setSelectedId(conversationId);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = (conversationId: number, content: string) => {
    console.log("Sending message:", content);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: Date.now(),
                  senderId: currentUserId,
                  content,
                  timestamp: new Date(),
                },
              ],
              lastMessage: content,
              lastMessageTime: new Date(),
            }
          : c
      )
    );
  };

  const handleBack = () => {
    setSelectedId(undefined);
  };

  return (
    <MessagingInterface
      conversations={conversations}
      currentUserId={currentUserId}
      selectedConversationId={selectedId}
      onSelectConversation={handleSelectConversation}
      onSendMessage={handleSendMessage}
      onBack={handleBack}
    />
  );
}
