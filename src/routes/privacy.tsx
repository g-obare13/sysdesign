/**
 * @fileoverview Privacy policy document page (`/privacy`).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import Container from "@/components/ui/container";
import { IconShieldCheck, IconChevronLeft } from "@tabler/icons-react";

/**
 * Route for the application privacy policy.
 */
export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

/**
 * Static page component displaying the privacy policy.
 *
 * @returns Privacy policy page element
 */
function PrivacyPage() {
  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <Container className="max-w-3xl py-12 px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <IconChevronLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Editor
        </Link>

        <header className="mb-12">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <IconShieldCheck size={28} />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated March 22, 2026. Your privacy is our priority.
          </p>
        </header>

        <div className="prose prose-olive dark:prose-invert max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              1. Information We Collect
            </h2>
            <p className="leading-relaxed">
              We collect information to provide a better experience to our
              users. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Account Information:</strong> When you sign in with
                Google, we receive your name, email address, and profile
                picture.
              </li>
              <li>
                <strong>Project Data:</strong> We store the diagrams and
                architecture layouts you create on our platform.
              </li>
              <li>
                <strong>Usage Data:</strong> We collect anonymous analytics to
                understand how the platform is used and where we can improve.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              2. How We Use Your Data
            </h2>
            <p className="leading-relaxed">
              Your data is used specifically for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                To save and sync your architecture diagrams across devices.
              </li>
              <li>
                To personalize your experience and manage your user account.
              </li>
              <li>
                To improve our tools and add new features based on popular usage
                patterns.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              3. Data Storage & Security
            </h2>
            <p className="leading-relaxed">
              We use Supabase (a secure PostgreSQL-based platform) for data
              persistence. While we take industry-standard measures to protect
              your information, no service is 100% secure. You are also
              encouraged to use local storage mode if you prefer not to store
              data online.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              4. Third-Party Services
            </h2>
            <p className="leading-relaxed">
              We use the following third-party sub-processors:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Supabase:</strong> For authentication and database
                hosting.
              </li>
              <li>
                <strong>Google OAuth:</strong> To allow seamless social login.
              </li>
              <li>
                <strong>Vercel:</strong> For hosting and infrastructure
                services.
              </li>
            </ul>
          </section>

          <footer className="pt-12 border-t mt-16 pb-8">
            <p className="text-sm text-muted-foreground">
              If you have any questions about this policy, please contact us at
              info@obare27.com
            </p>
          </footer>
        </div>
      </Container>
    </div>
  );
}
