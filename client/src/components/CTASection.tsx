import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Find Your Mentor?
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Join thousands of students connecting with professionals through structured, 
          intentional mentorship — on their terms.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2" asChild data-testid="button-cta-signup">
            <a href="/auth">
              Sign Up as a Student
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild data-testid="button-cta-mentor">
            <a href="/auth">Become a Mentor</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
