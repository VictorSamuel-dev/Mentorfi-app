import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, Lock, User, Shield, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";

const emailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required to confirm this change"),
});

type EmailFormData = z.infer<typeof emailSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: "",
      password: "",
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to change email");
      }
      return res.json();
    },
    onSuccess: () => {
      emailForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Email updated",
        description: "Your email address has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isAuthenticated={false} />
        <main className="flex-1 py-8 px-6">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} role={user.role} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Account Information</CardTitle>
                </div>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/profile")}
                    data-testid="button-edit-profile"
                  >
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Change Email</CardTitle>
                </div>
                <CardDescription>Update your email address. You'll need to confirm with your password.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit((data) => emailMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="newEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter new email address"
                              data-testid="input-new-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your current password"
                              data-testid="input-email-confirm-password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Required to verify your identity</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={emailMutation.isPending}
                        data-testid="button-change-email"
                      >
                        {emailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Email
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter current password" 
                              data-testid="input-current-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter new password" 
                              data-testid="input-new-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Must be at least 8 characters</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm new password" 
                              data-testid="input-confirm-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={passwordMutation.isPending}
                        data-testid="button-change-password"
                      >
                        {passwordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Change Password
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Privacy & Security</CardTitle>
                </div>
                <CardDescription>Manage your privacy settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your data is protected and only shared with mentors you connect with. 
                  Review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for more details.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
