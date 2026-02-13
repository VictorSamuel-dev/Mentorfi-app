import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Users, Video, User, Clock, ChevronRight, X } from "lucide-react";

interface OnboardingTourProps {
  role: "mentor" | "mentee";
  onComplete: () => void;
}

const menteeSteps = [
  {
    title: "Welcome to Mentorfy!",
    content: "Your gateway to connecting with Fortune 500 professionals. Let's show you around.",
    icon: Sparkles,
  },
  {
    title: "Discover Events",
    content: "Browse career fairs, info sessions, and workshops. RSVP to events to find mentors attending the same ones.",
    icon: Calendar,
  },
  {
    title: "Connect with Mentors",
    content: "Send connection requests to mentors. Once approved, you can message them directly.",
    icon: Users,
  },
  {
    title: "Schedule Meetings",
    content: "Book video calls, phone calls, or in-person meetings with your mentors.",
    icon: Video,
  },
];

const mentorSteps = [
  {
    title: "Welcome to Mentorfy!",
    content: "Thank you for offering to mentor the next generation. Let's get you set up.",
    icon: Sparkles,
  },
  {
    title: "Complete Your Profile",
    content: "Add your company, expertise, and bio so students can find and connect with you.",
    icon: User,
  },
  {
    title: "Manage Connections",
    content: "Review and approve connection requests from students who want your guidance.",
    icon: Users,
  },
  {
    title: "Set Your Availability",
    content: "Configure your weekly schedule and blocked dates so mentees can book meetings at convenient times.",
    icon: Clock,
  },
];

export function OnboardingTour({ role, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = role === "mentor" ? mentorSteps : menteeSteps;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity"
      data-testid="onboarding-tour"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onComplete}
            data-testid="button-tour-skip"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center">{step.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-center text-muted-foreground">{step.content}</p>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${i === currentStep ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="ghost"
              onClick={onComplete}
              data-testid="button-tour-skip"
            >
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              className="gap-1"
              data-testid="button-tour-next"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
