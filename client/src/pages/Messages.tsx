import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft, Lock, Sparkles, Calendar, Lightbulb, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { getConversations, sendMessage } from "@/lib/api";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { ReviewForm } from "@/components/ReviewForm";
import type { ConversationData, Message } from "@shared/schema";

interface ConversationStarter {
  text: string;
  category: string;
}

export default function Messages() {
  const { user, isLoading: authLoading, upgrade } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [messageInput, setMessageInput] = useState("");

  const { data: conversations = [], isLoading } = useQuery<ConversationData[]>({
    queryKey: ["/api/conversations"],
    queryFn: getConversations,
    enabled: !!user,
  });

  const sendMutation = useMutation({
    mutationFn: ({ connectionId, content }: { connectionId: number; content: string }) =>
      sendMessage(connectionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageInput("");
    },
    onError: (error: any) => {
      if (error.message?.includes("limit")) {
        toast({
          title: "Message limit reached",
          description: "Upgrade to continue this conversation",
          variant: "destructive",
        });
      } else {
        toast({ title: "Failed to send message", variant: "destructive" });
      }
    },
  });

  const handleUpgrade = async () => {
    try {
      await upgrade();
      toast({ title: "Upgraded to Premium! You now have unlimited messaging." });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    } catch {
      toast({ title: "Upgrade failed", variant: "destructive" });
    }
  };

  const selectedConversation = conversations.find((c) => c.connectionId === selectedId);
  const hasNoMessages = selectedConversation && selectedConversation.messages.length === 0;

  const { data: startersData, isLoading: startersLoading } = useQuery<{ starters: ConversationStarter[] }>({
    queryKey: ["/api/ai/conversation-starters", selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/conversation-starters/${selectedId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedId && !!hasNoMessages,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const handleUseStarter = (text: string) => {
    setMessageInput(text);
  };

  const handleSend = () => {
    if (messageInput.trim() && selectedId) {
      sendMutation.mutate({ connectionId: selectedId, content: messageInput });
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
  };

  if (authLoading) {
    return null;
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} notificationCount={0} role={user.role} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">Messages</h1>
            <p className="text-muted-foreground">
              Chat with your approved mentor connections
            </p>
          </div>

          {isLoading ? (
            <Skeleton className="h-[600px]" />
          ) : (
            <Card className="h-[600px] flex overflow-hidden">
              {/* Conversation List */}
              <div
                className={`w-full md:w-80 border-r flex flex-col ${
                  selectedId ? "hidden md:flex" : "flex"
                }`}
              >
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg">Conversations</h2>
                </div>
                <ScrollArea className="flex-1">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>No conversations yet</p>
                      <p className="text-sm mt-1">
                        Connect with mentors to start messaging
                      </p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.connectionId}
                        className={`p-4 cursor-pointer hover-elevate ${
                          selectedId === conversation.connectionId ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedId(conversation.connectionId)}
                        data-testid={`conversation-${conversation.connectionId}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.participant?.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {getInitials(
                                conversation.participant?.firstName,
                                conversation.participant?.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">
                                {conversation.participant?.firstName}{" "}
                                {conversation.participant?.lastName}
                              </span>
                              {conversation.isLocked && (
                                <Lock className="h-3 w-3 text-muted-foreground" />
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

              {/* Message Thread */}
              <div
                className={`flex-1 flex flex-col ${
                  selectedId ? "flex" : "hidden md:flex"
                }`}
              >
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedId(undefined)}
                        data-testid="button-back-messages"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.participant?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(
                            selectedConversation.participant?.firstName,
                            selectedConversation.participant?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedConversation.participant?.firstName}{" "}
                          {selectedConversation.participant?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.participant?.company}
                        </p>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {selectedConversation.messages.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 gap-4" data-testid="conversation-starters-section">
                            <div className="text-center mb-2">
                              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="font-medium">Start the conversation</p>
                              <p className="text-sm text-muted-foreground">
                                Not sure what to say? Try one of these AI-generated icebreakers
                              </p>
                            </div>
                            {startersLoading ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Generating conversation starters...</span>
                              </div>
                            ) : startersData?.starters && startersData.starters.length > 0 ? (
                              <div className="w-full max-w-md space-y-2">
                                {startersData.starters.map((starter, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleUseStarter(starter.text)}
                                    className="w-full text-left p-3 rounded-md border hover-elevate transition-colors"
                                    data-testid={`starter-${i}`}
                                  >
                                    <Badge variant="secondary" className="mb-1.5">{starter.category}</Badge>
                                    <p className="text-sm">{starter.text}</p>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                        {selectedConversation.messages.map((message: Message) => {
                          const isOwn = message.senderId === user?.id;
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
                                  {formatDistanceToNow(new Date(message.createdAt!), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="px-4 py-2 border-t flex items-center gap-2 flex-wrap">
                      <Link href="/meetings">
                        <Button variant="outline" size="sm" className="gap-1" data-testid="button-schedule-from-messages">
                          <Calendar className="h-3.5 w-3.5" />
                          Schedule Meeting
                        </Button>
                      </Link>
                    </div>

                    {selectedConversation.messageCount >= 3 && selectedConversation.participant && (
                      <div className="px-4 py-2 border-t">
                        <ReviewForm
                          connectionId={selectedConversation.connectionId}
                          revieweeId={selectedConversation.participant.id}
                          revieweeName={`${selectedConversation.participant.firstName || ""} ${selectedConversation.participant.lastName || ""}`.trim()}
                        />
                      </div>
                    )}

                    {selectedConversation.isLocked && !user?.isPremium ? (
                      <div className="p-4 border-t bg-muted/50">
                        <div className="text-center">
                          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="font-medium mb-1">Message Limit Reached</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Continue this conversation and unlock event coordination.
                          </p>
                          <Button onClick={handleUpgrade} className="gap-2" data-testid="button-upgrade">
                            <Sparkles className="h-4 w-4" />
                            Upgrade to Continue
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            data-testid="input-message"
                          />
                          <Button
                            onClick={handleSend}
                            disabled={sendMutation.isPending}
                            data-testid="button-send-message"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        {!user?.isPremium && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            {Math.max(0, 4 - selectedConversation.messageCount)} free messages remaining
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a conversation to start messaging
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
