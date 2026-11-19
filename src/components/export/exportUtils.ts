/**
 * @fileoverview Diagram export utilities generating PNG, SVG, Mermaid flowchart, Terraform HCL, and Structurizr DSL.
 */

import { toPng, toSvg } from "html-to-image";
import type { DiagramEdge, DiagramNode } from "@/types/diagram";

function getThemeBackground(): string {
  if (typeof window === "undefined") return "#ffffff";
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  return bg || "#ffffff";
}

function shouldIncludeInImage(node: HTMLElement): boolean {
  if (!(node instanceof HTMLElement)) return true;
  const cls = node.classList;
  if (
    cls.contains("react-flow__minimap") ||
    cls.contains("react-flow__controls") ||
    cls.contains("react-flow__panel") ||
    cls.contains("react-flow__attribution")
  ) {
    return false;
  }
  return true;
}

/**
 * Exports the current diagram container as a high-resolution PNG image.
 */
export async function exportPng(): Promise<void> {
  try {
    const el = document.getElementById("sys-diagram");
    if (!el) {
      console.error("Export target not found");
      return;
    }
    const url = await toPng(el, {
      backgroundColor: getThemeBackground(),
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: true,
      filter: shouldIncludeInImage,
    });

    trigger(url, "diagram.png");
  } catch (err) {
    console.error("PNG Export failed:", err);
  }
}

/**
 * Exports the current diagram container as an SVG file.
 */
export async function exportSvgFile(): Promise<void> {
  try {
    const el = document.getElementById("sys-diagram");
    if (!el) {
      console.error("Export target not found");
      return;
    }
    const url = await toSvg(el, {
      backgroundColor: getThemeBackground(),
      skipFonts: true,
      filter: shouldIncludeInImage,
    });

    trigger(url, "diagram.svg");
  } catch (err) {
    console.error("SVG Export failed:", err);
  }
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[0-9]/.test(cleaned) ? `n_${cleaned}` : cleaned || "node";
}

