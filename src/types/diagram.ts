import type { Node, Edge } from '@xyflow/react'

export type NodeCategory = 'microservice' | 'cloud' | 'database' | 'frontend' | 'networking' | 'security' | 'observability' | 'ai' | 'devops' | 'flow' | 'shape' | 'c4'


export type C4Level = 'context' | 'container' | 'component' | 'code'

export interface NodeMeta extends Record<string, unknown> {
  label: string
  category: NodeCategory
  subtype?: string
  icon?: string
  description?: string
  /** For C4 nodes: which diagram level this node belongs to */
  c4Level?: C4Level
  technology?: string
  isExternal?: boolean
  containerRef?: string
  status?: string // e.g. "planned", "existing", "deprecated"
  owner?: string
  notes?: string
}

export type DiagramNode = Node<NodeMeta>
export type DiagramEdge = Edge

export interface NodeTemplate {
  subtype: string
  label: string
  category: NodeCategory
  icon: string
  description: string
}

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


export interface CategoryStyle {
  label: string
  color: string
  bg: string
  border: string
  text: string
  pill: string
  dark?: {
    color?: string
    bg?: string
    border?: string
    text?: string
    pill?: string
  }
}

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

