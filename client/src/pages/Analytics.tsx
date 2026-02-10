import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Eye, Users, MessageSquare, Calendar, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getMentorAnalytics } from "@/lib/api";
import type { MentorAnalytics } from "@shared/schema";

export default function Analytics() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: analytics, isLoading } = useQuery<MentorAnalytics>({
    queryKey: ["/api/analytics/mentor"],
    queryFn: getMentorAnalytics,
    enabled: !!user && user.role === "mentor",
  });

  if (authLoading) return null;
  if (!user) { setLocation("/auth"); return null; }
  if (user.role !== "mentor") { setLocation("/dashboard"); return null; }

  const stats = analytics ? [
    { label: "Profile Views", value: analytics.profileViews, icon: Eye, color: "text-blue-500" },
    { label: "Connections", value: analytics.totalConnections, icon: Users, color: "text-green-500" },
    { label: "Messages Sent", value: analytics.totalMessages, icon: MessageSquare, color: "text-purple-500" },
    { label: "Meetings", value: analytics.totalMeetings, icon: Calendar, color: "text-orange-500" },
    { label: "Avg Rating", value: analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : "N/A", icon: Star, color: "text-yellow-500" },
    { label: "Reviews", value: analytics.totalReviews, icon: TrendingUp, color: "text-pink-500" },
  ] : [];

  const maxActivity = analytics ? Math.max(
    ...analytics.recentActivity.map(d => Math.max(d.views, d.messages)),
    1
  ) : 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} role={user.role} />

      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold" data-testid="text-analytics-title">Mentor Analytics</h1>
            <p className="text-muted-foreground">Track your mentorship impact and engagement</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {stats.map((stat) => (
                  <Card key={stat.label} data-testid={`analytics-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card data-testid="analytics-activity-chart">
                <CardHeader>
                  <CardTitle className="text-lg">7-Day Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-40">
                    {analytics.recentActivity.map((day) => (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "120px" }}>
                          <div className="w-full flex gap-0.5 items-end flex-1">
                            <div
                              className="flex-1 bg-blue-500/20 rounded-t-sm"
                              style={{ height: `${Math.max((day.views / maxActivity) * 100, 4)}%` }}
                              title={`${day.views} views`}
                            />
                            <div
                              className="flex-1 bg-purple-500/40 rounded-t-sm"
                              style={{ height: `${Math.max((day.messages / maxActivity) * 100, 4)}%` }}
                              title={`${day.messages} messages`}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 mt-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-blue-500/20" />
                      <span className="text-xs text-muted-foreground">Profile Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-purple-500/40" />
                      <span className="text-xs text-muted-foreground">Messages</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No analytics data available yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
