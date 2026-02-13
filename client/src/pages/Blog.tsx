import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User } from "lucide-react";

import blogArtisStevens from "@/assets/images/blog-artis-stevens.png";
import blogCareerFair from "@/assets/images/blog-career-fair.png";
import blogIndustryMentorship from "@/assets/images/blog-industry-mentorship.png";
import blogNetworkingIntroverts from "@/assets/images/blog-networking-introverts.png";
import blogPersonalBrand from "@/assets/images/blog-personal-brand.png";
import blogMentorQuestions from "@/assets/images/blog-mentor-questions.png";
import blogCareerTransition from "@/assets/images/blog-career-transition.png";

interface BlogPost {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  content: string;
}

const posts: BlogPost[] = [
  {
    id: "artis-stevens-daily-show-mentorship",
    title: "Artis Stevens Champions Mentorship on The Daily Show",
    description: "Big Brothers Big Sisters CEO Artis Stevens joins The Daily Show to discuss the transformative power of mentorship and its far-reaching impact on young people, the economy, and society.",
    category: "Mentorship",
    date: "Jan 22, 2026",
    author: "Mentorfy Editorial",
    readTime: "6 min read",
    image: blogArtisStevens,
    content: `On January 20, 2026, Artis Stevens, President and CEO of Big Brothers Big Sisters of America (BBBSA), sat down with comedian Josh Johnson on The Daily Show for a powerful conversation about the transformative role of mentorship in shaping young lives and driving society forward.

Stevens, who made history as the first Black CEO in BBBSA's 120-plus year history, brought both personal passion and data-driven insights to the conversation. His message was clear: mentorship is not just a nice thing to do — it is one of the most effective investments a society can make.

## The Power of Human Connection

During the interview, Stevens emphasized that mentorship goes far beyond career advice. "It's about showing up for someone consistently," he said. "When a young person knows that an adult outside their family believes in them, it changes the trajectory of their life."

Stevens shared compelling research showing that mentored youth are 54% less likely to have contact with the juvenile justice system, earn higher salaries in their early twenties, and attend college at higher rates. Perhaps most striking, government investments in mentorship programs can be recouped within seven years through reduced social services costs and increased tax revenue.

## A Track Record of Impact

Under Stevens' leadership, BBBSA has more than doubled its annual revenue and secured a landmark $122.6 million donation from MacKenzie Scott — the largest single gift in the organization's history. The organization has also risen to become a Top 10 Most Trusted Nonprofit in the United States.

Stevens' work has not gone unnoticed. In 2025, he was named to TIME magazine's inaugural TIME100 Philanthropy list, recognizing the 100 most influential leaders in philanthropy. He was also honored on the ForbesBLK Top 50 list in 2024 and Worth Magazine's Worthy 100 in 2023.

## What It Takes to Be a Mentor

One of the most compelling parts of the conversation was Stevens' straightforward take on what it means to be a mentor. "You don't need to have all the answers," he told Johnson. "You just need to be willing to listen, to share your experiences, and to be consistent."

This resonates deeply with what we see on Mentorfy every day. The best mentorship relationships are built on genuine connection — a willingness to invest time and attention in someone else's growth.

## Why This Matters Now

At a time when many young professionals feel uncertain about their career paths and disconnected from the networks that drive opportunity, Stevens' message is especially timely. Mentorship bridges the gap between potential and opportunity, giving people the guidance and confidence they need to take the next step.

For anyone considering becoming a mentor or seeking one, Stevens' appearance on The Daily Show is a reminder that these relationships can be truly life-changing — for both the mentor and the mentee.

Whether through organizations like Big Brothers Big Sisters or platforms like Mentorfy, the call to action is simple: show up, be present, and invest in someone's future.`,
  },
  {
    id: "navigating-career-transitions-with-confidence",
    title: "Navigating Career Transitions with Confidence",
    description: "A practical guide to making successful career changes at any stage of your professional journey.",
    category: "Career Tips",
    date: "Feb 10, 2026",
    author: "Mentorfy Editorial",
    readTime: "5 min read",
    image: blogCareerTransition,
    content: `Career transitions are becoming increasingly common. Whether you are switching industries, moving from a corporate role to a startup, or pivoting into an entirely new field, the process can feel daunting. But with the right approach, a career transition can be the best professional decision you ever make.

## Start With Why

Before making any move, get clear on your motivation. Are you running away from something (burnout, toxic culture, lack of growth) or running toward something (a new passion, better alignment with your values, greater impact)? The answer matters because it shapes how you approach the transition.

## Audit Your Transferable Skills

You have more relevant experience than you think. The skills you have built — communication, project management, problem-solving, leadership — transfer across industries. Make a list of your core competencies and think about how they apply to your target field.

## Fill the Gaps Strategically

If your target role requires specific knowledge or credentials you do not have, create a focused plan to acquire them. This might mean taking a course, earning a certification, or doing project-based work. Do not try to learn everything at once — identify the two or three most critical gaps and address those first.

## Leverage Informational Interviews

One of the most effective ways to prepare for a career transition is to talk to people who are already doing what you want to do. Informational interviews help you understand the realities of a new field, build connections, and identify opportunities that are not posted publicly.

## Find a Mentor Who Has Made a Similar Transition

A mentor who has navigated a career change themselves can offer invaluable guidance. They understand the emotional and practical challenges involved and can help you avoid common pitfalls. Platforms like Mentorfy can connect you with professionals who have walked a similar path.

## Be Patient With the Process

Career transitions rarely happen overnight. There is usually an awkward middle period where you feel like you are between identities. This is normal. Stay focused on your long-term vision, keep building relevant skills and connections, and trust that the pieces will come together.

The most successful career changers are not the ones with the most impressive resumes. They are the ones who are willing to do the work of self-reflection, skill-building, and relationship-building that makes a transition sustainable.`,
  },
  {
    id: "building-your-personal-brand-in-2026",
    title: "Building Your Personal Brand in 2026",
    description: "How to establish a professional identity that opens doors and attracts the right opportunities.",
    category: "Career Tips",
    date: "Feb 3, 2026",
    author: "Mentorfy Editorial",
    readTime: "5 min read",
    image: blogPersonalBrand,
    content: `Your personal brand is not a logo or a tagline. It is the professional reputation that precedes you — what people say about you when you are not in the room. In 2026, building an intentional personal brand has never been more important.

## Define What You Stand For

Before you can communicate your brand to others, you need to be clear about it yourself. What are your core professional values? What expertise do you bring? What kind of work energizes you? Write down three to five words that you want people to associate with you professionally.

## Be Consistent Across Platforms

Your LinkedIn profile, portfolio website, and any other professional presence should tell a coherent story. If your LinkedIn says you are passionate about data science but your portfolio is full of graphic design work, people will be confused about who you are and what you offer.

## Share Your Knowledge Generously

One of the most effective ways to build a personal brand is to share what you know. Write about your field, comment thoughtfully on industry trends, and offer insights based on your experience. This positions you as someone who adds value, not just someone looking for opportunities.

## Let Your Work Speak

The strongest personal brands are built on a foundation of quality work. Before worrying about your online presence, make sure you are doing excellent work in your current role. Recommendations and referrals from people who have worked with you carry more weight than any amount of self-promotion.

## Seek Mentorship for Brand Development

A mentor can help you see blind spots in how you present yourself professionally. They can offer honest feedback on your resume, your online presence, and even how you come across in conversations. Sometimes an outside perspective reveals strengths you did not know you had.

## Authenticity Wins

Trying to project an image that does not match who you actually are is exhausting and unsustainable. The most compelling personal brands are authentic ones. Be honest about your experience level, your interests, and your goals. People connect with real people, not polished personas.

Building a personal brand is a long-term investment. Start with clarity about who you are, be consistent in how you show up, and let your genuine expertise shine through.`,
  },
  {
    id: "five-questions-to-ask-your-mentor",
    title: "5 Questions to Ask Your Mentor in Your First Meeting",
    description: "Make the most of your initial mentorship conversation with these thoughtful questions.",
    category: "Mentorship",
    date: "Jan 28, 2026",
    author: "Mentorfy Editorial",
    readTime: "4 min read",
    image: blogMentorQuestions,
    content: `Your first meeting with a new mentor can feel high-stakes. You want to make a good impression, but you also want to get real value from the conversation. The best way to do both is to come prepared with thoughtful questions.

Here are five questions that will help you start your mentorship relationship on the right foot.

## 1. What do you wish you had known at my stage in your career?

This question invites your mentor to share hard-won wisdom that you will not find in any textbook. Their answer will often reveal the hidden challenges and unexpected turns that shaped their career, giving you a roadmap to navigate your own.

## 2. What skills or experiences do you think are most important for someone in my position?

This gets specific and actionable. Instead of general advice, you are asking your mentor to help you prioritize. Their answer can help you decide which opportunities to pursue and which to pass on.

## 3. How did you build your professional network?

Everyone's networking journey is different, and hearing your mentor's story can give you ideas for building your own. They may also offer to introduce you to people in their network, which is one of the most valuable things a mentor can do.

## 4. What is one mistake you see early-career professionals make repeatedly?

Mentors have a pattern-recognition advantage — they have seen many people navigate the path you are on. This question lets you learn from others' mistakes without having to make them yourself.

## 5. How can I make the most of our time together?

This shows respect for your mentor's time and signals that you are serious about the relationship. It also opens a conversation about expectations, frequency of meetings, and what kind of support would be most helpful.

## A Bonus Tip

After your first meeting, send a brief thank-you message that references something specific from your conversation. This small gesture sets the tone for a professional and respectful mentorship relationship.

Remember, mentorship is a two-way relationship. While your mentor brings experience and perspective, you bring fresh energy and new ideas. The best mentorship conversations feel like genuine exchanges, not one-sided lectures.`,
  },
  {
    id: "how-to-make-the-most-of-your-next-career-fair",
    title: "How to Make the Most of Your Next Career Fair",
    description: "Tips for standing out and making meaningful connections with recruiters and mentors.",
    category: "Career Tips",
    date: "Jan 10, 2026",
    author: "Mentorfy Editorial",
    readTime: "5 min read",
    image: blogCareerFair,
    content: `Career fairs remain one of the most effective ways to make direct connections with employers and industry professionals. But simply showing up is not enough. To truly make the most of your next career fair, you need a strategy.

## Do Your Research Beforehand

Before the event, review the list of attending companies and identify the ones that align with your career goals. Visit their websites, understand their recent news, and prepare tailored questions. Recruiters notice when a candidate has done their homework.

## Perfect Your Elevator Pitch

You will have roughly 30 to 60 seconds to make a first impression. Prepare a concise pitch that covers who you are, what you are studying or working on, and what kind of opportunity you are looking for. Practice it until it feels natural, not rehearsed.

## Bring the Right Materials

Have printed copies of your resume on quality paper. Consider bringing a portfolio or examples of your work if relevant. Make sure your LinkedIn profile is up to date — many recruiters will look you up immediately after meeting you.

## Ask Meaningful Questions

Instead of asking generic questions like "What does your company do?", try asking about team culture, growth opportunities, or specific projects the company is working on. This shows genuine interest and helps you stand out from the crowd.

## Follow Up Within 48 Hours

After the fair, send personalized follow-up emails or LinkedIn messages to the people you connected with. Reference something specific from your conversation to jog their memory. This simple step puts you ahead of the majority of attendees who never follow up.

## Leverage Your Network

If you have a mentor, ask them if they have any connections at the companies you are targeting. A warm introduction can open doors that a cold application cannot. Platforms like Mentorfy make it easy to find mentors who have experience at your target companies.

Career fairs are opportunities disguised as crowded convention halls. With the right preparation, you can turn a brief conversation into a career-defining connection.`,
  },
  {
    id: "the-power-of-industry-mentorship",
    title: "The Power of Industry Mentorship",
    description: "Why having a mentor in your target industry can accelerate your career growth.",
    category: "Mentorship",
    date: "Jan 5, 2026",
    author: "Mentorfy Editorial",
    readTime: "5 min read",
    image: blogIndustryMentorship,
    content: `There is a reason that nearly every successful professional can point to a mentor who helped shape their career. Industry mentorship — having a guide who understands the specific landscape you are trying to navigate — is one of the most powerful accelerators for career growth.

## Why Industry-Specific Mentors Matter

A general mentor can offer life advice and encouragement, but an industry mentor brings something additional: context. They understand the unwritten rules, the hiring patterns, the skills that actually matter versus the ones that just look good on paper.

When you are trying to break into finance, for example, a mentor who has spent years at an investment bank can tell you which certifications actually carry weight, which networking events matter, and what interviewers are really looking for.

## The Shortcut to Institutional Knowledge

Every industry has institutional knowledge — the kind that is never written down but everyone seems to know. This includes understanding the real career progression path (not the one on the company website), knowing which teams are growing, and recognizing the skills that will be in demand two years from now.

A mentor with industry experience gives you access to this knowledge years before you would acquire it on your own.

## Building Confidence Through Validation

One of the underappreciated benefits of mentorship is validation. When someone who has walked the path you want to walk tells you that you are on the right track, it builds confidence in a way that no online course or self-help book can match.

This is especially important for people from underrepresented backgrounds who may not have access to informal networks that provide this kind of reassurance naturally.

## How to Find the Right Industry Mentor

Start by identifying professionals whose career paths align with where you want to be in five to ten years. Look for people who are generous with their time and genuinely interested in helping others grow.

Platforms like Mentorfy are designed specifically to facilitate these connections, matching you with mentors based on shared industries, interests, and career goals. The right mentor can compress years of trial and error into months of focused growth.`,
  },
  {
    id: "networking-strategies-for-introverts",
    title: "Networking Strategies for Introverts",
    description: "Practical approaches to building professional relationships without the overwhelm.",
    category: "Networking",
    date: "Jan 2, 2026",
    author: "Mentorfy Editorial",
    readTime: "4 min read",
    image: blogNetworkingIntroverts,
    content: `Networking does not have to mean working a room full of strangers with a stack of business cards. For introverts, the traditional networking playbook can feel exhausting and inauthentic. The good news is that some of the most effective networking strategies are perfectly suited to introverted strengths.

## Quality Over Quantity

Introverts tend to prefer deep, meaningful conversations over surface-level small talk. This is actually an advantage. Building a few strong professional relationships is far more valuable than collecting hundreds of LinkedIn connections you will never speak to again.

Focus on having two or three genuine conversations at any event rather than trying to meet everyone in the room.

## Leverage Written Communication

Many introverts express themselves more effectively in writing than in spontaneous conversation. Use this to your advantage. Send thoughtful follow-up emails after meetings. Write LinkedIn posts sharing your professional insights. Engage with others' content by leaving substantive comments.

## Prepare Conversation Starters

One of the most stressful parts of networking for introverts is the unpredictability. Reduce this by preparing a few go-to conversation starters and questions. Having these ready gives you a safety net when your mind goes blank.

## Use One-on-One Meetings

Large networking events can be overwhelming. Instead, suggest coffee chats or virtual one-on-one meetings with people you want to connect with. These smaller settings play to introverted strengths and allow for more meaningful exchanges.

## Find Structured Networking Opportunities

Mentorship platforms like Mentorfy provide structured ways to build professional connections. Instead of navigating chaotic networking events, you can be matched with professionals who share your interests and goals, making the process more intentional and less draining.

## Recharge Strategically

If you do attend large events, give yourself permission to step outside, take breaks, and leave when your energy runs out. You will make better impressions in the first hour when you are engaged than in the third hour when you are running on empty.

Networking as an introvert is not about becoming someone you are not. It is about finding approaches that work with your natural strengths.`,
  },
];

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  if (selectedPost) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isAuthenticated={false} />

        <main className="flex-1 py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="ghost"
              className="mb-8"
              onClick={() => setSelectedPost(null)}
              data-testid="button-back-to-blog"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>

            <img
              src={selectedPost.image}
              alt={selectedPost.title}
              className="w-full aspect-video object-cover rounded-md mb-8"
              data-testid="img-blog-hero"
            />

            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Badge variant="secondary">{selectedPost.category}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedPost.readTime}
                </span>
                <span className="text-sm text-muted-foreground">{selectedPost.date}</span>
              </div>
              <h1 className="text-3xl font-bold mb-3" data-testid="text-blog-title">{selectedPost.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{selectedPost.author}</span>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              {selectedPost.content.split("\n\n").map((paragraph, idx) => {
                if (paragraph.startsWith("## ")) {
                  return <h2 key={idx} className="text-xl font-semibold mt-8 mb-3">{paragraph.replace("## ", "")}</h2>;
                }
                return <p key={idx} className="mb-4 leading-relaxed text-muted-foreground">{paragraph}</p>;
              })}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

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
              <Card
                key={post.id}
                className="hover-elevate cursor-pointer overflow-visible"
                onClick={() => setSelectedPost(post)}
                data-testid={`card-blog-${post.id}`}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 sm:min-w-64 h-48 sm:h-auto">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover rounded-t-md sm:rounded-t-none sm:rounded-l-md"
                      data-testid={`img-blog-thumb-${post.id}`}
                    />
                  </div>
                  <CardHeader className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">{post.date}</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
