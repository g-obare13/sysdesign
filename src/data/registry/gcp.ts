import type { NodeTemplate } from '../../types/diagram'

/** Google Cloud Platform components. */
export const GCP_REGISTRY: NodeTemplate[] = [
  // Compute
  { subtype: 'gcp-compute-engine', label: 'Compute Engine', category: 'cloud', icon: 'IconServer', description: 'Virtual Machines' },
  { subtype: 'gcp-functions', label: 'Cloud Functions', category: 'cloud', icon: 'IconBolt', description: 'Event-driven Serverless' },
  { subtype: 'gcp-run', label: 'Cloud Run', category: 'cloud', icon: 'IconRocket', description: 'Serverless Containers' },
  { subtype: 'gcp-gke', label: 'Google Kubernetes Engine (GKE)', category: 'cloud', icon: 'IconBox', description: 'Managed Kubernetes' },
  { subtype: 'gcp-app-engine', label: 'App Engine', category: 'cloud', icon: 'IconBrowser', description: 'Platform as a Service' },
  { subtype: 'gcp-anthos', label: 'Anthos', category: 'cloud', icon: 'IconBuildingBridge', description: 'Hybrid Multi-cloud Platform' },
  { subtype: 'gcp-cloud-build', label: 'Cloud Build', category: 'cloud', icon: 'IconTool', description: 'CI/CD Platform' },

  // Storage
  { subtype: 'gcp-storage', label: 'Cloud Storage', category: 'cloud', icon: 'IconBucket', description: 'Unified Object Storage' },
  { subtype: 'gcp-filestore', label: 'Filestore', category: 'cloud', icon: 'IconFiles', description: 'Managed File Storage' },
  { subtype: 'gcp-persistent-disk', label: 'Persistent Disk', category: 'cloud', icon: 'IconDatabase', description: 'Block Storage' },
  { subtype: 'gcp-backup-dr', label: 'Backup and DR', category: 'cloud', icon: 'IconShieldCheck', description: 'Disaster Recovery' },

  // Networking
  { subtype: 'gcp-vpc', label: 'Virtual Private Cloud', category: 'cloud', icon: 'IconLock', description: 'Global Private Network' },
  { subtype: 'gcp-load-balancing', label: 'Cloud Load Balancing', category: 'cloud', icon: 'IconArrowsSplit2', description: 'Global Traffic Management' },
  { subtype: 'gcp-cloud-dns', label: 'Cloud DNS', category: 'cloud', icon: 'IconNetwork', description: 'Reliable DNA Routing' },
  { subtype: 'gcp-cloud-cdn', label: 'Cloud CDN', category: 'cloud', icon: 'IconWorld', description: 'Content Delivery Network' },
  { subtype: 'gcp-cloud-armor', label: 'Cloud Armor', category: 'cloud', icon: 'IconShieldLock', description: 'DDoS and WAF Protection' },
  { subtype: 'gcp-cloud-nat', label: 'Cloud NAT', category: 'cloud', icon: 'IconReplace', description: 'Network Address Translation' },
  { subtype: 'gcp-cloud-interconnect', label: 'Cloud Interconnect', category: 'cloud', icon: 'IconPlug', description: 'Dedicated Network Connection' },

  // Databases
  { subtype: 'gcp-cloud-sql', label: 'Cloud SQL', category: 'cloud', icon: 'IconDatabase', description: 'Managed MySQL, PostgreSQL, SQL Server' },
  { subtype: 'gcp-cloud-spanner', label: 'Cloud Spanner', category: 'cloud', icon: 'IconDatabase', description: 'Globally Distributed Relational DB' },
  { subtype: 'gcp-bigtable', label: 'Cloud Bigtable', category: 'cloud', icon: 'IconDatabase', description: 'NoSQL Wide-column Database' },
  { subtype: 'gcp-firestore', label: 'Firestore', category: 'cloud', icon: 'IconFileCode', description: 'Serverless Document Database' },
  { subtype: 'gcp-memorystore', label: 'Memorystore', category: 'cloud', icon: 'IconCpu', description: 'Managed Redis and Memcached' },
  { subtype: 'gcp-alloydb', label: 'AlloyDB', category: 'cloud', icon: 'IconDatabase', description: 'PostgreSQL-compatible Database' },

  // Messaging & Data
  { subtype: 'gcp-pubsub', label: 'Pub/Sub', category: 'cloud', icon: 'IconStack2', description: 'Global Messaging and Event Ingestion' },
  { subtype: 'gcp-eventarc', label: 'Eventarc', category: 'cloud', icon: 'IconActivity', description: 'Event-driven Architecture' },
  { subtype: 'gcp-dataflow', label: 'Dataflow', category: 'cloud', icon: 'IconChartLine', description: 'Stream and Batch Data Processing' },
  { subtype: 'gcp-dataproc', label: 'Dataproc', category: 'cloud', icon: 'IconServer', description: 'Managed Hadoop and Spark' },
  { subtype: 'gcp-bigquery', label: 'BigQuery', category: 'cloud', icon: 'IconDatabaseExport', description: 'Serverless Data Warehouse' },

  // Security & Identity
  { subtype: 'gcp-iam', label: 'Cloud IAM', category: 'cloud', icon: 'IconUsers', description: 'Identity and Access Management' },
  { subtype: 'gcp-kms', label: 'Cloud KMS', category: 'cloud', icon: 'IconKey', description: 'Key Management Service' },
  { subtype: 'gcp-iap', label: 'Identity-Aware Proxy', category: 'cloud', icon: 'IconLock', description: 'Zero Trust Access' },
  { subtype: 'gcp-secret-manager', label: 'Secret Manager', category: 'cloud', icon: 'IconKeypass', description: 'Store and Manage Secrets' },

  // AI & ML
  { subtype: 'gcp-vertex-ai', label: 'Vertex AI', category: 'cloud', icon: 'IconBrain', description: 'Unified ML Platform' },
  { subtype: 'gcp-vision-ai', label: 'Vision AI', category: 'cloud', icon: 'IconEyeScan', description: 'Image Analytics' },
  { subtype: 'gcp-speech-to-text', label: 'Speech-to-Text', category: 'cloud', icon: 'IconMicrophone', description: 'Audio Transcription' },
]
