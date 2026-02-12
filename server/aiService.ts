import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const FAST_MODEL = "gpt-4o-mini";
const CAPABLE_MODEL = "gpt-4o";

interface UserContext {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  industry?: string | null;
  expertise?: string[] | null;
  bio?: string | null;
  interests?: string[] | null;
  targetCompanies?: string[] | null;
  menteeGoals?: string[] | null;
  menteeGoalStatement?: string | null;
  school?: string | null;
  program?: string | null;
  role?: string | null;
}

export interface ConversationStarter {
  text: string;
  category: string;
}

export interface MeetingPrepSummary {
  menteeOverview: string;
  conversationHighlights: string[];
  suggestedTopics: string[];
  questionsToAsk: string[];
}

export interface MatchScore {
  score: number;
  rationale: string;
  strengths: string[];
}

export interface CareerInsight {
  pattern: string;
  description: string;
  relevantMentorCount: number;
}

export interface RefinedGoal {
  refinedStatement: string;
  actionItems: string[];
  feedback: string;
}

export async function generateConversationStarters(
  mentor: UserContext,
  mentee: UserContext
): Promise<ConversationStarter[]> {
  const prompt = `You are helping a college student start a conversation with a professional mentor on a career mentorship platform.

Mentor profile:
- Name: ${mentor.firstName} ${mentor.lastName}
- Company: ${mentor.company || "Not specified"}
- Role: ${mentor.jobTitle || "Not specified"}
- Industry: ${mentor.industry || "Not specified"}
- Expertise: ${mentor.expertise?.join(", ") || "Not specified"}
- Bio: ${mentor.bio || "Not specified"}

Mentee profile:
- Name: ${mentee.firstName} ${mentee.lastName}
- School: ${mentee.school || "Not specified"}
- Program: ${mentee.program || "Not specified"}
- Interests: ${mentee.interests?.join(", ") || "Not specified"}
- Target Companies: ${mentee.targetCompanies?.join(", ") || "Not specified"}
- Goals: ${mentee.menteeGoals?.join(", ") || "Not specified"}
- Goal Statement: ${mentee.menteeGoalStatement || "Not specified"}

Generate 4 conversation starter messages the mentee could send. Each should be warm, specific to both profiles, and open a meaningful dialogue. Vary the categories: one about the mentor's career journey, one about industry/role advice, one about a shared interest or goal, and one that's more personal/creative.

Respond in JSON format:
[{"text": "message text", "category": "Career Journey"}, ...]`;

  try {
    const response = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const starters = parsed.starters || parsed.conversation_starters || parsed;
    if (Array.isArray(starters)) return starters.slice(0, 4);
    return [];
  } catch (error) {
    console.error("[AI] Conversation starters error:", error);
    return [];
  }
}

