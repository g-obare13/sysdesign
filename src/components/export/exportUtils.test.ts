import { describe, it, expect, beforeEach, vi } from "vitest";
import { exportMermaid, exportTerraform, exportStructurizr } from "./exportUtils";
import type { DiagramNode, DiagramEdge } from "../../types/diagram";

function node(id: string, label: string, subtype = "service"): DiagramNode {
  return {
    id,
    type: "diagram",
    position: { x: 0, y: 0 },
    data: {
      label,
      category: "microservice",
      subtype,
      icon: "IconBox",
      description: "",
    },
  };
}

function edge(source: string, target: string): DiagramEdge {
  return { id: `e-${source}-${target}`, source, target };
}

/** Capture whatever content gets pushed into a download Blob. */
let captured = "";

describe("exportUtils", () => {
  beforeEach(() => {
    captured = "";
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn((blob: Blob) => {
        blob.text().then((t) => {
          captured = t;
        });
        return "blob:mock";
      }),
      revokeObjectURL: vi.fn(),
    });
  });

  async function flush() {
    await new Promise((r) => setTimeout(r, 10));
  }

  it("generates a Mermaid flowchart", async () => {
    exportMermaid(
      [node("a", "Service A"), node("b", "Service B")],
      [edge("a", "b")],
    );
    await flush();
    expect(captured).toContain("flowchart TD");
    expect(captured).toContain('a["Service A"]');
    expect(captured).toContain("a --> b");
  });

  it("maps known subtypes to Terraform resources", async () => {
    exportTerraform([node("assets", "Assets", "s3")], []);
    await flush();
    expect(captured).toContain('resource "aws_s3_bucket" "assets"');
    expect(captured).toContain('bucket = "assets-bucket"');
  });

  it("leaves a comment for unmapped subtypes", async () => {
    exportTerraform([node("custom", "Custom Thing", "totally-custom")], []);
    await flush();
    expect(captured).toContain("manual resource needed");
  });

  it("generates a Structurizr DSL workspace", async () => {
    exportStructurizr(
      [node("person", "User", "c4-person"), node("sys", "Web App", "c4-system")],
      [edge("person", "sys")],
    );
    await flush();
    expect(captured).toContain("workspace {");
    expect(captured).toContain('person = person "User"');
    expect(captured).toContain("person -> sys");
  });
});
