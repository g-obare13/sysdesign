/**
 * @fileoverview Diagram types, node metadata, templates, and styling definitions.
 * Provides core type definitions for system architecture and C4 diagramming.
 */

import type { Edge, Node } from '@xyflow/react'

/**
 * Top-level classification category for diagram nodes.
 */
export type NodeCategory =
  | 'microservice'
  | 'cloud'
  | 'database'
  | 'frontend'
  | 'networking'
  | 'security'
  | 'observability'
  | 'ai'
  | 'devops'
  | 'flow'
  | 'shape'
  | 'c4'

/**
 * Supported hierarchical levels in the C4 architecture model.
 */
export type C4Level = 'context' | 'container' | 'component' | 'code'

/**
 * Metadata attributes stored on each ReactFlow diagram node.
 */
export interface NodeMeta extends Record<string, unknown> {
  /** Display label for the node */
  label: string
  /** Architectural category */
  category: NodeCategory
  /** Specific component subtype (e.g., 'api-gateway', 'postgres', 'c4-container') */
  subtype?: string
  /** Icon identifier from tabler icons */
  icon?: string
  /** Human-readable description or purpose */
  description?: string
  /** For C4 nodes: which diagram level this node belongs to */
  c4Level?: C4Level
  /** Underlying technology stack (e.g., 'Go, Gin', 'React, Vite', 'PostgreSQL 16') */
  technology?: string
  /** Whether the node represents an external boundary/third-party system */
  isExternal?: boolean
  /** Parent container or boundary reference */
  containerRef?: string
  /** Lifecycle or implementation status (e.g. 'planned', 'existing', 'deprecated') */
  status?: string
  /** Team or engineer ownership */
  owner?: string
  /** Additional engineering notes or documentation */
  notes?: string
}

/**
 * Typed ReactFlow diagram node wrapping NodeMeta.
 */
export type DiagramNode = Node<NodeMeta>

/**
 * Typed ReactFlow diagram edge connection.
 */
export type DiagramEdge = Edge

/**
 * Template configuration for draggable library items.
 */
export interface NodeTemplate {
  /** Subtype unique identifier */
  subtype: string
  /** Human-readable display label */
  label: string
  /** Architectural category */
  category: NodeCategory
  /** Tabler icon identifier */
  icon: string
  /** Brief description shown in tooltips and sidebar */
  description: string
  /** Optional technology label */
  technology?: string
}

/**
 * Predefined node templates grouped by architectural category.
 */
export const NODE_TEMPLATES: Record<NodeCategory, Array<NodeTemplate>> = {
  microservice: [
    { subtype: 'api-gateway',    label: 'API Gateway',    category: 'microservice', icon: 'IconApi',          description: 'Entry point for API traffic' },
    { subtype: 'service',        label: 'Service',        category: 'microservice', icon: 'IconBox',          description: 'Generic microservice' },
    { subtype: 'message-queue',  label: 'Message Queue',  category: 'microservice', icon: 'IconStack2',       description: 'Async message broker' },
    { subtype: 'load-balancer',  label: 'Load Balancer',  category: 'microservice', icon: 'IconArrowsSplit2', description: 'Traffic distribution' },
  ],
  cloud: [
    { subtype: 'ec2',    label: 'Compute (EC2)',  category: 'cloud', icon: 'IconServer',    description: 'Virtual machine instance' },
    { subtype: 's3',     label: 'Object Storage', category: 'cloud', icon: 'IconBucket',    description: 'S3 / GCS bucket' },
    { subtype: 'cdn',    label: 'CDN',            category: 'cloud', icon: 'IconWorld',     description: 'Content delivery network' },
    { subtype: 'lambda', label: 'Serverless Fn',  category: 'cloud', icon: 'IconBolt',      description: 'Lambda / Cloud Function' },
  ],
  database: [
    { subtype: 'postgres',      label: 'PostgreSQL',    category: 'database', icon: 'IconDatabase',  description: 'Relational database' },
    { subtype: 'redis',         label: 'Redis',         category: 'database', icon: 'IconCpu',       description: 'In-memory cache / store' },
    { subtype: 'mongo',         label: 'MongoDB',       category: 'database', icon: 'IconLeaf',      description: 'Document database' },
    { subtype: 'elasticsearch', label: 'Elasticsearch', category: 'database', icon: 'IconZoomCode',  description: 'Search & analytics engine' },
  ],
  frontend: [
    { subtype: 'web-app',   label: 'Web App',   category: 'frontend', icon: 'IconBrowser',   description: 'Browser-based client' },
    { subtype: 'mobile',    label: 'Mobile App',category: 'frontend', icon: 'IconDeviceMobile', description: 'iOS / Android client' },
    { subtype: 'component', label: 'Component', category: 'frontend', icon: 'IconLayoutGrid', description: 'UI component' },
    { subtype: 'bff',       label: 'BFF',       category: 'frontend', icon: 'IconPlugConnected', description: 'Backend for frontend' },
  ],
  networking: [],
  security: [],
  observability: [],
  ai: [],
  devops:        [],
  flow:          [],
  shape:         [],
  c4: [
    { subtype: 'c4-person',    label: 'Person',    category: 'c4', icon: 'IconUser',   description: 'An end user, customer, or actor'              },
    { subtype: 'c4-system',    label: 'System',    category: 'c4', icon: 'IconBox',    description: 'The software system being modelled'            },
    { subtype: 'c4-container', label: 'Container', category: 'c4', icon: 'IconStack2', description: 'An app, service, DB, or deployable unit'        },
    { subtype: 'c4-component', label: 'Component', category: 'c4', icon: 'IconPuzzle', description: 'A building block or module inside a container'  },
  ],
}

