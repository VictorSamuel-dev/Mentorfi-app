import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: February 2026</p>
          
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing or using Mentorfy, you agree to be bound by these Terms of Service 
            and all applicable laws and regulations.
          </p>
          
          <h2>User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials 
            and for all activities that occur under your account.
          </p>
          
          <h2>Acceptable Use</h2>
          <p>
            You agree to use Mentorfy only for lawful purposes and in accordance with these terms. 
            You will not use the platform to harass, spam, or mislead other users.
          </p>
          
          <h2>Content Guidelines</h2>
          <p>
            Users are responsible for the content they share. We reserve the right to remove 
            content that violates our community guidelines.
          </p>
          
          <h2>Limitation of Liability</h2>
          <p>
            Mentorfy is provided "as is" without warranties of any kind. We are not liable for 
            any damages arising from your use of the platform.
          </p>
          
          <h2>Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after 
            changes constitutes acceptance of the new terms.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
