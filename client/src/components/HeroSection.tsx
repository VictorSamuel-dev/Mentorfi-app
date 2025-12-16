import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, MessageSquare } from "lucide-react";
import heroImage from "@assets/generated_images/career_fair_networking_scene.png";

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Connect with Fortune 500 Mentors at Your Next Career Event
        </h1>
        <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Mentorfy bridges college students with professionals at top companies through 
          shared event attendance. Build meaningful relationships before the event begins.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="gap-2"
            asChild
            data-testid="button-hero-get-started"
          >
            <a href="/api/login">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="backdrop-blur-sm bg-white/10 border-white/30 text-white"
            data-testid="button-hero-learn-more"
          >
            Learn More
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-white/80">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">500+ Mentors</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">100+ Events</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">2,000+ Connections</span>
          </div>
        </div>
      </div>
    </section>
  );
}
