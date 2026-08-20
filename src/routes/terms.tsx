/**
 * @fileoverview Terms of Service page route (`/terms`).
 */

import { Link, createFileRoute } from "@tanstack/react-router";
import Container from "@/components/ui/container";
import { IconChevronLeft, IconScale } from "@tabler/icons-react";

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
            <IconScale size={20} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1">
            Terms of Service
          </h1>
          <p className="text-xs text-muted-foreground">
            Effective March 2026. Please review these terms of use.
          </p>
        </header>

        <div className="space-y-6 text-xs text-foreground/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing SysDesign, you agree to these terms. If you disagree with any portion, you should discontinue use of the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              2. Intellectual Property & Ownership
            </h2>
            <p>
              You retain full ownership and intellectual property rights over all architectural diagrams, data flows, and exported code (Mermaid, Terraform, Structurizr DSL) created using SysDesign.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              3. Service Availability
            </h2>
            <p>
              SysDesign is provided on an "as is" and "as available" basis. While we strive for continuous reliability, we advise regular local exports of mission-critical architecture specifications.
            </p>
          </section>

          <footer className="pt-8 border-t border-border/50 text-muted-foreground">
            <p>
              For legal questions, please reach out to <span className="font-mono text-foreground">info@obare27.com</span>
            </p>
          </footer>
        </div>
      </Container>
    </div>
  );
}
