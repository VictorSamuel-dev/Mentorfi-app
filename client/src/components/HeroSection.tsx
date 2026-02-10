import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, MessageSquare } from "lucide-react";
import heroImage from "@assets/generated_images/career_fair_networking_scene.png";

function formatCount(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return n.toString();
}

export function HeroSection() {
  const { data: stats } = useQuery<{ mentorCount: number; eventCount: number; connectionCount: number }>({
    queryKey: ["/api/stats"],
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Connect with the Right Mentors — Intentionally
        </h1>
        <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Mentorfy connects students and professionals through shared goals, interests, and 
          optional event context — without cold outreach or open-ended commitments.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="gap-2"
            asChild
            data-testid="button-hero-get-started"
          >
            <a href="/auth">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="backdrop-blur-sm bg-white/10 border-white/30 text-white"
            asChild
            data-testid="button-hero-learn-more"
          >
            <a href="/events">Learn More</a>
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-white/80">
          <div className="flex items-center gap-2" data-testid="stat-mentors">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">
              {stats ? `${formatCount(stats.mentorCount)} Mentor${stats.mentorCount !== 1 ? "s" : ""}` : "— Mentors"}
            </span>
          </div>
          <div className="flex items-center gap-2" data-testid="stat-events">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">
              {stats ? `${formatCount(stats.eventCount)} Event${stats.eventCount !== 1 ? "s" : ""}` : "— Events"}
            </span>
          </div>
          <div className="flex items-center gap-2" data-testid="stat-connections">
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">
              {stats ? `${formatCount(stats.connectionCount)} Connection${stats.connectionCount !== 1 ? "s" : ""}` : "— Connections"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
