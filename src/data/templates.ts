/**
 * @fileoverview Architecture and C4 Model templates catalog.
 * Aggregates prebuilt reference diagrams for e-commerce, chat, fintech, banking, telehealth, and ride-hailing.
 */

import type { DiagramEdge, DiagramNode } from "@/types/diagram";
import { ECOMMERCE_TEMPLATE } from "./templates/ecommerce-architecture";
import { CHAT_TEMPLATE } from "./templates/chat-architecture";
import { FINTECH_TEMPLATE } from "./templates/fintech-architecture";
import { BANKING_C4_TEMPLATE } from "./templates/banking-c4";
import { TELEHEALTH_C4_TEMPLATE } from "./templates/telehealth-c4";
import { RIDEHAILING_C4_TEMPLATE } from "./templates/ridehailing-c4";

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
 * Collection of production system architecture templates.
 */
export const ARCHITECTURE_TEMPLATES: Array<Template> = [
  ECOMMERCE_TEMPLATE,
  CHAT_TEMPLATE,
  FINTECH_TEMPLATE,
];

/**
 * Collection of C4 Model context/container/component templates.
 */
export const C4_TEMPLATES: Array<Template> = [
  BANKING_C4_TEMPLATE,
  TELEHEALTH_C4_TEMPLATE,
  RIDEHAILING_C4_TEMPLATE,
];

/**
 * Full list of available diagram templates across all categories.
 */
export const TEMPLATES: Array<Template> = [
  ...ARCHITECTURE_TEMPLATES,
  ...C4_TEMPLATES,
];

export {
  ECOMMERCE_TEMPLATE,
  CHAT_TEMPLATE,
  FINTECH_TEMPLATE,
  BANKING_C4_TEMPLATE,
  TELEHEALTH_C4_TEMPLATE,
  RIDEHAILING_C4_TEMPLATE,
};
