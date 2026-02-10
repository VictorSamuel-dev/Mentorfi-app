import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Building2, Briefcase, Sparkles } from "lucide-react";
import { INDUSTRY_OPTIONS } from "@shared/schema";

const EXPERTISE_SUGGESTIONS = [
  "Product Management", "Software Engineering", "Data Science",
  "Marketing", "Finance", "Consulting", "Design", "Operations",
  "Sales", "Human Resources", "Strategy", "Research",
  "Business Development", "Supply Chain", "Legal",
];

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState(user?.company || "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [industry, setIndustry] = useState(user?.industry || "");
  const [yearsExperience, setYearsExperience] = useState<string>(
    user?.yearsExperience?.toString() || ""
  );

  const [bio, setBio] = useState(user?.bio || "");
  const [expertise, setExpertise] = useState<string[]>(user?.expertise || []);
  const [interests, setInterests] = useState(user?.interests?.join(", ") || "");

  if (isLoading) return null;
  if (!user) {
    setLocation("/login");
    return null;
  }

  const toggleExpertise = (item: string) => {
    setExpertise((prev) =>
      prev.includes(item)
        ? prev.filter((e) => e !== item)
        : prev.length < 5
        ? [...prev, item]
        : prev
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        company,
        jobTitle,
        industry,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
        bio,
        expertise,
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        onboardingComplete: true,
      } as any);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      toast({ title: "Profile set up successfully!" });
      setLocation("/dashboard");
    } catch {
      toast({ title: "Failed to save profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">Set Up Your Mentor Profile</h1>
              <span className="text-sm text-muted-foreground">
                Step {step} of {totalSteps}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Your Company & Role</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Google, Goldman Sachs"
                    data-testid="input-onboard-company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Product Manager"
                    data-testid="input-onboard-job-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger data-testid="select-onboard-industry">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    max="50"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g., 8"
                    data-testid="input-onboard-years"
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => setStep(2)}
                  disabled={!company || !jobTitle}
                  data-testid="button-onboard-next-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle>Your Expertise</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select your areas of expertise (up to 5)</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERTISE_SUGGESTIONS.map((item) => {
                      const selected = expertise.includes(item);
                      return (
                        <Badge
                          key={item}
                          variant={selected ? "default" : "outline"}
                          className={`cursor-pointer toggle-elevate ${selected ? "toggle-elevated" : ""}`}
                          onClick={() => toggleExpertise(item)}
                          data-testid={`badge-expertise-${item.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {item}
                        </Badge>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {expertise.length}/5 selected
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">
                    Interests (comma-separated)
                  </Label>
                  <Textarea
                    id="interests"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g., AI, Startups, Career Coaching"
                    data-testid="input-onboard-interests"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    data-testid="button-onboard-back-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setStep(3)}
                    disabled={expertise.length === 0}
                    data-testid="button-onboard-next-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>About You</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">
                    Short bio (visible to mentees)
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell mentees a bit about your career journey and what you enjoy mentoring on..."
                    maxLength={500}
                    className="resize-none min-h-[120px]"
                    data-testid="input-onboard-bio"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500 characters
                  </p>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-2">Profile Summary</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium text-foreground">{jobTitle}</span> at{" "}
                        <span className="font-medium text-foreground">{company}</span>
                      </p>
                      {industry && <p>Industry: {industry}</p>}
                      {yearsExperience && <p>{yearsExperience} years of experience</p>}
                      {expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expertise.map((e) => (
                            <Badge key={e} variant="secondary">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    data-testid="button-onboard-back-3"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleFinish}
                    disabled={saving}
                    data-testid="button-onboard-finish"
                  >
                    {saving ? "Saving..." : "Complete Setup"}
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
