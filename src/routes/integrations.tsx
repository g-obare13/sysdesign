/**
 * @fileoverview Route for the Integrations feature (`/integrations`).
 */

import { createFileRoute } from "@tanstack/react-router";
import { IconPuzzle } from "@tabler/icons-react";
import ComingSoon from "@/components/layout/ComingSoon";
import Container from "@/components/ui/container";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
});

/**
 * Integrations page placeholder component.
 *
 * @returns Integrations view element
 */
function IntegrationsPage() {
  return (
    <Container as="main" className="flex-1 flex flex-col w-full">
      <ComingSoon
        title="Integrations Hub"
        description="Connect SysDesign to your existing infrastructure stack. GitHub, Supabase, AWS, Kubernetes and more - currently being optimized."
        icon={IconPuzzle}
      />
    </Container>
  );
}
