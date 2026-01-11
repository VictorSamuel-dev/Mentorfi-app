import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/api";
import { BadgeRow } from "@/components/UserBadge";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Crown, Camera, Loader2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { UserProfileWithBadges } from "@shared/schema";
import { MENTEE_GOAL_OPTIONS } from "@shared/schema";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  interests: z.string().optional(),
  targetCompanies: z.string().optional(),
  menteeGoals: z.array(z.string()).max(3, "Select up to 3 goals").optional(),
  menteeGoalStatement: z.string().max(200, "Maximum 200 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery<UserProfileWithBadges>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      jobTitle: "",
      interests: "",
      targetCompanies: "",
      menteeGoals: [],
      menteeGoalStatement: "",
    },
    values: profile ? {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      company: profile.company || "",
      jobTitle: profile.jobTitle || "",
      interests: profile.interests?.join(", ") || "",
      targetCompanies: profile.targetCompanies?.join(", ") || "",
      menteeGoals: profile.menteeGoals || [],
      menteeGoalStatement: profile.menteeGoalStatement || "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      jobTitle: data.jobTitle,
      interests: data.interests?.split(",").map(s => s.trim()).filter(Boolean),
      targetCompanies: data.targetCompanies?.split(",").map(s => s.trim()).filter(Boolean),
      menteeGoals: data.menteeGoals,
      menteeGoalStatement: data.menteeGoalStatement,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refetchProfile();
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      await updateProfile({ profileImageUrl: objectPath });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refetchProfile();

      toast({
        title: "Image updated",
        description: "Your profile image has been updated.",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading || !user) {
    return null;
  }

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

          {profileLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative group">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile?.profileImageUrl || undefined} />
                        <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        data-testid="button-change-avatar"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        data-testid="input-avatar-file"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Click to change photo</p>
                    <div className="text-center">
                      <h2 className="text-xl font-semibold">
                        {profile?.firstName} {profile?.lastName}
                      </h2>
                      <p className="text-muted-foreground">{profile?.email}</p>
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        {profile?.role}
                      </p>
                    </div>
                    {profile?.badges && profile.badges.length > 0 && (
                      <BadgeRow badges={profile.badges} variant="pill" />
                    )}
                    {profile?.isPremium && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">Premium Member</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-job-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interests (comma-separated)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="e.g., Product Management, AI, Startups"
                                data-testid="input-interests"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="targetCompanies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Companies (comma-separated)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="e.g., Google, Meta, Apple"
                                data-testid="input-target-companies"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Mentee Goals Section - only show for mentees */}
                      {profile?.role === "mentee" && (
                        <div className="space-y-4 pt-4 border-t">
                          <h3 className="font-semibold text-lg">Your Mentorship Goals</h3>
                          
                          <FormField
                            control={form.control}
                            name="menteeGoals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>What do you want help with? (select up to 3)</FormLabel>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                  {MENTEE_GOAL_OPTIONS.map((goal) => {
                                    const isSelected = field.value?.includes(goal) || false;
                                    const isMaxSelected = (field.value?.length || 0) >= 3;
                                    
                                    return (
                                      <div key={goal} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`goal-${goal}`}
                                          checked={isSelected}
                                          disabled={!isSelected && isMaxSelected}
                                          onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentValue, goal]);
                                            } else {
                                              field.onChange(currentValue.filter((g: string) => g !== goal));
                                            }
                                          }}
                                          data-testid={`checkbox-goal-${goal.toLowerCase().replace(/\s+/g, "-")}`}
                                        />
                                        <Label
                                          htmlFor={`goal-${goal}`}
                                          className={`text-sm cursor-pointer ${!isSelected && isMaxSelected ? "text-muted-foreground" : ""}`}
                                        >
                                          {goal}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="menteeGoalStatement"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>In one sentence, what would make this mentorship valuable for you?</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="e.g., I want to break into product management at a tech company after graduating next year."
                                    maxLength={200}
                                    className="resize-none"
                                    data-testid="input-mentee-goal-statement"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground text-right">
                                  {(field.value?.length || 0)}/200 characters
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        disabled={updateMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