/**
 * Visual styling theme configuration for a node category.
 */
export interface CategoryStyle {
  /** Display label for the category */
  label: string
  /** Accent color hex code */
  color: string
  /** Background color hex code */
  bg: string
  /** Border color hex code */
  border: string
  /** Primary text color hex code */
  text: string
  /** Tag / badge background color */
  pill: string
  /** Optional dark theme overrides */
  dark?: {
    color?: string
    bg?: string
    border?: string
    text?: string
    pill?: string
  }
}

/**
 * Restrained, architectural color palettes and styling presets for all diagram node categories.
 * Toned to harmonize with the Olive / Warm Neutral workstation identity.
 */
export const CATEGORY_STYLE: Record<NodeCategory, CategoryStyle> = {
  microservice:  { label: 'Microservices', color: '#1d70b8', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', pill: '#e0edfa', dark: { color: '#60a5fa', bg: '#172554', border: '#1e40af', text: '#dbeafe', pill: '#1e3a8a30' } },
  cloud:         { label: 'Cloud Infra',   color: '#2e7d32', bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', pill: '#e2f2e3', dark: { color: '#4ade80', bg: '#052e16', border: '#166534', text: '#dcfce7', pill: '#14532d30' } },
  database:      { label: 'Databases',     color: '#8d5b28', bg: '#fefce8', border: '#fef08a', text: '#713f12', pill: '#f5ece1', dark: { color: '#facc15', bg: '#422006', border: '#854d0e', text: '#fef9c3', pill: '#713f1230' } },
  frontend:      { label: 'Frontend',      color: '#88304e', bg: '#fdf2f8', border: '#fbcfe8', text: '#701a75', pill: '#fae7ee', dark: { color: '#f472b6', bg: '#4a044e', border: '#86198f', text: '#fce7f3', pill: '#701a7530' } },
  networking:    { label: 'Networking',    color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', text: '#134e4a', pill: '#e0f5f3', dark: { color: '#2dd4bf', bg: '#042f2e', border: '#115e59', text: '#ccfbf1', pill: '#134e4a30' } },
  security:      { label: 'Security',      color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', text: '#881337', pill: '#fce4e8', dark: { color: '#fb7185', bg: '#4c0519', border: '#9f1239', text: '#ffe4e6', pill: '#88133730' } },
  observability: { label: 'Observability', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95', pill: '#eee6fb', dark: { color: '#a78bfa', bg: '#2e1065', border: '#5b21b6', text: '#ede9fe', pill: '#4c1d9530' } },
  ai:            { label: 'AI / ML',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', pill: '#e0ebfc', dark: { color: '#60a5fa', bg: '#172554', border: '#1e40af', text: '#dbeafe', pill: '#1d4ed830' } },
  devops:        { label: 'DevOps',        color: '#475569', bg: '#f8fafc', border: '#e2e8f0', text: '#0f172a', pill: '#eaf0f4', dark: { color: '#94a3b8', bg: '#0f172a', border: '#334155', text: '#f1f5f9', pill: '#33415530' } },
  flow:          { label: 'Interactions',  color: '#59634b', bg: '#f1f3ec', border: '#d4dcc8', text: '#3b4233', pill: '#e8ebe1', dark: { color: '#9ba889', bg: '#22251e', border: '#31352c', text: '#e4e6de', pill: '#282c23' } },
  shape:         { label: 'Shapes',        color: '#475569', bg: '#f8fafc', border: '#e2e8f0', text: '#0f172a', pill: '#eaf0f4', dark: { color: '#94a3b8', bg: '#0f172a', border: '#334155', text: '#f1f5f9', pill: '#33415530' } },
  c4:            { label: 'C4 Model',      color: '#59634b', bg: '#f1f3ec', border: '#d4dcc8', text: '#3b4233', pill: '#e8ebe1', dark: { color: '#9ba889', bg: '#22251e', border: '#31352c', text: '#e4e6de', pill: '#282c23' } },
}
