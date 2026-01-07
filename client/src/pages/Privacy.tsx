import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={false} />
      
      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
          
          <h2>Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, 
            update your profile, RSVP to events, or communicate with other users through our platform.
          </p>
          
          <h2>How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, 
            including matching you with mentors based on shared events and interests.
          </p>
          
          <h2>Information Sharing</h2>
          <p>
            We do not sell your personal information. We share your profile information only 
            with other users you connect with and as necessary to provide our services.
          </p>
          
          <h2>Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information 
            from unauthorized access, alteration, or destruction.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at privacy@mentorfy.com.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
