/**
 * @fileoverview Terms of Service page route (`/terms`).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import Container from "@/components/ui/container";
import { IconScale, IconChevronLeft } from "@tabler/icons-react";

/**
 * Route for the application terms of service.
 */
export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

/**
 * Static page component displaying the terms of service.
 *
 * @returns Terms of service view element
 */
function TermsPage() {
  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <Container className="max-w-3xl py-12 px-6 text-foreground/90">
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
            <IconScale size={28} />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Effective as of March 22, 2026. Please read these terms carefully.
          </p>
        </header>

        <div className="prose prose-olive dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              1. Your Acceptance
            </h2>
            <p className="leading-relaxed">
              By using SysDesign, you agree to these legal terms. If you do not
              agree to these terms, you must not use our software or platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              2. Usage Rights
            </h2>
            <p className="leading-relaxed">
              We grant you a non-exclusive, revocable license to use our
              platform to design, visualize, and export diagram data. All
              diagrams created are your property.
            </p>
            <p className="mt-4">
              We reserve the right to modify or terminate the service for any
              reason, without notice, at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              3. Prohibited Conduct
            </h2>
            <p className="leading-relaxed">
              Users agree not to utilize the platform for any unlawful purpose
              or to distribute malicious content. Unauthorized attempts to
              exploit the platform's authentication and data storage layers are
              strictly forbidden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              4. Disclaimers
            </h2>
            <p className="leading-relaxed">
              SysDesign is provided "as is" and "as available". We do not
              warrant that the service will be uninterrupted or error-free. We
              are not responsible for any data loss, and users are encouraged to
              regularly export their work.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
              5. Third-Party Links & Tools
            </h2>
            <p className="leading-relaxed">
              Our platform uses third-party services including, but not limited
              to, Supabase and Google. Your use of these services is also
              governed by their respective terms and privacy policies.
            </p>
          </section>

          <footer className="pt-12 border-t mt-16 pb-8">
            <p className="text-sm text-muted-foreground">
              For any legal inquiries, please reach out to us at
              info@obare27.com
            </p>
          </footer>
        </div>
      </Container>
    </div>
  );
}
