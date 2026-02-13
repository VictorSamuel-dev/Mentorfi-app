import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const { isLoading: validating, isError: tokenInvalid } = useQuery({
    queryKey: ["/api/auth/reset-password", token],
    queryFn: async () => {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Invalid token");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
    },
    onSuccess: () => {
      setResetSuccess(true);
      toast({ title: "Password reset successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message || "Could not reset password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-reset-password-title">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validating && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground" data-testid="text-validating-token">Validating reset link...</p>
              </div>
            )}

            {!token || tokenInvalid ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-muted-foreground text-center" data-testid="text-invalid-token">
                  This reset link is invalid or has expired.
                </p>
                <Link href="/forgot-password">
                  <Button variant="outline" data-testid="link-request-new-reset">
                    Request a new reset link
                  </Button>
                </Link>
              </div>
            ) : resetSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground" data-testid="text-reset-success">
                  Your password has been reset successfully.
                </p>
                <Link href="/auth">
                  <Button data-testid="link-go-to-login">Go to Login</Button>
                </Link>
              </div>
            ) : !validating && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetMutation.isPending}
                  data-testid="button-reset-password"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
