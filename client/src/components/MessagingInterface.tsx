import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: number;
  participant: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    company?: string;
    role: "mentor" | "mentee";
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  messages: Message[];
}

interface MessagingInterfaceProps {
  conversations: Conversation[];
  currentUserId: number;
  selectedConversationId?: number;
  onSelectConversation?: (conversationId: number) => void;
  onSendMessage?: (conversationId: number, content: string) => void;
  onBack?: () => void;
}

export function MessagingInterface({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  onSendMessage,
  onBack,
}: MessagingInterfaceProps) {
  const [messageInput, setMessageInput] = useState("");
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleSend = () => {
    if (messageInput.trim() && selectedConversationId) {
      onSendMessage?.(selectedConversationId, messageInput);
      setMessageInput("");
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="h-[600px] flex overflow-hidden">
      <div
        className={`w-full md:w-80 border-r flex flex-col ${
          selectedConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 cursor-pointer hover-elevate ${
                  selectedConversationId === conversation.id ? "bg-muted" : ""
                }`}
                onClick={() => onSelectConversation?.(conversation.id)}
                data-testid={`conversation-${conversation.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={conversation.participant.profileImageUrl}
                    />
                    <AvatarFallback>
                      {getInitials(
                        conversation.participant.firstName,
                        conversation.participant.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {conversation.participant.firstName}{" "}
                        {conversation.participant.lastName}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <Badge className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      <div
        className={`flex-1 flex flex-col ${
          selectedConversationId ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onBack}
                data-testid="button-back-messages"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={selectedConversation.participant.profileImageUrl}
                />
                <AvatarFallback>
                  {getInitials(
                    selectedConversation.participant.firstName,
                    selectedConversation.participant.lastName
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {selectedConversation.participant.firstName}{" "}
                  {selectedConversation.participant.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.participant.company}
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => {
                  const isOwn = message.senderId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDistanceToNow(message.timestamp, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  data-testid="input-message"
                />
                <Button onClick={handleSend} data-testid="button-send-message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </Card>
  );
}
