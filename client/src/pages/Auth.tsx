import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, register, loginPending, registerPending, refetch } = useAuth();
  const { toast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("mentee");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: loginEmail, password: loginPassword });
      await refetch();
      toast({ title: "Welcome back!" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        email: registerEmail,
        password: registerPassword,
        firstName,
        lastName,
        role,
      });
      await refetch();
      toast({ title: "Account created successfully!" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Mentorfy</CardTitle>
            <CardDescription>
              Connect with Fortune 500 mentors at career events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginPending}
                    data-testid="button-login"
                  >
                    {loginPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      data-testid="input-register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      data-testid="input-register-password"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>I am a...</Label>
                    <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mentee" id="mentee" data-testid="radio-mentee" />
                        <Label htmlFor="mentee" className="font-normal">Student (Mentee)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mentor" id="mentor" data-testid="radio-mentor" />
                        <Label htmlFor="mentor" className="font-normal">Professional (Mentor)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerPending}
                    data-testid="button-register"
                  >
                    {registerPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