function escapeQuote(raw: unknown): string {
  return String(raw ?? "").replace(/"/g, "'").trim();
}

function getEdgeLabel(edge: DiagramEdge): string {
  if (typeof edge.label === "string" && edge.label.trim()) {
    return edge.label.trim();
  }
  const dataLabel = edge.data?.label;
  return typeof dataLabel === "string" ? dataLabel.trim() : "";
}

/**
 * Generates and downloads a Mermaid.js flowchart representation of the diagram.
 * Supports group subgraphs and edge labels.
 *
 * @param nodes - Current collection of diagram nodes
 * @param edges - Current collection of diagram edges
 */
export function exportMermaid(
  nodes: Array<DiagramNode>,
  edges: Array<DiagramEdge>,
): void {
  const lines: Array<string> = ["flowchart TD"];
  const groups = nodes.filter((n) => n.type === "group");
  const groupIds = new Set(groups.map((g) => g.id));

  // Render groups as subgraphs containing their child nodes
  for (const group of groups) {
    const gid = sanitizeId(group.id);
    const glabel = escapeQuote(group.data.label || "Group");
    const children = nodes.filter((n) => n.parentId === group.id);
    lines.push(`  subgraph ${gid}["${glabel}"]`);
    for (const child of children) {
      const cid = sanitizeId(child.id);
      const clabel = escapeQuote(child.data.label);
      lines.push(`    ${cid}["${clabel}"]`);
    }
    lines.push("  end");
  }

  // Render top-level non-group nodes
  for (const n of nodes) {
    if (n.type === "group") continue;
    if (n.parentId && groupIds.has(n.parentId)) continue;
    const id = sanitizeId(n.id);
    const label = escapeQuote(n.data.label);
    lines.push(`  ${id}["${label}"]`);
  }

  // Render edges with optional labels
  for (const e of edges) {
    const src = sanitizeId(e.source);
    const tgt = sanitizeId(e.target);
    const label = escapeQuote(getEdgeLabel(e));
    if (label) {
      lines.push(`  ${src} -->|"${label}"| ${tgt}`);
    } else {
      lines.push(`  ${src} --> ${tgt}`);
    }
  }

  blob(lines.join("\n"), "diagram.mmd");
}

/**
 * Generates a Terraform configuration (HCL) boilerplate based on the diagram nodes.
 * Maps recognized architecture and cloud registry subtypes to AWS resource blocks.
 *
 * @param nodes - Current collection of diagram nodes
 * @param edges - Current collection of diagram edges (used for commentary only)
 */
export function exportTerraform(
  nodes: Array<DiagramNode>,
  edges: Array<DiagramEdge>,
): void {
  const usedSlugs = new Map<string, number>();
  const uniqueSlug = (n: DiagramNode): string => {
    const base = slug(n) || "resource";
    const count = usedSlugs.get(base) ?? 0;
    usedSlugs.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  };

  type Gen = (n: DiagramNode, resName: string) => string;

  const apiGateway: Gen = (n, res) =>
    tfBlock("aws_api_gateway_rest_api", res, n, `name = "${escapeQuote(n.data.label)}"`);
  const ec2Instance: Gen = (n, res) =>
    tfBlock("aws_instance", res, n, `ami = "ami-0c55b159cbfafe1f0"\n  instance_type = "t3.micro"`);
  const s3Bucket: Gen = (n, res) =>
    tfBlock("aws_s3_bucket", res, n, `bucket = "${res.replace(/_/g, "-")}-bucket"`);
  const lambdaFn: Gen = (n, res) =>
    tfBlock(
      "aws_lambda_function",
      res,
      n,
      `function_name = "${res}"\n  runtime = "nodejs20.x"\n  handler = "index.handler"\n  role = aws_iam_role.lambda_role.arn\n  filename = "${res}.zip"`,
    );
  const postgresDb: Gen = (n, res) =>
    tfBlock(
      "aws_db_instance",
      res,
      n,
      `engine = "postgres"\n  engine_version = "15"\n  instance_class = "db.t3.micro"\n  username = "admin"\n  password = var.db_password\n  skip_final_snapshot = true`,
    );
  const mysqlDb: Gen = (n, res) =>
    tfBlock(
      "aws_db_instance",
      res,
      n,
      `engine = "mysql"\n  engine_version = "8.0"\n  instance_class = "db.t3.micro"\n  username = "admin"\n  password = var.db_password\n  skip_final_snapshot = true`,
    );
  const redisCluster: Gen = (n, res) =>
    tfBlock(
      "aws_elasticache_cluster",
      res,
      n,
      `engine = "redis"\n  node_type = "cache.t3.micro"\n  num_cache_nodes = 1\n  parameter_group_name = "default.redis7"`,
    );
  const dynamoTable: Gen = (n, res) =>
    tfBlock(
      "aws_dynamodb_table",
      res,
      n,
      `name = "${res}"\n  billing_mode = "PAY_PER_REQUEST"\n  hash_key = "id"\n  attribute {\n    name = "id"\n    type = "S"\n  }`,
    );
  const sqsQueue: Gen = (n, res) =>
    tfBlock("aws_sqs_queue", res, n, `name = "${res.replace(/_/g, "-")}-queue"`);
  const snsTopic: Gen = (n, res) =>
    tfBlock("aws_sns_topic", res, n, `name = "${res.replace(/_/g, "-")}-topic"`);
  const mskCluster: Gen = (n, res) =>
    tfBlock(
      "aws_msk_cluster",
      res,
      n,
      `cluster_name = "${res.replace(/_/g, "-")}"\n  kafka_version = "3.6.0"\n  number_of_broker_nodes = 2`,
    );
  const ecsService: Gen = (n, res) =>
    tfBlock(
      "aws_ecs_service",
      res,
      n,
      `name = "${res.replace(/_/g, "-")}"\n  launch_type = "FARGATE"\n  desired_count = 2`,
    );
  const alb: Gen = (n, res) =>
    tfBlock(
      "aws_lb",
      res,
      n,
      `name = "${res.replace(/_/g, "-")}"\n  load_balancer_type = "application"`,
    );
  const cloudfront: Gen = (n, res) =>
    tfBlock(
      "aws_cloudfront_distribution",
      res,
      n,
      `enabled = true\n  comment = "${escapeQuote(n.data.label)}"`,
    );
  const wafAcl: Gen = (n, res) =>
    tfBlock(
      "aws_wafv2_web_acl",
      res,
      n,
      `name = "${res.replace(/_/g, "-")}"\n  scope = "REGIONAL"`,
    );
  const openSearch: Gen = (n, res) =>
    tfBlock(
      "aws_opensearch_domain",
      res,
      n,
      `domain_name = "${res.replace(/_/g, "-")}"\n  engine_version = "OpenSearch_2.11"`,
    );
  const cognitoPool: Gen = (n, res) =>
    tfBlock("aws_cognito_user_pool", res, n, `name = "${escapeQuote(n.data.label)}"`);

  const map: Record<string, Gen> = {
    // Legacy short subtypes
    "api-gateway": apiGateway,
    ec2: ec2Instance,
    s3: s3Bucket,
    lambda: lambdaFn,
    postgres: postgresDb,
    redis: redisCluster,
    // Current registry subtypes
    "ms-api-gateway": apiGateway,
    "aws-api-gateway": apiGateway,
    "aws-ec2": ec2Instance,
    "aws-s3": s3Bucket,
    "aws-lambda": lambdaFn,
    "aws-ecs": ecsService,
    "aws-fargate": ecsService,
    "ms-service": ecsService,
    "ms-worker": ecsService,
    "db-postgres": postgresDb,
    "aws-rds": postgresDb,
    "db-mysql": mysqlDb,
    "db-redis": redisCluster,
    "ms-cache": redisCluster,
    "aws-elasticache": redisCluster,
    "aws-dynamodb": dynamoTable,
    "aws-sqs": sqsQueue,
    "aws-sns": snsTopic,
    "db-kafka": mskCluster,
    "ms-event-bus": mskCluster,
    "ms-message-broker": mskCluster,
    "aws-msk": mskCluster,
    "aws-alb": alb,
    "ms-load-balancer": alb,
    "aws-cloudfront": cloudfront,
    "fe-cdn": cloudfront,
    "aws-waf": wafAcl,
    "ms-waf": wafAcl,
    "db-elasticsearch": openSearch,
    "aws-opensearch": openSearch,
    "aws-cognito": cognitoPool,
    "sec-oauth": cognitoPool,
  };

  const header = [
    "# Generated by SysDesign Visualizer: review before applying\n",
    'terraform {\n  required_providers {\n    aws = { source = "hashicorp/aws", version = "~> 5.0" }\n  }\n}\n',
    'provider "aws" { region = "us-east-1" }\n',
  ];

  const resources = nodes.map((n) => {
    if (n.type === "group") {
      return `# Boundary: ${escapeQuote(n.data.label || "Group")}`;
    }
    const subtype = (n.data.subtype as string) || "";
    const gen = map[subtype];
    if (gen) {
      return gen(n, uniqueSlug(n));
    }
    return `# ${escapeQuote(n.data.label)} (${subtype || "custom"}): manual resource needed`;
  });

  const deps = edges.length
    ? [
        "\n# Connections",
        ...edges.map((e) => {
          const src = nodes.find((n) => n.id === e.source)?.data.label ?? e.source;
          const tgt = nodes.find((n) => n.id === e.target)?.data.label ?? e.target;
          const label = getEdgeLabel(e);
          return label
            ? `# ${src as string} --> ${tgt as string} (${label})`
            : `# ${src as string} --> ${tgt as string}`;
        }),
      ]
    : [];

  blob([...header, ...resources, ...deps].join("\n"), "main.tf");
}

/**
 * Generates and downloads a Structurizr DSL workspace representation.
 * Maps C4 categories and subtypes to their respective DSL elements (person, softwareSystem, container, component).
 *
 * @param nodes - Collection of diagram nodes
 * @param edges - Collection of diagram edges
 */
export function exportStructurizr(
  nodes: Array<DiagramNode>,
  edges: Array<DiagramEdge>,
): void {
  const rootNodes = nodes.filter((n) => !n.parentId);
  const modelLines: Array<string> = [];
  let primarySystemId: string | null = null;
  let primaryContainerId: string | null = null;

  const renderNode = (n: DiagramNode, depth: number) => {
    const indent = "    ".repeat(depth);
    const subtype = (n.data.subtype as string) || "";
    const label = escapeQuote(n.data.label || "Untitled");
    const desc = escapeQuote(n.data.description || "");
    const id = sanitizeId(n.id);
    const children = nodes.filter((child) => child.parentId === n.id);

    let keyword = "container";
    if (subtype === "c4-person" || subtype === "fe-user" || subtype === "fe-admin") {
      keyword = "person";
    } else if (
      subtype === "c4-system" ||
      subtype === "c4-external-system" ||
      (n.type === "group" && depth === 2)
    ) {
      keyword = "softwareSystem";
    } else if (
      subtype.includes("component") ||
      ["c4-controller", "c4-service", "c4-repository", "c4-gateway"].includes(subtype)
    ) {
      keyword = "component";
    } else if (n.type === "group") {
      keyword = "container";
    } else if (depth === 2) {
      // Top-level non-person elements in Structurizr must be softwareSystem
      keyword = "softwareSystem";
    }

    if (keyword === "softwareSystem" && !primarySystemId) {
      primarySystemId = id;
    }
    if (keyword === "container" && !primaryContainerId) {
      primaryContainerId = id;
    }

    const tech = escapeQuote(n.data.technology || "");
    const techArg = tech && keyword !== "person" && keyword !== "softwareSystem"
      ? ` "${tech}"`
      : "";

    if (children.length > 0) {
      modelLines.push(`${indent}${id} = ${keyword} "${label}" "${desc}"${techArg} {`);
      children.forEach((child) => renderNode(child, depth + 1));
      modelLines.push(`${indent}}`);
    } else {
      modelLines.push(`${indent}${id} = ${keyword} "${label}" "${desc}"${techArg}`);
    }
  };

  rootNodes.forEach((rn) => renderNode(rn, 2));

  const relationshipLines = edges.map((e) => {
    const src = sanitizeId(e.source);
    const tgt = sanitizeId(e.target);
    const label = escapeQuote(getEdgeLabel(e) || "Uses");
    return `        ${src} -> ${tgt} "${label}"`;
  });

  const viewLines: Array<string> = [
    '        systemLandscape "Landscape" {',
    "            include *",
    "            autolayout lr",
    "        }",
  ];

  if (primarySystemId) {
    viewLines.push(
      `        systemContext ${primarySystemId} "SystemContext" {`,
      "            include *",
      "            autolayout lr",
      "        }",
      `        container ${primarySystemId} "Containers" {`,
      "            include *",
      "            autolayout lr",
      "        }",
    );
  }

  if (primaryContainerId) {
    viewLines.push(
      `        component ${primaryContainerId} "Components" {`,
      "            include *",
      "            autolayout lr",
      "        }",
    );
  }

  const dsl = [
    "workspace {",
    "    model {",
    ...modelLines,
    "",
    ...relationshipLines,
    "    }",
    "    views {",
    ...viewLines,
    "        theme default",
    "    }",
    "}",
  ].join("\n");

  blob(dsl, "workspace.dsl");
}

function slug(n: DiagramNode): string {
  return (n.data.label as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function tfBlock(
  resource: string,
  resName: string,
  n: DiagramNode,
  body: string,
): string {
  return `resource "${resource}" "${resName}" {\n  ${body}\n  tags = { Name = "${escapeQuote(n.data.label)}" }\n}\n`;
}

function trigger(url: string, filename: string): void {
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function blob(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  trigger(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
