import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, MessageSquare, Shield, Sparkles, Target } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Discover Events",
    description: "Browse career fairs, info sessions, and workshops from Fortune 500 companies.",
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description: "Get notified when mentors with shared interests are attending the same events.",
  },
  {
    icon: Shield,
    title: "Gated Messaging",
    description: "Mentors approve connection requests before messaging begins. Quality over quantity.",
  },
  {
    icon: Target,
    title: "Intentional Networking",
    description: "Focus on meaningful connections at events, not random cold outreach.",
  },
  {
    icon: Users,
    title: "Build Relationships",
    description: "Connect with professionals at your target companies before you even meet.",
  },
  {
    icon: MessageSquare,
    title: "Continue Conversations",
    description: "Upgrade to keep conversations going with mentors who value your growth.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How Mentorfy Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A smarter approach to career networking that respects everyone's time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 bg-card" data-testid={`card-feature-${index}`}>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