export async function generateMeetingPrep(
  mentor: UserContext,
  mentee: UserContext,
  meetingTitle: string,
  meetingFormat: string,
  conversationMessages: { sender: string; content: string }[]
): Promise<MeetingPrepSummary> {
  const recentMessages = conversationMessages.slice(-20);
  const messageHistory = recentMessages.length > 0
    ? recentMessages.map(m => `${m.sender}: ${m.content}`).join("\n")
    : "No messages exchanged yet.";

  const prompt = `You are preparing a meeting brief for a mentorship session.

Meeting: "${meetingTitle}" (${meetingFormat})

Mentor: ${mentor.firstName} ${mentor.lastName}, ${mentor.jobTitle || "Professional"} at ${mentor.company || "their company"}
- Industry: ${mentor.industry || "Not specified"}
- Expertise: ${mentor.expertise?.join(", ") || "Not specified"}

Mentee: ${mentee.firstName} ${mentee.lastName}
- School: ${mentee.school || "Not specified"}, ${mentee.program || ""}
- Goals: ${mentee.menteeGoals?.join(", ") || "Not specified"}
- Goal Statement: ${mentee.menteeGoalStatement || "Not specified"}
- Interests: ${mentee.interests?.join(", ") || "Not specified"}

Recent conversation:
${messageHistory}

Generate a meeting prep brief with:
1. A 2-3 sentence overview of the mentee's situation and what they're looking for
2. 3-4 highlights from their conversation so far (or note if they haven't chatted yet)
3. 4-5 suggested discussion topics that would be most productive
4. 3-4 specific questions each side could ask

Respond in JSON:
{"menteeOverview": "...", "conversationHighlights": ["..."], "suggestedTopics": ["..."], "questionsToAsk": ["..."]}`;

  try {
    const response = await openai.chat.completions.create({
      model: CAPABLE_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("[AI] Meeting prep error:", error);
    return {
      menteeOverview: "Unable to generate overview at this time.",
      conversationHighlights: [],
      suggestedTopics: [],
      questionsToAsk: [],
    };
  }
}

export async function scoreMatch(
  mentor: UserContext,
  mentee: UserContext
): Promise<MatchScore> {
  const prompt = `You are evaluating the compatibility between a mentor and mentee on a career mentorship platform.

Mentor:
- Company: ${mentor.company || "Not specified"}
- Role: ${mentor.jobTitle || "Not specified"}
- Industry: ${mentor.industry || "Not specified"}
- Expertise: ${mentor.expertise?.join(", ") || "Not specified"}
- Bio: ${mentor.bio || "Not specified"}

Mentee:
- Program: ${mentee.program || "Not specified"}
- Interests: ${mentee.interests?.join(", ") || "Not specified"}
- Target Companies: ${mentee.targetCompanies?.join(", ") || "Not specified"}
- Goals: ${mentee.menteeGoals?.join(", ") || "Not specified"}
- Goal Statement: ${mentee.menteeGoalStatement || "Not specified"}

Score the match from 0-100 based on:
- Career alignment (mentor's industry/role fits mentee's goals)
- Expertise relevance (mentor can help with mentee's specific needs)
- Company fit (mentor's company or industry matches target companies)

Respond in JSON:
{"score": 85, "rationale": "Brief explanation", "strengths": ["strength 1", "strength 2"]}`;

  try {
    const response = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("[AI] Match scoring error:", error);
    return { score: 50, rationale: "Unable to score at this time.", strengths: [] };
  }
}

export async function generateCareerInsights(
  mentors: UserContext[]
): Promise<CareerInsight[]> {
  const mentorSummaries = mentors.map(m =>
    `${m.jobTitle || "Unknown role"} at ${m.company || "Unknown company"} (${m.industry || "Unknown industry"}), expertise: ${m.expertise?.join(", ") || "N/A"}`
  ).join("\n");

  const prompt = `You are analyzing mentor data from a career mentorship platform to surface career path patterns and insights for college students.

Mentor network (${mentors.length} mentors):
${mentorSummaries}

Identify 4-5 interesting career patterns or insights from this data. Focus on:
- Common career transitions or paths
- In-demand skills across industries
- Trends in where professionals are working
- Advice themes that emerge from the expertise areas

Respond in JSON:
{"insights": [{"pattern": "Short title", "description": "2-3 sentence insight", "relevantMentorCount": 3}, ...]}`;

  try {
    const response = await openai.chat.completions.create({
      model: CAPABLE_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.insights || [];
  } catch (error) {
    console.error("[AI] Career insights error:", error);
    return [];
  }
}

export async function refineGoalStatement(
  currentStatement: string,
  selectedGoals: string[],
  menteeContext: UserContext
): Promise<RefinedGoal> {
  const prompt = `You are a career coach helping a college student refine their mentorship goals into something specific and actionable.

Student profile:
- School: ${menteeContext.school || "Not specified"}
- Program: ${menteeContext.program || "Not specified"}
- Interests: ${menteeContext.interests?.join(", ") || "Not specified"}
- Target Companies: ${menteeContext.targetCompanies?.join(", ") || "Not specified"}

Selected goal areas: ${selectedGoals.join(", ") || "None selected"}
Current goal statement: "${currentStatement}"

Help them refine this into a more specific, actionable goal statement that a mentor can easily respond to. Keep the student's voice and intent but make it clearer and more focused. Also provide 3 concrete action items they could discuss with a mentor.

Respond in JSON:
{"refinedStatement": "The improved goal statement (max 200 chars)", "actionItems": ["action 1", "action 2", "action 3"], "feedback": "Brief encouraging note about what was good and what was improved"}`;

  try {
    const response = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("[AI] Goal refinement error:", error);
    return {
      refinedStatement: currentStatement,
      actionItems: [],
      feedback: "Unable to refine at this time. Please try again later.",
    };
  }
}
