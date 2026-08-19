/**
 * @fileoverview Component catalog for Microsoft Azure cloud architecture nodes.
 */

import type { NodeTemplate } from '@/types/diagram'

/**
 * Microsoft Azure cloud component catalog.
 */
export const AZURE_REGISTRY: NodeTemplate[] = [
  // Compute
  { subtype: 'azure-vm', label: 'Virtual Machines', category: 'cloud', icon: 'IconServer', description: 'Linux and Windows VMs' },
  { subtype: 'azure-functions', label: 'Azure Functions', category: 'cloud', icon: 'IconBolt', description: 'Serverless Compute' },
  { subtype: 'azure-app-service', label: 'App Service', category: 'cloud', icon: 'IconBrowser', description: 'Web Apps and API Hosting' },
  { subtype: 'azure-aks', label: 'Azure Kubernetes Service (AKS)', category: 'cloud', icon: 'IconBox', description: 'Managed Kubernetes' },
  { subtype: 'azure-container-instances', label: 'Container Instances', category: 'cloud', icon: 'IconBox', description: 'Run Containers without Servers' },
  { subtype: 'azure-container-apps', label: 'Container Apps', category: 'cloud', icon: 'IconRocket', description: 'Serverless Container Microservices' },
  { subtype: 'azure-batch', label: 'Azure Batch', category: 'cloud', icon: 'IconStack2', description: 'Cloud-scale Job Scheduling' },

  // Storage
  { subtype: 'azure-blob', label: 'Blob Storage', category: 'cloud', icon: 'IconBucket', description: 'Massively Scalable Object Storage' },
  { subtype: 'azure-files', label: 'Azure Files', category: 'cloud', icon: 'IconFiles', description: 'Simple, Secure, Serverless File Shares' },
  { subtype: 'azure-disk', label: 'Disk Storage', category: 'cloud', icon: 'IconDatabase', description: 'High-performance Block Storage' },
  { subtype: 'azure-data-lake', label: 'Data Lake Storage', category: 'cloud', icon: 'IconDroplet', description: 'Big Data Analytics Storage' },

  // Networking
  { subtype: 'azure-vnet', label: 'Virtual Network', category: 'cloud', icon: 'IconLock', description: 'Private Cloud Networks' },
  { subtype: 'azure-load-balancer', label: 'Load Balancer', category: 'cloud', icon: 'IconArrowsSplit2', description: 'Deliver High Availability' },
  { subtype: 'azure-app-gateway', label: 'Application Gateway', category: 'cloud', icon: 'IconRoute', description: 'Web Traffic Load Balancer' },
  { subtype: 'azure-front-door', label: 'Azure Front Door', category: 'cloud', icon: 'IconWorld', description: 'Modern Cloud CDN' },
  { subtype: 'azure-traffic-manager', label: 'Traffic Manager', category: 'cloud', icon: 'IconNetwork', description: 'DNS-based Traffic Routing' },
  { subtype: 'azure-expressroute', label: 'ExpressRoute', category: 'cloud', icon: 'IconPlug', description: 'Dedicated Private Network Connection' },

  // Databases
  { subtype: 'azure-sql', label: 'Azure SQL Database', category: 'cloud', icon: 'IconDatabase', description: 'Managed SQL Database' },
  { subtype: 'azure-cosmos', label: 'Azure Cosmos DB', category: 'cloud', icon: 'IconDatabase', description: 'Globally Distributed NoSQL Database' },
  { subtype: 'azure-db-mysql', label: 'Azure DB for MySQL', category: 'cloud', icon: 'IconDatabase', description: 'Managed MySQL Database' },
  { subtype: 'azure-db-postgres', label: 'Azure DB for PostgreSQL', category: 'cloud', icon: 'IconDatabase', description: 'Managed PostgreSQL Database' },
  { subtype: 'azure-redis', label: 'Azure Cache for Redis', category: 'cloud', icon: 'IconCpu', description: 'Managed In-memory Data Store' },

  // Messaging
  { subtype: 'azure-service-bus', label: 'Service Bus', category: 'cloud', icon: 'IconStack2', description: 'Enterprise Message Broker' },
  { subtype: 'azure-event-grid', label: 'Event Grid', category: 'cloud', icon: 'IconActivity', description: 'Reliable Event Delivery' },
  { subtype: 'azure-event-hubs', label: 'Event Hubs', category: 'cloud', icon: 'IconChartLine', description: 'Big Data Streaming Platform' },

  // Security & Identity
  { subtype: 'azure-ad', label: 'Microsoft Entra ID', category: 'cloud', icon: 'IconUsers', description: 'Identity and Access Management' },
  { subtype: 'azure-key-vault', label: 'Key Vault', category: 'cloud', icon: 'IconKey', description: 'Safeguard Cryptographic Keys' },
  { subtype: 'azure-defender', label: 'Defender for Cloud', category: 'cloud', icon: 'IconShieldLock', description: 'Cloud Security Posture Management' },

  // Analytics & AI
  { subtype: 'azure-synapse', label: 'Synapse Analytics', category: 'cloud', icon: 'IconDatabaseExport', description: 'Enterprise Analytics' },
  { subtype: 'azure-ml', label: 'Azure Machine Learning', category: 'cloud', icon: 'IconBrain', description: 'Enterprise-grade ML Service' },
]
