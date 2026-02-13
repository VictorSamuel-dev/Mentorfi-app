import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "If an account exists with that email, you'll receive a reset link",
      });
    },
    onError: () => {
      setSubmitted(true);
      toast({
        title: "If an account exists with that email, you'll receive a reset link",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotMutation.mutate(email);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-forgot-password-title">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center space-y-4">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground" data-testid="text-reset-link-sent">
                  If an account exists with that email, you'll receive a reset link shortly.
                </p>
                <Link href="/auth">
                  <Button variant="outline" className="gap-2" data-testid="link-back-to-login">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-forgot-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotMutation.isPending}
                  data-testid="button-send-reset-link"
                >
                  {forgotMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <div className="text-center">
                  <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-to-login-form">
                    <ArrowLeft className="inline h-3 w-3 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
