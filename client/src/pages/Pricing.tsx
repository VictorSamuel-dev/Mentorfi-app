import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Building2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [estimatedUsers, setEstimatedUsers] = useState("");

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["/api/stripe/products"],
    retry: 2,
    staleTime: 60000,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error("No checkout URL returned");
      }
      return data;
    },
    onError: (error: any) => {
      toast({
        title: "Checkout failed",
        description: error.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const quoteMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const res = await apiRequest("POST", "/api/enterprise/lead", payload);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      setQuoteSuccess(true);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const products = (productsData as any)?.data || (Array.isArray(productsData) ? productsData : []);
  const premiumProduct = products.find((p: any) => 
    p.metadata?.feature === "premium_messaging" || p.name === "Mentorfy Premium"
  );
  const monthlyPrice = premiumProduct?.prices?.[0];

  const FALLBACK_PRICE_ID = "price_1SzK9OIryGP3Ryv2bOMwkOWT";

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.isPremium) {
      return;
    }
    const priceId = monthlyPrice?.id || FALLBACK_PRICE_ID;
    checkoutMutation.mutate(priceId);
  };

  const handleQuoteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!estimatedUsers) {
      toast({ title: "Please select estimated users", variant: "destructive" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value as string;
    });
    payload.estimatedUsers = estimatedUsers;
    quoteMutation.mutate(payload);
  };

  const handleQuoteClose = () => {
    setQuoteOpen(false);
    setTimeout(() => {
      setQuoteSuccess(false);
      setEstimatedUsers("");
    }, 300);
    quoteMutation.reset();
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

  const enterpriseFeatures = [
    "Everything in Premium",
    "Dedicated account manager",
    "Custom onboarding & training",
    "Organization-wide analytics",
    "SSO / SAML integration",
    "SLA & priority support",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4" data-testid="text-pricing-title">Simple Pricing</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Start free and upgrade when you're ready to go deeper.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                      (plan.highlighted && checkoutMutation.isPending)
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

            <Card data-testid="card-plan-enterprise">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-2xl">Enterprise</CardTitle>
                </div>
                <CardDescription>For organizations scaling mentorship</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {enterpriseFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setQuoteOpen(true)}
                  data-testid="button-get-quote"
                >
                  Get a Quote
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={quoteOpen} onOpenChange={handleQuoteClose}>
        <DialogContent className="sm:max-w-lg">
          {quoteSuccess ? (
            <div className="py-8 text-center" data-testid="quote-success">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <DialogTitle className="text-xl mb-2">Thanks for reaching out</DialogTitle>
              <DialogDescription className="text-base">
                We'll reach out within 24-48 hours to discuss your organization's needs.
              </DialogDescription>
              <Button className="mt-6" onClick={handleQuoteClose} data-testid="button-close-success">
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Get an Enterprise Quote</DialogTitle>
                <DialogDescription>
                  Tell us about your organization and we'll put together a custom plan.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleQuoteSubmit} className="space-y-4 mt-2" data-testid="form-enterprise-quote">
                <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input id="fullName" name="fullName" required placeholder="Jane Doe" data-testid="input-full-name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workEmail">Work email *</Label>
                  <Input id="workEmail" name="workEmail" type="email" required placeholder="jane@company.com" data-testid="input-work-email" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Input id="organization" name="organization" required placeholder="Acme Corp" data-testid="input-organization" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleTitle">Role / Title</Label>
                  <Input id="roleTitle" name="roleTitle" placeholder="VP of Talent" data-testid="input-role-title" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedUsers">Estimated users *</Label>
                  <Select value={estimatedUsers} onValueChange={setEstimatedUsers}>
                    <SelectTrigger data-testid="select-estimated-users">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<100">Less than 100</SelectItem>
                      <SelectItem value="100-500">100 - 500</SelectItem>
                      <SelectItem value="500-2000">500 - 2,000</SelectItem>
                      <SelectItem value="2000+">2,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Anything else you'd like us to know..." rows={3} data-testid="input-notes" />
                </div>

                <Button type="submit" className="w-full" disabled={quoteMutation.isPending} data-testid="button-submit-quote">
                  {quoteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
