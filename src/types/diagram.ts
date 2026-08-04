import type { Node, Edge } from '@xyflow/react'

export type NodeCategory = 'microservice' | 'cloud' | 'database' | 'frontend' | 'networking' | 'security' | 'observability' | 'ai' | 'devops' | 'flow' | 'shape' | 'c4'


export type C4Level = 'context' | 'container' | 'component' | 'code'

export interface NodeMeta extends Record<string, unknown> {
  label: string
  category: NodeCategory
  subtype: string
  icon: string
  description: string
  /** For C4 nodes: which diagram level this node belongs to */
  c4Level?: C4Level
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
  /** Dark-mode variant — brighter accents, dark-tinted pills for contrast on dark cards */
  dark: { color: string; bg: string; border: string; text: string; pill: string }
}

export const CATEGORY_STYLE: Record<NodeCategory, CategoryStyle> = {
  microservice: {
    label: 'Microservices', color: '#185FA5', bg: '#EBF3FC', border: '#B5D4F4', text: '#0C447C', pill: '#DAEAF9',
    dark: { color: '#7FB4E8', bg: '#16283B', border: '#2E4F75', text: '#A8CCF0', pill: '#1E3A59' },
  },
  cloud: {
    label: 'Cloud Infra', color: '#3B6D11', bg: '#EDF5E2', border: '#C0DD97', text: '#27500A', pill: '#DFF0C5',
    dark: { color: '#8FC25C', bg: '#22351A', border: '#3F5C2B', text: '#B0D98A', pill: '#2C4523' },
  },
  database: {
    label: 'Databases', color: '#854F0B', bg: '#FDF0DC', border: '#FAC775', text: '#633806', pill: '#FAE4B0',
    dark: { color: '#E8A24D', bg: '#3A2B16', border: '#6B4E22', text: '#F0BE7E', pill: '#4A3A1E' },
  },
  frontend: {
    label: 'Frontend', color: '#993556', bg: '#FCE9F1', border: '#F4C0D1', text: '#72243E', pill: '#F8D4E3',
    dark: { color: '#E87BA6', bg: '#3A2230', border: '#6B3A52', text: '#F0A0C2', pill: '#4A2E40' },
  },
  networking: {
    label: 'Networking', color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4', text: '#115E59', pill: '#CCFBF1',
    dark: { color: '#2DD4BF', bg: '#123B36', border: '#1F5C54', text: '#66E3D4', pill: '#1A4A44' },
  },
  security: {
    label: 'Security', color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239', pill: '#FFE4E6',
    dark: { color: '#FB7185', bg: '#3E1A22', border: '#6B2B38', text: '#FDA4AF', pill: '#4E2530' },
  },
  observability: {
    label: 'Observability', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', pill: '#EDE9FE',
    dark: { color: '#A78BFA', bg: '#2A2340', border: '#4A3F6B', text: '#C4B5FD', pill: '#38305A' },
  },
  ai: {
    label: 'AI / ML', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', pill: '#DBEAFE',
    dark: { color: '#60A5FA', bg: '#1A2A45', border: '#2E4A75', text: '#93C5FD', pill: '#243B5E' },
  },
  devops: {
    label: 'DevOps', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', text: '#1F2937', pill: '#F3F4F6',
    dark: { color: '#9CA3AF', bg: '#2B2E33', border: '#4A5057', text: '#C0C7CF', pill: '#393E44' },
  },
  flow: {
    label: 'Interactions', color: '#D97706', bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', pill: '#FEF3C7',
    dark: { color: '#F59E0B', bg: '#3A2A10', border: '#6B4E1F', text: '#FBBF24', pill: '#4A3A1A' },
  },
  shape: {
    label: 'Shapes', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', text: '#334155', pill: '#F1F5F9',
    dark: { color: '#94A3B8', bg: '#232A33', border: '#3E4854', text: '#B6C2CF', pill: '#313B47' },
  },
  c4: {
    label: 'C4 Model', color: '#1168BD', bg: '#E8F4FD', border: '#1168BD', text: '#0B4D8C', pill: '#BBDEFB',
    dark: { color: '#4C9FE0', bg: '#16304A', border: '#2E547A', text: '#7FC0F0', pill: '#20405E' },
  },
}

