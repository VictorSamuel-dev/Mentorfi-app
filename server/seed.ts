import { db } from "./db";
import { events, users, eventRsvps, connections } from "@shared/schema";
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

  const createdMentors = await db.insert(users).values(sampleMentors).returning();
  console.log(`Created ${sampleMentors.length} sample mentors`);

  // Create sample mentee users for testing connection visibility
  const menteePassword = await hashPassword("student123");
  const sampleMentees = [
    {
      email: "alex.student@university.edu",
      password: menteePassword,
      firstName: "Alex",
      lastName: "Johnson",
      role: "mentee",
      interests: ["Product Management", "AI/ML", "Startups"],
      targetCompanies: ["Google", "Meta", "Amazon"],
    },
    {
      email: "jordan.learner@college.edu",
      password: menteePassword,
      firstName: "Jordan",
      lastName: "Smith",
      role: "mentee",
      interests: ["Software Engineering", "System Design", "Cloud Computing"],
      targetCompanies: ["Microsoft", "Amazon", "Google"],
    },
  ];

  const createdMentees = await db.insert(users).values(sampleMentees).returning();
  console.log(`Created ${sampleMentees.length} sample mentees`);

  // Get the created events
  const createdEvents = await db.select().from(events);
  const techCareerFair = createdEvents.find(e => e.name.includes("Tech Career Fair"));
  const googleSession = createdEvents.find(e => e.name.includes("Google Product"));
  
  if (techCareerFair && googleSession) {
    // Create RSVPs: Alex and mentors attend the same events
    const alexId = createdMentees.find(m => m.email === "alex.student@university.edu")?.id;
    const jordanId = createdMentees.find(m => m.email === "jordan.learner@college.edu")?.id;
    const sarahId = createdMentors.find(m => m.email === "sarah.chen@google.com")?.id;
    const michaelId = createdMentors.find(m => m.email === "michael.rodriguez@microsoft.com")?.id;
    const emilyId = createdMentors.find(m => m.email === "emily.wang@meta.com")?.id;

    if (alexId && jordanId && sarahId && michaelId && emilyId) {
      // All users RSVP to Tech Career Fair
      const rsvpData = [
        { userId: alexId, eventId: techCareerFair.id },
        { userId: jordanId, eventId: techCareerFair.id },
        { userId: sarahId, eventId: techCareerFair.id },
        { userId: michaelId, eventId: techCareerFair.id },
        { userId: emilyId, eventId: techCareerFair.id },
        // Some also attend Google session
        { userId: alexId, eventId: googleSession.id },
        { userId: sarahId, eventId: googleSession.id },
      ];
      
      await db.insert(eventRsvps).values(rsvpData);
      console.log(`Created ${rsvpData.length} RSVPs`);

      // Create connections with different statuses for testing:
      // - Alex <-> Sarah: APPROVED (Alex should see Sarah in event details)
      // - Alex <-> Michael: PENDING (Alex should NOT see Michael)
      // - Alex <-> Emily: No connection (Alex should NOT see Emily)
      const connectionData = [
        {
          fromUserId: alexId,
          toUserId: sarahId,
          status: "approved",
          message: "Hi Sarah, I'd love to learn about PM at Google!",
          eventId: techCareerFair.id,
          approvedAt: new Date(),
        },
        {
          fromUserId: alexId,
          toUserId: michaelId,
          status: "pending",
          message: "Hi Michael, interested in software engineering at Microsoft!",
          eventId: techCareerFair.id,
        },
      ];

      await db.insert(connections).values(connectionData);
      console.log(`Created ${connectionData.length} connections (1 approved, 1 pending)`);
    }
  }

  console.log("Database seeding complete!");
  console.log("\nTest accounts:");
  console.log("  Mentee: alex.student@university.edu / student123");
  console.log("  Mentee: jordan.learner@college.edu / student123");
  console.log("  Mentor: sarah.chen@google.com / mentor123");
  console.log("\nTest scenario:");
  console.log("  - Alex has APPROVED connection with Sarah -> Alex can see Sarah at events");
  console.log("  - Alex has PENDING connection with Michael -> Alex cannot see Michael");
  console.log("  - Alex has NO connection with Emily -> Alex cannot see Emily");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
