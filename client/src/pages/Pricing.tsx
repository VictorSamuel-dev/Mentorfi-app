import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Get started with limited messaging",
      features: [
        "Browse all career events",
        "RSVP to unlimited events",
        "View mentor profiles",
        "2 messages per connection",
        "Basic matching algorithm",
      ],
      buttonText: "Get Started",
      highlighted: false,
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Unlock unlimited networking",
      features: [
        "Everything in Free",
        "Unlimited messaging",
        "Priority matching",
        "Event coordination tools",
        "Advanced filters",
        "Read receipts",
      ],
      buttonText: "Upgrade Now",
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Simple Pricing</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Start free and upgrade when you're ready for more connections.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={plan.highlighted ? "border-primary" : ""}
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
