import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Users, MessageSquare, User, Building2, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Connection, UserProfile } from "@shared/schema";

interface EnrichedConnection {
  connection: Connection;
  otherUser: UserProfile;
  contextLabel?: string;
}

async function getApprovedConnections(): Promise<EnrichedConnection[]> {
  const res = await fetch("/api/connections/approved/enriched", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch connections");
  return res.json();
}

export default function Connections() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: connections = [], isLoading } = useQuery<EnrichedConnection[]>({
    queryKey: ["/api/connections/approved/enriched"],
    queryFn: getApprovedConnections,
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading || !user) {
    return null;
  }

  const isMentor = user.role === "mentor";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Your Connections</h1>
            <p className="text-muted-foreground">
              {isMentor 
                ? "Students you've connected with" 
                : "Mentors you're connected with"}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                <p className="text-muted-foreground mb-4">
                  When a connection is approved, it will show up here.
                </p>
                <Link href="/matches">
                  <Button data-testid="link-view-matches">
                    <Sparkles className="h-4 w-4 mr-2" />
                    View Matches
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {connections.map(({ connection, otherUser, contextLabel }) => (
                <Card key={connection.id} className="hover-elevate" data-testid={`card-connection-${connection.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={otherUser.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {otherUser.firstName?.[0] || ""}{otherUser.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {otherUser.firstName} {otherUser.lastName}
                          </h3>
                          <Badge variant="secondary">
                            {otherUser.role === "mentor" ? "Mentor" : "Student"}
                          </Badge>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Connected
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                          {otherUser.role === "mentor" ? (
                            <>
                              {otherUser.company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {otherUser.company}
                                </span>
                              )}
                              {otherUser.jobTitle && (
                                <span>{otherUser.jobTitle}</span>
                              )}
                            </>
                          ) : (
                            <>
                              {otherUser.school && (
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {otherUser.school}
                                </span>
                              )}
                              {otherUser.program && (
                                <span>{otherUser.program}</span>
                              )}
                            </>
                          )}
                        </div>
                        
                        {contextLabel && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {contextLabel}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link href={`/messages?userId=${otherUser.id}`}>
                          <Button size="sm" data-testid={`button-message-${connection.id}`}>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </Link>
                        <Link href={`/profile?userId=${otherUser.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-profile-${connection.id}`}>
                            <User className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
