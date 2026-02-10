import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useSearch } from "wouter";

export default function Premium() {
  const { user, isAuthenticated, isLoading, refetch } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const success = params.get("success") === "true";
  const canceled = params.get("canceled") === "true";
  const [syncing, setSyncing] = useState(false);
  const polledRef = useRef(false);

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["/api/stripe/subscription"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (success && isAuthenticated && !user?.isPremium && !polledRef.current) {
      polledRef.current = true;
      setSyncing(true);

      let attempts = 0;
      const maxAttempts = 10;

      const pollSync = async () => {
        try {
          const res = await apiRequest("POST", "/api/stripe/sync-status");
          const data = await res.json();
          if (data.isPremium) {
            await refetch();
            queryClient.invalidateQueries({ queryKey: ["/api/stripe/subscription"] });
            setSyncing(false);
            return;
          }
        } catch (e) {
          // ignore
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollSync, 2000);
        } else {
          setSyncing(false);
        }
      };

      setTimeout(pollSync, 2000);
    }
  }, [success, isAuthenticated, user?.isPremium]);

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal");
      return await res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isAuthenticated={false} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          {success && (
            <Card className="mb-8 border-primary" data-testid="card-upgrade-success">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  {syncing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Check className="h-6 w-6 text-primary" />
                  )}
                  <h2 className="text-xl font-semibold">
                    {syncing ? "Activating Premium..." : "Welcome to Premium!"}
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  {syncing
                    ? "We're confirming your payment. This usually takes just a few seconds."
                    : "Your upgrade was successful. You now have unlimited messaging with all your connections."}
                </p>
              </CardContent>
            </Card>
          )}

          {canceled && (
            <Card className="mb-8" data-testid="card-upgrade-canceled">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Checkout was canceled. You can upgrade anytime from this page or the pricing page.
                </p>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-premium-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Premium Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading subscription info...
                </div>
              ) : user?.isPremium ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="font-medium">You are a Premium member</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You have unlimited messaging with all your connections.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                    data-testid="button-manage-subscription"
                  >
                    {portalMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    You're on the free plan. Upgrade to unlock unlimited messaging.
                  </p>
                  <Button
                    onClick={() => navigate("/pricing")}
                    data-testid="button-view-pricing"
                  >
                    View Pricing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
