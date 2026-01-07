import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">About Mentorfy</h1>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We're on a mission to democratize access to career mentorship by connecting 
            ambitious students with Fortune 500 professionals at career events.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                To create meaningful mentorship connections that accelerate career growth 
                for the next generation of professionals.
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Our Community</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Thousands of students and mentors from top companies building relationships 
                that last beyond a single event.
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Authenticity, accessibility, and intentional networking over random outreach.
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
