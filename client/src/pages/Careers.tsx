import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase } from "lucide-react";

export default function Careers() {
  const jobs = [
    {
      id: 1,
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      location: "San Francisco, CA",
      type: "Full-time",
    },
    {
      id: 3,
      title: "Growth Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Join Our Team</h1>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Help us build the future of career mentorship. We're looking for passionate 
            people who want to make professional networking more accessible.
          </p>

          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        <Badge variant="secondary">{job.type}</Badge>
                      </div>
                    </div>
                    <Button>Apply Now</Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
