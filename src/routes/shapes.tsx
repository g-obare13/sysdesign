/**
 * @fileoverview Route for the Shapes library feature (`/shapes`).
 */

import { createFileRoute } from "@tanstack/react-router";
import { IconShape } from "@tabler/icons-react";
import ComingSoon from "@/components/layout/ComingSoon";
import Container from "@/components/ui/container";

export const Route = createFileRoute("/shapes")({
  component: ShapesPage,
});

/**
 * Shapes library page placeholder component.
 *
 * @returns Shapes view element
 */
function ShapesPage() {
  return (
    <Container as="main" className="flex-1 flex flex-col w-full">
      <ComingSoon
        title="Infinite Geometry Library"
        description="Process, decision, swimlane, queue shapes and more - the full technical shape library is currently being built."
        icon={IconShape}
      />
    </Container>
  );
}
