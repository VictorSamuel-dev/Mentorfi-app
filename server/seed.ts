import { db } from "./db";
import { events, users, eventRsvps, connections } from "@shared/schema";
import { hashPassword } from "./utils/password";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Check if events already exist
  const existingEvents = await db.select().from(events);
  
  if (existingEvents.length === 0) {
    // Create sample events
    const sampleEvents = [
      {
        name: "Tech Career Fair 2025",
        description: "Connect with top tech companies including Google, Meta, Amazon, and more.",
        date: new Date(2025, 1, 15, 10, 0),
        location: "San Francisco Convention Center",
        isVirtual: false,
        type: "career_fair",
        company: "Multiple Companies",
        industry: ["Technology", "Software Engineering", "AI/ML"],
      },
      {
        name: "Google Product Management Info Session",
        description: "Learn about PM roles at Google and get career advice from senior PMs.",
        date: new Date(2025, 1, 20, 14, 0),
        location: "Virtual",
        isVirtual: true,
        type: "info_session",
        company: "Google",
        industry: ["Technology", "Product Management"],
      },
      {
        name: "Resume Workshop with Microsoft Recruiters",
        description: "Get your resume reviewed by Microsoft recruiters and learn what stands out.",
        date: new Date(2025, 1, 22, 11, 0),
        location: "Stanford University, Gates Building",
        isVirtual: false,
        type: "workshop",
        company: "Microsoft",
        industry: ["Technology", "Career Development"],
      },
      {
        name: "Finance Industry Networking Night",
        description: "Network with professionals from Goldman Sachs, JP Morgan, and Morgan Stanley.",
        date: new Date(2025, 1, 25, 18, 0),
        location: "New York City, The Pierre Hotel",
        isVirtual: false,
        type: "career_fair",
        company: "Goldman Sachs, JP Morgan, Morgan Stanley",
        industry: ["Finance", "Investment Banking"],
      },
      {
        name: "Amazon Leadership Principles Workshop",
        description: "Deep dive into Amazon's leadership principles and how to demonstrate them in interviews.",
        date: new Date(2025, 2, 1, 13, 0),
        location: "Virtual",
        isVirtual: true,
        type: "workshop",
        company: "Amazon",
        industry: ["Technology", "Leadership"],
      },
      {
        name: "Consulting Case Interview Prep",
        description: "Practice case interviews with consultants from McKinsey, BCG, and Bain.",
        date: new Date(2025, 2, 5, 10, 0),
        location: "Harvard Business School",
        isVirtual: false,
        type: "workshop",
        company: "McKinsey, BCG, Bain",
        industry: ["Consulting", "Strategy"],
      },
      {
        name: "Startups & Venture Capital Panel",
        description: "Learn about startup opportunities and VC-backed companies from industry insiders.",
        date: new Date(2025, 2, 10, 16, 0),
        location: "Y Combinator Office, SF",
        isVirtual: false,
        type: "info_session",
        company: "Y Combinator",
        industry: ["Startups", "Venture Capital", "Technology"],
      },
      {
        name: "Meta Engineering Deep Dive",
        description: "Technical session on building at scale with Meta engineers.",
        date: new Date(2025, 2, 15, 14, 0),
        location: "Virtual",
        isVirtual: true,
        type: "info_session",
        company: "Meta",
        industry: ["Technology", "Software Engineering", "Infrastructure"],
      },
    ];

    await db.insert(events).values(sampleEvents);
    console.log(`Created ${sampleEvents.length} sample events`);
  } else {
    console.log(`Events already exist (${existingEvents.length} events)`);
  }

  // Check for existing mentors
  const existingMentors = await db.select().from(users).where(eq(users.role, "mentor"));
  
  let mentorIds: Record<string, string> = {};
  
  if (existingMentors.length === 0) {
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
    
    for (const mentor of createdMentors) {
      mentorIds[mentor.email] = mentor.id;
    }
  } else {
    console.log(`Mentors already exist (${existingMentors.length} mentors)`);
    for (const mentor of existingMentors) {
      mentorIds[mentor.email] = mentor.id;
    }
  }

  // Check for existing mentees
  const existingMentees = await db.select().from(users).where(eq(users.role, "mentee"));
  
  let menteeIds: Record<string, string> = {};
  
  if (existingMentees.length === 0) {
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
    
    for (const mentee of createdMentees) {
      menteeIds[mentee.email] = mentee.id;
    }
  } else {
    console.log(`Mentees already exist (${existingMentees.length} mentees)`);
    for (const mentee of existingMentees) {
      menteeIds[mentee.email] = mentee.id;
    }
  }

  // Check for existing RSVPs
  const existingRsvps = await db.select().from(eventRsvps);
  
  if (existingRsvps.length === 0) {
    const allEvents = await db.select().from(events);
    const techCareerFair = allEvents.find(e => e.name.includes("Tech Career Fair"));
    const googleSession = allEvents.find(e => e.name.includes("Google Product"));
    
    const alexId = menteeIds["alex.student@university.edu"];
    const jordanId = menteeIds["jordan.learner@college.edu"];
    const sarahId = mentorIds["sarah.chen@google.com"];
    const michaelId = mentorIds["michael.rodriguez@microsoft.com"];
    const emilyId = mentorIds["emily.wang@meta.com"];

    if (techCareerFair && googleSession && alexId && jordanId && sarahId && michaelId && emilyId) {
      const rsvpData = [
        { userId: alexId, eventId: techCareerFair.id },
        { userId: jordanId, eventId: techCareerFair.id },
        { userId: sarahId, eventId: techCareerFair.id },
        { userId: michaelId, eventId: techCareerFair.id },
        { userId: emilyId, eventId: techCareerFair.id },
        { userId: alexId, eventId: googleSession.id },
        { userId: sarahId, eventId: googleSession.id },
      ];
      
      await db.insert(eventRsvps).values(rsvpData);
      console.log(`Created ${rsvpData.length} RSVPs`);
    }
  } else {
    console.log(`RSVPs already exist (${existingRsvps.length} RSVPs)`);
  }

  // Check for existing connections
  const existingConnections = await db.select().from(connections);
  
  if (existingConnections.length === 0) {
    const allEvents = await db.select().from(events);
    const techCareerFair = allEvents.find(e => e.name.includes("Tech Career Fair"));
    
    const alexId = menteeIds["alex.student@university.edu"];
    const sarahId = mentorIds["sarah.chen@google.com"];
    const michaelId = mentorIds["michael.rodriguez@microsoft.com"];

    if (techCareerFair && alexId && sarahId && michaelId) {
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
  } else {
    console.log(`Connections already exist (${existingConnections.length} connections)`);
  }

  console.log("\nDatabase seeding complete!");
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
