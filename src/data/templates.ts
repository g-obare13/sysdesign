import type { DiagramNode, DiagramEdge } from "../types/diagram";
import { ECOMMERCE_TEMPLATE } from "./templates/ecommerce-architecture";
import { CHAT_TEMPLATE } from "./templates/chat-architecture";
import { FINTECH_TEMPLATE } from "./templates/fintech-architecture";
import { BANKING_C4_TEMPLATE } from "./templates/banking-c4";
import { TELEHEALTH_C4_TEMPLATE } from "./templates/telehealth-c4";
import { RIDEHAILING_C4_TEMPLATE } from "./templates/ridehailing-c4";

export interface Template {
  id: string;
  name: string;
  category: "architecture" | "c4";
  description: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export const ARCHITECTURE_TEMPLATES: Template[] = [
  ECOMMERCE_TEMPLATE,
  CHAT_TEMPLATE,
  FINTECH_TEMPLATE,
];

export const C4_TEMPLATES: Template[] = [
  BANKING_C4_TEMPLATE,
  TELEHEALTH_C4_TEMPLATE,
  RIDEHAILING_C4_TEMPLATE,
];

export const TEMPLATES: Template[] = [
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
