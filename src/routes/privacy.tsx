/**
 * @fileoverview Privacy policy document page (`/privacy`).
 */

import { Link, createFileRoute } from "@tanstack/react-router";
import Container from "@/components/ui/container";
import { IconChevronLeft, IconShieldCheck } from "@tabler/icons-react";

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
      <Container className="max-w-2xl py-10 px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <IconChevronLeft
            size={14}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Editor
        </Link>

        <header className="mb-8 border-b border-border/60 pb-6">
          <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-xs">
            <IconShieldCheck size={20} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground">
            Effective March 2026. Your privacy and diagram data sovereignty are fundamental.
          </p>
        </header>

        <div className="space-y-6 text-xs text-foreground/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p>
              We collect minimal information necessary to deliver system diagramming capabilities:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Authentication Data:</strong> When signing in with Google OAuth, we receive your account identifier, email address, and profile picture.
              </li>
              <li>
                <strong className="text-foreground">Diagram Data:</strong> Architecture components, nodes, edges, C4 hierarchies, and notes are saved to your project space.
              </li>
              <li>
                <strong className="text-foreground">Local AI Keys:</strong> API keys for OpenAI, Anthropic, or Google Gemini are stored locally on your device in browser localStorage and never transmitted to our servers.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              2. How Your Data Is Used
            </h2>
            <p>
              Your data is exclusively utilized to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Persist and sync your architecture diagrams across devices.</li>
              <li>Authenticate your workspace access securely.</li>
              <li>Export diagrams to PNG, SVG, Mermaid, Terraform, and Structurizr formats.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              3. Data Storage & Security
            </h2>
            <p>
              We utilize Supabase PostgreSQL with Row Level Security (RLS) for cloud persistence. You may also operate without signing in to keep all diagram assets in local browser memory.
            </p>
          </section>

          <footer className="pt-8 border-t border-border/50 text-muted-foreground">
            <p>
              For inquiries regarding data protection, contact: <span className="font-mono text-foreground">info@obare27.com</span>
            </p>
          </footer>
        </div>
      </Container>
    </div>
  );
}
