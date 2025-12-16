import { useState } from "react";
import { Header } from "@/components/Header";
import { MessagingInterface, type Conversation } from "@/components/MessagingInterface";

// todo: remove mock functionality
const mockUser = {
  firstName: "Jordan",
  lastName: "Smith",
  email: "jordan.smith@university.edu",
  profileImageUrl: undefined,
};

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
      {
        id: 1,
        senderId: 2,
        content: "Hi! I saw your profile and noticed we're both attending the Tech Career Fair.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 2,
        senderId: 1,
        content: "Yes! I'm really excited to learn more about product management at Google.",
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        id: 3,
        senderId: 2,
        content: "Great! I'd be happy to share my experience. What specific areas are you curious about?",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: 4,
        senderId: 2,
        content: "Looking forward to meeting you at the event!",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
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
      {
        id: 5,
        senderId: 3,
        content: "Welcome to Mentorfy! I'm happy to connect.",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: 6,
        senderId: 1,
        content: "Thank you! I noticed we're both attending the Resume Workshop.",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        id: 7,
        senderId: 3,
        content: "Sounds good, see you there!",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: 3,
    participant: {
      id: 6,
      firstName: "Lisa",
      lastName: "Thompson",
      company: "Goldman Sachs",
      role: "mentor",
    },
    lastMessage: "Feel free to reach out with any questions about investment banking.",
    lastMessageTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
    unreadCount: 0,
    messages: [
      {
        id: 8,
        senderId: 6,
        content: "Feel free to reach out with any questions about investment banking.",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    ],
  },
];

export default function Messages() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedId, setSelectedId] = useState<number | undefined>();
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={mockUser} notificationCount={3} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">Messages</h1>
            <p className="text-muted-foreground">
              Chat with your approved mentor connections
            </p>
          </div>

          <MessagingInterface
            conversations={conversations}
            currentUserId={currentUserId}
            selectedConversationId={selectedId}
            onSelectConversation={handleSelectConversation}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
          />
        </div>
      </main>
    </div>
  );
}
