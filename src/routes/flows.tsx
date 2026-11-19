/**
 * @fileoverview Route for the Flows feature (`/flows`).
 */

import { createFileRoute } from "@tanstack/react-router";
import { IconHierarchy } from "@tabler/icons-react";
import ComingSoon from "@/components/layout/ComingSoon";
import Container from "@/components/ui/container";

export const Route = createFileRoute("/flows")({
  component: FlowsPage,
});

/**
 * Flows page placeholder component.
 *
 * @returns Flows view element
 */
function FlowsPage() {
  return (
    <Container as="main" className="flex-1 flex flex-col w-full">
      <ComingSoon
        title="Dynamic Flow Architect"
        description="Sequence diagrams, data flows, event storming, CI/CD pipelines and more - advanced flow types are currently in development."
        icon={IconHierarchy}
      />
    </Container>
  );
}
