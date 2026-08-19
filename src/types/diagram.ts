/**
 * @fileoverview Diagram types, node metadata, templates, and styling definitions.
 * Provides core type definitions for system architecture and C4 diagramming.
 */

import type { Node, Edge } from '@xyflow/react'

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
}

/**
 * Predefined node templates grouped by architectural category.
 */
export const NODE_TEMPLATES: Record<NodeCategory, NodeTemplate[]> = {
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
 * Color palettes and styling presets for all diagram node categories.
 */
export const CATEGORY_STYLE: Record<NodeCategory, CategoryStyle> = {
  microservice:  { label: 'Microservices', color: '#185FA5', bg: '#EBF3FC', border: '#B5D4F4', text: '#0C447C', pill: '#DAEAF9' },
  cloud:         { label: 'Cloud Infra',   color: '#3B6D11', bg: '#EDF5E2', border: '#C0DD97', text: '#27500A', pill: '#DFF0C5' },
  database:      { label: 'Databases',     color: '#854F0B', bg: '#FDF0DC', border: '#FAC775', text: '#633806', pill: '#FAE4B0' },
  frontend:      { label: 'Frontend',      color: '#993556', bg: '#FCE9F1', border: '#F4C0D1', text: '#72243E', pill: '#F8D4E3' },
  networking:    { label: 'Networking',    color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4', text: '#115E59', pill: '#CCFBF1' },
  security:      { label: 'Security',      color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239', pill: '#FFE4E6' },
  observability: { label: 'Observability', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', pill: '#EDE9FE' },
  ai:            { label: 'AI / ML',       color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', pill: '#DBEAFE' },
  devops:        { label: 'DevOps',        color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', text: '#1F2937', pill: '#F3F4F6' },
  flow:          { label: 'Interactions',  color: '#D97706', bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', pill: '#FEF3C7' },
  shape:         { label: 'Shapes',        color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', text: '#334155', pill: '#F1F5F9' },
  c4:            { label: 'C4 Model',      color: '#1168BD', bg: '#E8F4FD', border: '#1168BD', text: '#0B4D8C', pill: '#BBDEFB' },
}
