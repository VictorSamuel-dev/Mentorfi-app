import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Users, Calendar, ArrowRight } from "lucide-react";

export default function Welcome() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;
  if (!user) {
    setLocation("/login");
    return null;
  }

  const isMentor = user.role === "mentor";

  const handleGetStarted = () => {
    if (isMentor && !user.onboardingComplete) {
      setLocation("/onboarding");
    } else {
      setLocation("/profile");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome-title">
              Welcome to Mentorfy, {user.firstName || "there"}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {isMentor
                ? "Thank you for volunteering to mentor the next generation of professionals."
                : "You're one step closer to connecting with Fortune 500 professionals."}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm mb-1">
                  {isMentor ? "Attend Events" : "Discover Events"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isMentor
                    ? "Join career fairs and workshops to meet mentees."
                    : "Browse career fairs, info sessions, and workshops."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm mb-1">
                  {isMentor ? "Mentor Students" : "Find Mentors"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isMentor
                    ? "Review connection requests and approve mentees."
                    : "Get matched with professionals who share your interests."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm mb-1">
                  {isMentor ? "Share Knowledge" : "Grow Your Career"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isMentor
                    ? "Guide students through messaging and shared events."
                    : "Get advice on resumes, interviews, and career paths."}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="gap-2"
              onClick={handleGetStarted}
              data-testid="button-get-started"
            >
              {isMentor ? "Set Up Your Mentor Profile" : "Complete Your Profile"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div>
              <Button
                variant="ghost"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-skip-to-dashboard"
              >
                Skip to dashboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
