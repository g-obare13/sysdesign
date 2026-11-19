/**
 * @fileoverview Architecture and C4 Model templates catalog.
 * Aggregates battle-tested, production-ready reference diagrams.
 */

import type { DiagramEdge, DiagramNode } from "@/types/diagram";
import { SAAS_MULTIREGION_TEMPLATE } from "./templates/saas-multiregion";
import { EVENT_DRIVEN_ORDERS_TEMPLATE } from "./templates/event-driven-orders";
import { DATA_INGESTION_PIPELINE_TEMPLATE } from "./templates/data-ingestion-pipeline";
import { RAG_AI_PLATFORM_TEMPLATE } from "./templates/rag-ai-platform";
import { B2B_SAAS_C4_TEMPLATE } from "./templates/b2b-saas-c4";
import { ECOMMERCE_C4_TEMPLATE } from "./templates/ecommerce-c4";
import { URL_SHORTENER_C4_TEMPLATE } from "./templates/url-shortener-c4";
import { NOTIFICATIONS_C4_TEMPLATE } from "./templates/notifications-c4";

/**
 * Prebuilt diagram template definition.
 */
export interface Template {
  /** Unique template identifier */
  id: string;
  /** Human-readable template title */
  name: string;
  /** Template category ('architecture' or 'c4') */
  category: "architecture" | "c4";
  /** Descriptive overview of the template architecture */
  description: string;
  /** Nodes that populate the canvas */
  nodes: Array<DiagramNode>;
  /** Edges connecting the nodes */
  edges: Array<DiagramEdge>;
}

/**
 * Collection of battle-tested production system architecture templates.
 */
export const ARCHITECTURE_TEMPLATES: Array<Template> = [
  SAAS_MULTIREGION_TEMPLATE,
  EVENT_DRIVEN_ORDERS_TEMPLATE,
  DATA_INGESTION_PIPELINE_TEMPLATE,
  RAG_AI_PLATFORM_TEMPLATE,
];

/**
 * Collection of C4 Model context/container templates.
 */
export const C4_TEMPLATES: Array<Template> = [
  B2B_SAAS_C4_TEMPLATE,
  ECOMMERCE_C4_TEMPLATE,
  URL_SHORTENER_C4_TEMPLATE,
  NOTIFICATIONS_C4_TEMPLATE,
];

/**
 * Full list of available diagram templates across all categories.
 */
export const TEMPLATES: Array<Template> = [
  ...ARCHITECTURE_TEMPLATES,
  ...C4_TEMPLATES,
];

export {
  SAAS_MULTIREGION_TEMPLATE,
  EVENT_DRIVEN_ORDERS_TEMPLATE,
  DATA_INGESTION_PIPELINE_TEMPLATE,
  RAG_AI_PLATFORM_TEMPLATE,
  B2B_SAAS_C4_TEMPLATE,
  ECOMMERCE_C4_TEMPLATE,
  URL_SHORTENER_C4_TEMPLATE,
  NOTIFICATIONS_C4_TEMPLATE,
};
