import { SHOW_PLACEHOLDERS } from "@shared/featureFlags";

const placeholderStats = [
  { value: "500+", label: "Active Mentors" },
  { value: "2,500+", label: "Students Connected" },
  { value: "100+", label: "Professional Touchpoints" },
  { value: "85%", label: "Match Success Rate" },
];

const betaStats = [
  { value: "Growing", label: "Mentor Network" },
  { value: "Beta", label: "Early Access" },
  { value: "1:1", label: "Personalized Matching" },
  { value: "Free", label: "To Get Started" },
];

const stats = SHOW_PLACEHOLDERS ? placeholderStats : betaStats;

export function StatsSection() {
  return (
    <section className="py-16 px-6 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center"
              data-testid={`stat-${index}`}
            >
              <div className="text-4xl sm:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-primary-foreground/80 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
