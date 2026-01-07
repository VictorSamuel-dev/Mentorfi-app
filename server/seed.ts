import { db } from "./db";
import { events, users } from "@shared/schema";
import { hashPassword } from "./utils/password";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Check if events already exist
  const existingEvents = await db.select().from(events);
  if (existingEvents.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Create sample events
  const sampleEvents = [
    {
      name: "Tech Career Fair 2025",
      description: "Connect with top tech companies including Google, Meta, Amazon, and more.",
      date: new Date(2025, 1, 15, 10, 0), // Feb 15, 2025
      location: "San Francisco Convention Center",
      isVirtual: false,
      type: "career_fair",
      company: "Multiple Companies",
      industry: ["Technology", "Software Engineering", "AI/ML"],
    },
    {
      name: "Google Product Management Info Session",
      description: "Learn about PM roles at Google and get career advice from senior PMs.",
      date: new Date(2025, 1, 20, 14, 0), // Feb 20, 2025
      location: "Virtual",
      isVirtual: true,
      type: "info_session",
      company: "Google",
      industry: ["Technology", "Product Management"],
    },
    {
      name: "Resume Workshop with Microsoft Recruiters",
      description: "Get your resume reviewed by Microsoft recruiters and learn what stands out.",
      date: new Date(2025, 1, 22, 11, 0), // Feb 22, 2025
      location: "Stanford University, Gates Building",
      isVirtual: false,
      type: "workshop",
      company: "Microsoft",
      industry: ["Technology", "Career Development"],
    },
    {
      name: "Finance Industry Networking Night",
      description: "Network with professionals from Goldman Sachs, JP Morgan, and Morgan Stanley.",
      date: new Date(2025, 1, 25, 18, 0), // Feb 25, 2025
      location: "New York City, The Pierre Hotel",
      isVirtual: false,
      type: "career_fair",
      company: "Goldman Sachs, JP Morgan, Morgan Stanley",
      industry: ["Finance", "Investment Banking"],
    },
    {
      name: "Amazon Leadership Principles Workshop",
      description: "Deep dive into Amazon's leadership principles and how to demonstrate them in interviews.",
      date: new Date(2025, 2, 1, 13, 0), // Mar 1, 2025
      location: "Virtual",
      isVirtual: true,
      type: "workshop",
      company: "Amazon",
      industry: ["Technology", "Leadership"],
    },
    {
      name: "Consulting Case Interview Prep",
      description: "Practice case interviews with consultants from McKinsey, BCG, and Bain.",
      date: new Date(2025, 2, 5, 10, 0), // Mar 5, 2025
      location: "Harvard Business School",
      isVirtual: false,
      type: "workshop",
      company: "McKinsey, BCG, Bain",
      industry: ["Consulting", "Strategy"],
    },
    {
      name: "Startups & Venture Capital Panel",
      description: "Learn about startup opportunities and VC-backed companies from industry insiders.",
      date: new Date(2025, 2, 10, 16, 0), // Mar 10, 2025
      location: "Y Combinator Office, SF",
      isVirtual: false,
      type: "info_session",
      company: "Y Combinator",
      industry: ["Startups", "Venture Capital", "Technology"],
    },
    {
      name: "Meta Engineering Deep Dive",
      description: "Technical session on building at scale with Meta engineers.",
      date: new Date(2025, 2, 15, 14, 0), // Mar 15, 2025
      location: "Virtual",
      isVirtual: true,
      type: "info_session",
      company: "Meta",
      industry: ["Technology", "Software Engineering", "Infrastructure"],
    },
  ];

  await db.insert(events).values(sampleEvents);
  console.log(`Created ${sampleEvents.length} sample events`);

  // Create sample mentor users
  const mentorPassword = await hashPassword("mentor123");
  const sampleMentors = [
    {
      email: "sarah.chen@google.com",
      password: mentorPassword,
      firstName: "Sarah",
      lastName: "Chen",
      role: "mentor",
      company: "Google",
      jobTitle: "Senior Product Manager",
      interests: ["Product Management", "AI/ML", "User Research", "Strategy"],
      isVerified: true,
    },
    {
      email: "michael.rodriguez@microsoft.com",
      password: mentorPassword,
      firstName: "Michael",
      lastName: "Rodriguez",
      role: "mentor",
      company: "Microsoft",
      jobTitle: "Engineering Manager",
      interests: ["Software Engineering", "Cloud Computing", "Team Leadership"],
      isVerified: true,
    },
    {
      email: "emily.wang@meta.com",
      password: mentorPassword,
      firstName: "Emily",
      lastName: "Wang",
      role: "mentor",
      company: "Meta",
      jobTitle: "Data Scientist",
      interests: ["Data Science", "Machine Learning", "Python", "Statistics"],
      isVerified: true,
    },
    {
      email: "david.kim@amazon.com",
      password: mentorPassword,
      firstName: "David",
      lastName: "Kim",
      role: "mentor",
      company: "Amazon",
      jobTitle: "Software Development Engineer",
      interests: ["Backend Development", "System Design", "AWS", "Distributed Systems"],
      isVerified: true,
    },
    {
      email: "lisa.thompson@gs.com",
      password: mentorPassword,
      firstName: "Lisa",
      lastName: "Thompson",
      role: "mentor",
      company: "Goldman Sachs",
      jobTitle: "Investment Banking Associate",
      interests: ["Finance", "M&A", "Valuation", "Financial Modeling"],
      isVerified: true,
    },
  ];

  await db.insert(users).values(sampleMentors);
  console.log(`Created ${sampleMentors.length} sample mentors`);

  console.log("Database seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
