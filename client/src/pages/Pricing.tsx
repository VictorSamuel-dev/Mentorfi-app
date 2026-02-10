import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/stripe/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      return await res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const products = (productsData as any)?.data || [];
  const premiumProduct = products.find((p: any) => 
    p.metadata?.feature === "premium_messaging" || p.name === "Mentorfy Premium"
  );
  const monthlyPrice = premiumProduct?.prices?.[0];

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.isPremium) {
      return;
    }
    if (monthlyPrice?.id) {
      checkoutMutation.mutate(monthlyPrice.id);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Get started with intentional connections",
      features: [
        "Create a profile (student or mentor)",
        "Discover mentors aligned to your goals",
        "Request connections with mentor approval",
        "4 messages per connection (guardrails)",
        "Optional event-based context",
        "Standard matching",
      ],
      buttonText: "Get Started",
      highlighted: false,
      action: () => navigate(isAuthenticated ? "/dashboard" : "/signup"),
    },
    {
      name: "Premium",
      price: monthlyPrice ? `$${(monthlyPrice.unit_amount / 100).toFixed(2)}` : "$9.99",
      period: "/month",
      description: "Go deeper when you're ready",
      features: [
        "Everything in Free",
        "Unlimited messaging per connection",
        "Priority matching visibility",
        "Advanced filters (role, industry, goals)",
        "Early access to new features",
        "Optional event coordination tools",
      ],
      buttonText: user?.isPremium ? "Current Plan" : "Upgrade Now",
      highlighted: true,
      action: handleUpgrade,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4" data-testid="text-pricing-title">Simple Pricing</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Start free and upgrade when you're ready to go deeper.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={plan.highlighted ? "border-primary" : ""}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
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
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={plan.action}
                    disabled={
                      (plan.highlighted && user?.isPremium) || 
                      (plan.highlighted && checkoutMutation.isPending) ||
                      productsLoading
                    }
                    data-testid={`button-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.highlighted && checkoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      plan.buttonText
                    )}
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
