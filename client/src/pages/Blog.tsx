import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: "How to Make the Most of Your Next Career Fair",
      description: "Tips for standing out and making meaningful connections with recruiters and mentors.",
      category: "Career Tips",
      date: "Jan 5, 2025",
    },
    {
      id: 2,
      title: "The Power of Industry Mentorship",
      description: "Why having a mentor in your target industry can accelerate your career growth.",
      category: "Mentorship",
      date: "Jan 2, 2025",
    },
    {
      id: 3,
      title: "Networking Strategies for Introverts",
      description: "Practical approaches to building professional relationships without the overwhelm.",
      category: "Networking",
      date: "Dec 28, 2024",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Career tips, mentorship insights, and networking strategies.
          </p>

          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="hover-elevate cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground">{post.date}</span>
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription>{post.description}</CardDescription>
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
