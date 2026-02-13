import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function VerifyEmail() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const { isLoading, isError, error } = useQuery({
    queryKey: ["/api/auth/verify-email", token],
    queryFn: async () => {
      const res = await fetch(`/api/auth/verify-email/${token}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Verification failed");
      }
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const noToken = !token;
  const isSuccess = !isLoading && !isError && !noToken;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-verify-email-title">
              {noToken ? "Invalid Link" : isLoading ? "Verifying Email..." : isError ? "Verification Failed" : "Email Verified"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {noToken && (
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-muted-foreground text-center" data-testid="text-no-token">
                  No verification token provided. Please use the link from your verification email.
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" data-testid="link-go-to-dashboard-no-token">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {!noToken && isLoading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground" data-testid="text-verifying">
                  Please wait while we verify your email...
                </p>
              </div>
            )}

            {!noToken && isError && (
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-muted-foreground text-center" data-testid="text-verify-error">
                  {(error as Error)?.message || "We couldn't verify your email. The link may be invalid or expired."}
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" data-testid="link-go-to-dashboard-error">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {isSuccess && (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground" data-testid="text-verify-success">
                  Your email has been verified successfully.
                </p>
                <Link href="/dashboard">
                  <Button data-testid="link-go-to-dashboard">Go to Dashboard</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
