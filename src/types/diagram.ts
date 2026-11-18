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
 * Restrained, architectural Nordic mineral palettes and styling presets for all diagram node categories.
 */
export const CATEGORY_STYLE: Record<NodeCategory, CategoryStyle> = {
  microservice:  { label: 'Microservices', color: '#2B5B7A', bg: '#F2F6F9', border: '#C9D8E2', text: '#1E3F54', pill: '#E6EFF5', dark: { color: '#78A9C8', bg: '#15222C', border: '#243A4A', text: '#D9E8F2', pill: '#1C2E3C' } },
  cloud:         { label: 'Cloud Infra',   color: '#3B6E5C', bg: '#F2F7F5', border: '#C7DDD5', text: '#264A3E', pill: '#E5EFEA', dark: { color: '#70B098', bg: '#14241F', border: '#233D34', text: '#D5EBE2', pill: '#1B3029' } },
  database:      { label: 'Databases',     color: '#9A6B3B', bg: '#F9F6F1', border: '#E4D6C3', text: '#664625', pill: '#F2EAE0', dark: { color: '#D4A36A', bg: '#261E14', border: '#403221', text: '#F2E4D2', pill: '#33281B' } },
  frontend:      { label: 'Frontend',      color: '#7A4E6D', bg: '#F8F4F7', border: '#DFCED9', text: '#523349', pill: '#EFE6EC', dark: { color: '#C08EB0', bg: '#241821', border: '#3D2938', text: '#EEDCE8', pill: '#30202C' } },
  networking:    { label: 'Networking',    color: '#2F7270', bg: '#F1F7F7', border: '#C4DEDC', text: '#1E4C4B', pill: '#E3EFEF', dark: { color: '#6EB5B2', bg: '#132424', border: '#213D3C', text: '#D4ECEB', pill: '#1A302F' } },
  security:      { label: 'Security',      color: '#A84A44', bg: '#FAF3F2', border: '#E6CBC9', text: '#70302C', pill: '#F4E5E4', dark: { color: '#D97E78', bg: '#281615', border: '#452624', text: '#F5DAD8', pill: '#361E1C' } },
  observability: { label: 'Observability', color: '#52568A', bg: '#F4F4F9', border: '#CECEE2', text: '#35385C', pill: '#E8E9F3', dark: { color: '#9296C9', bg: '#191A28', border: '#2B2D45', text: '#DFE0F2', pill: '#222336' } },
  ai:            { label: 'AI / ML',       color: '#365C94', bg: '#F2F5FA', border: '#C8D5E8', text: '#233D63', pill: '#E5ECF5', dark: { color: '#7BA3DC', bg: '#151E2B', border: '#24344B', text: '#D9E5F5', pill: '#1C283A' } },
  devops:        { label: 'DevOps',        color: '#4E5B66', bg: '#F4F6F7', border: '#D1D7DC', text: '#333C44', pill: '#E9ECEF', dark: { color: '#94A3B0', bg: '#181D21', border: '#2B333A', text: '#E1E6EA', pill: '#21272C' } },
  flow:          { label: 'Interactions',  color: '#55635D', bg: '#F4F6F5', border: '#D0D8D4', text: '#38423D', pill: '#E8ECEA', dark: { color: '#92A39B', bg: '#181E1B', border: '#2A332F', text: '#E0E7E4', pill: '#202724' } },
  shape:         { label: 'Shapes',        color: '#5A626A', bg: '#F5F6F7', border: '#D4D8DC', text: '#3B4046', pill: '#EAECEF', dark: { color: '#9BA3AB', bg: '#1A1C1F', border: '#2E3237', text: '#E3E6E8', pill: '#23262A' } },
  c4:            { label: 'C4 Model',      color: '#2B4657', bg: '#F3F6F7', border: '#CBD6DC', text: '#1C2E3A', pill: '#E6ECEF', dark: { color: '#8FB3C9', bg: '#141D24', border: '#243440', text: '#DCE7EE', pill: '#1B2730' } },
}
