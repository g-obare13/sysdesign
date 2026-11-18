/**
 * @fileoverview Component registry search and fuzzy resolver for AI diagram generation.
 * Grounds AI-generated nodes against the real SysDesign AWS/GCP/Azure/Generic/C4 registry.
 */

import { getRegistryItems } from "@/store/registry.store";
import type { NodeCategory, NodeTemplate } from "@/types/diagram";

const C4_TEMPLATES: Array<NodeTemplate> = [
  {
    subtype: "c4-person",
    label: "Person",
    category: "c4",
    icon: "IconUser",
    description: "End user, customer, or actor",
  },
  {
    subtype: "c4-system",
    label: "Software System",
    category: "c4",
    icon: "IconBox",
    description: "Top-level software system",
  },
  {
    subtype: "c4-container",
    label: "Container",
    category: "c4",
    icon: "IconStack2",
    description: "Deployable app, microservice, API, or database",
  },
  {
    subtype: "c4-component",
    label: "Component",
    category: "c4",
    icon: "IconPuzzle",
    description: "Internal module, controller, or service inside a container",
  },
  {
    subtype: "c4-external-system",
    label: "External System",
    category: "c4",
    icon: "IconWorld",
    description: "Third-party or external software system",
  },
];

function getAllTemplates(customPool?: Array<NodeTemplate>): Array<NodeTemplate> {
  const base = customPool ?? getRegistryItems();
  return [...base, ...C4_TEMPLATES];
}

/**
 * Friendly aliases mapping common short names models emit to exact registry subtypes.
 */
const SUBTYPE_ALIASES: Record<string, string> = {
  "api-gateway": "ms-api-gateway",
  gateway: "ms-api-gateway",
  service: "ms-service",
  microservice: "ms-service",
  worker: "ms-worker",
  "load-balancer": "ms-load-balancer",
  alb: "aws-elb",
  elb: "aws-elb",
  "message-queue": "ms-message-broker",
  queue: "ms-message-broker",
  kafka: "db-kafka",
  rabbitmq: "db-rabbitmq",
  sqs: "aws-sqs",
  sns: "aws-sns",
  "event-bus": "ms-event-bus",
  auth: "ms-auth-service",
  "auth-service": "ms-auth-service",
  oauth: "sec-oauth",
  postgres: "db-postgres",
  postgresql: "db-postgres",
  mysql: "db-mysql",
  redis: "db-redis",
  cache: "ms-cache",
  mongo: "db-mongo",
  mongodb: "db-mongo",
  elasticsearch: "db-elasticsearch",
  snowflake: "db-snowflake",
  supabase: "db-supabase",
  "web-app": "fe-webapp",
  webapp: "fe-webapp",
  web: "fe-webapp",
  mobile: "fe-mobile-cross",
  "mobile-app": "fe-mobile-cross",
  user: "fe-user",
  client: "fe-browser",
  browser: "fe-browser",
  bff: "fe-bff",
  cdn: "fe-cdn",
  cloudfront: "aws-cloudfront",
  s3: "aws-s3",
  ec2: "aws-ec2",
  lambda: "aws-lambda",
  rds: "aws-rds",
  dynamodb: "aws-dynamodb",
  eks: "aws-eks",
  ecs: "aws-ecs",
  waf: "ms-waf",
  firewall: "ms-firewall",
  proxy: "ms-proxy",
  graphql: "ms-graphql",
  grpc: "ms-grpc",
  monitoring: "ms-monitoring",
  logging: "ms-logging",
  "c4-software-system": "c4-system",
  person: "c4-person",
  system: "c4-system",
  container: "c4-container",
  component: "c4-component",
};

/**
 * Searches the component registry by keyword and optional category.
 * Used by the AI `lookup_components` tool to pick verified subtypes.
 */
export function searchRegistry(
  query: string,
  category?: NodeCategory,
  limit = 16,
  customPool?: Array<NodeTemplate>,
): Array<Pick<NodeTemplate, "subtype" | "label" | "category" | "description">> {
  const allTemplates = getAllTemplates(customPool);
  const terms = query
    .toLowerCase()
    .split(/[\s,/-]+/)
    .filter(Boolean);

  const pool = category
    ? allTemplates.filter((t) => t.category === category)
    : allTemplates;

  if (terms.length === 0) {
    return pool.slice(0, limit).map(({ subtype, label, category: cat, description }) => ({
      subtype,
      label,
      category: cat,
      description,
    }));
  }

  const scored = pool
    .map((t) => {
      const hay = `${t.subtype} ${t.label} ${t.category} ${t.description ?? ""}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (t.subtype.toLowerCase() === term) score += 10;
        else if (t.label.toLowerCase() === term) score += 8;
        else if (t.subtype.toLowerCase().includes(term)) score += 4;
        else if (t.label.toLowerCase().includes(term)) score += 3;
        else if (hay.includes(term)) score += 1;
      }
      return { template: t, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ template: { subtype, label, category: cat, description } }) => ({
    subtype,
    label,
    category: cat,
    description,
  }));
}

/**
 * Resolves any AI-emitted subtype/label to a verified NodeTemplate from REGISTRY or C4 templates.
 */
export function resolveNodeTemplate(
  rawSubtype: string | undefined,
  rawLabel: string | undefined,
  mode: "architecture" | "c4",
  customPool?: Array<NodeTemplate>,
): NodeTemplate {
  const allTemplates = getAllTemplates(customPool);
  const norm = (rawSubtype ?? "").toLowerCase().trim();
  const aliased = SUBTYPE_ALIASES[norm] ?? norm;

  // 1. Exact subtype match
  const exact = allTemplates.find((t) => t.subtype.toLowerCase() === aliased);
  if (exact) return exact;

  // 2. If in C4 mode, keep C4 taxonomy crisp
  if (mode === "c4") {
    if (aliased.includes("person") || aliased.includes("user") || aliased.includes("actor")) {
      return C4_TEMPLATES[0];
    }
    if (aliased.includes("external")) return C4_TEMPLATES[4];
    if (aliased.includes("component") || aliased.includes("module")) return C4_TEMPLATES[3];
    if (aliased.includes("container") || aliased.includes("db") || aliased.includes("api") || aliased.includes("app")) {
      return C4_TEMPLATES[2];
    }
    return C4_TEMPLATES[1];
  }

  // 3. Fuzzy search on subtype + label against REGISTRY
  const matches = searchRegistry(`${norm} ${rawLabel ?? ""}`, undefined, 1, customPool);
  if (matches.length > 0) {
    const found = allTemplates.find((t) => t.subtype === matches[0].subtype);
    if (found) return found;
  }

  // 4. Safe generic microservice fallback
  return (
    allTemplates.find((t) => t.subtype === "ms-service") ?? {
      subtype: "ms-service",
      label: "Microservice",
      category: "microservice",
      icon: "IconBox",
      description: "Standalone functional service",
    }
  );
}
