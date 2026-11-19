/**
 * @fileoverview Unit tests for diagram export formats (Mermaid, Terraform, Structurizr DSL).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportMermaid, exportStructurizr, exportTerraform } from "./exportUtils";
import type { DiagramEdge, DiagramNode } from "@/types/diagram";

function node(
  id: string,
  label: string,
  subtype = "service",
  parentId?: string,
): DiagramNode {
  return {
    id,
    type: "diagram",
    parentId,
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

function groupNode(id: string, label: string): DiagramNode {
  return {
    id,
    type: "group",
    position: { x: 0, y: 0 },
    data: {
      label,
      category: "flow",
    },
  };
}

function edge(source: string, target: string, label?: string): DiagramEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    label,
    data: label ? { label } : undefined,
  };
}

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

  it("generates a Mermaid flowchart with subgraphs and edge labels", async () => {
    exportMermaid(
      [
        groupNode("grp-core", "Core Services"),
        node("a", "Service A", "ms-service", "grp-core"),
        node("b", "Service B", "ms-service"),
      ],
      [edge("a", "b", "HTTPS / REST")],
    );
    await flush();
    expect(captured).toContain("flowchart TD");
    expect(captured).toContain('subgraph grp_core["Core Services"]');
    expect(captured).toContain('a["Service A"]');
    expect(captured).toContain('b["Service B"]');
    expect(captured).toContain('a -->|"HTTPS / REST"| b');
  });

  it("maps legacy and current registry subtypes to Terraform resources", async () => {
    exportTerraform(
      [
        groupNode("grp-data", "Data Tier"),
        node("assets", "Assets", "s3"),
        node("events", "Event Bus", "db-kafka"),
        node("gateway", "Main Gateway", "ms-api-gateway"),
      ],
      [edge("gateway", "events", "Produce")],
    );
    await flush();
    expect(captured).toContain("# Boundary: Data Tier");
    expect(captured).toContain('resource "aws_s3_bucket" "assets"');
    expect(captured).toContain('bucket = "assets-bucket"');
    expect(captured).toContain('resource "aws_msk_cluster" "event_bus"');
    expect(captured).toContain('resource "aws_api_gateway_rest_api" "main_gateway"');
    expect(captured).toContain("# Main Gateway --> Event Bus (Produce)");
  });

  it("leaves a comment for unmapped subtypes", async () => {
    exportTerraform([node("custom", "Custom Thing", "totally-custom")], []);
    await flush();
    expect(captured).toContain("manual resource needed");
  });

  it("generates a valid Structurizr DSL workspace with groups and real view targets", async () => {
    exportStructurizr(
      [
        node("person", "User", "c4-person"),
        groupNode("sys", "Banking System"),
        node("api", "API Container", "c4-container", "sys"),
      ],
      [edge("person", "api", "HTTPS")],
    );
    await flush();
    expect(captured).toContain("workspace {");
    expect(captured).toContain('person = person "User"');
    expect(captured).toContain('sys = softwareSystem "Banking System"');
    expect(captured).toContain('api = container "API Container"');
    expect(captured).toContain('person -> api "HTTPS"');
    expect(captured).toContain('systemContext sys "SystemContext"');
    expect(captured).toContain('container sys "Containers"');
    expect(captured).toContain('component api "Components"');
    expect(captured).not.toContain("systemContext nodes");
  });
});
