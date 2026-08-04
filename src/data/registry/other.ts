import type { NodeTemplate } from '../../types/diagram'

/** Provider-agnostic components: databases, frontends, patterns, flows, shapes. */
export const OTHER_REGISTRY: NodeTemplate[] = [
  // Generic Databases / Data Stores
  { subtype: 'db-postgres', label: 'PostgreSQL', category: 'database', icon: 'IconDatabase', description: 'Relational Database system' },
  { subtype: 'db-mysql', label: 'MySQL', category: 'database', icon: 'IconDatabase', description: 'Relational Database system' },
  { subtype: 'db-mariadb', label: 'MariaDB', category: 'database', icon: 'IconDatabase', description: 'Relational Database system' },
  { subtype: 'db-sqlserver', label: 'SQL Server', category: 'database', icon: 'IconDatabase', description: 'Microsoft SQL Server' },
  { subtype: 'db-oracle', label: 'Oracle Database', category: 'database', icon: 'IconDatabase', description: 'Oracle Relational Database' },
  { subtype: 'db-sqlite', label: 'SQLite', category: 'database', icon: 'IconDatabase', description: 'C-language library for SQL' },
  { subtype: 'db-mongo', label: 'MongoDB', category: 'database', icon: 'IconLeaf', description: 'NoSQL Document Database' },
  { subtype: 'db-cassandra', label: 'Cassandra', category: 'database', icon: 'IconStack', description: 'Wide Column NoSQL Database' },
  { subtype: 'db-redis', label: 'Redis', category: 'database', icon: 'IconCpu', description: 'In-memory Cache and Data Store' },
  { subtype: 'db-memcached', label: 'Memcached', category: 'database', icon: 'IconCpu', description: 'Distributed Memory Object Caching' },
  { subtype: 'db-elasticsearch', label: 'Elasticsearch', category: 'database', icon: 'IconSearch', description: 'Search and Analytics Engine' },
  { subtype: 'db-kafka', label: 'Apache Kafka', category: 'database', icon: 'IconChartLine', description: 'Distributed Event Streaming' },
  { subtype: 'db-rabbitmq', label: 'RabbitMQ', category: 'database', icon: 'IconStack2', description: 'Message Broker' },
  { subtype: 'db-neo4j', label: 'Neo4j', category: 'database', icon: 'IconChartDots', description: 'Graph Database' },
  { subtype: 'db-influxdb', label: 'InfluxDB', category: 'database', icon: 'IconClock', description: 'Time Series Database' },
  { subtype: 'db-couchbase', label: 'Couchbase', category: 'database', icon: 'IconDatabase', description: 'NoSQL Document Database' },
  { subtype: 'db-snowflake', label: 'Snowflake', category: 'database', icon: 'IconSnowflake', description: 'Cloud Data Warehouse' },
  { subtype: 'db-databricks', label: 'Databricks', category: 'database', icon: 'IconBox', description: 'Unified Data Analytics Platform' },
  { subtype: 'db-supabase', label: 'Supabase DB', category: 'database', icon: 'IconDatabase', description: 'Open Source Firebase Alternative' },
  { subtype: 'db-cockroach', label: 'CockroachDB', category: 'database', icon: 'IconDatabase', description: 'Distributed SQL Database' },

  // Frontend & Clients
  { subtype: 'fe-webapp', label: 'Web Application', category: 'frontend', icon: 'IconBrowser', description: 'Standard Browser Web App' },
  { subtype: 'fe-pwa', label: 'Progressive Web App', category: 'frontend', icon: 'IconBrowserPlus', description: 'Installable Web App' },
  { subtype: 'fe-mobile-ios', label: 'iOS App', category: 'frontend', icon: 'IconBrandApple', description: 'Native Apple iOS Application' },
  { subtype: 'fe-mobile-android', label: 'Android App', category: 'frontend', icon: 'IconBrandAndroid', description: 'Native Google Android Application' },
  { subtype: 'fe-mobile-cross', label: 'Mobile App (Cross-plat)', category: 'frontend', icon: 'IconDeviceMobile', description: 'React Native / Flutter App' },
  { subtype: 'fe-desktop', label: 'Desktop App', category: 'frontend', icon: 'IconDeviceMonitor', description: 'Windows, Mac, or Linux App' },
  { subtype: 'fe-browser', label: 'Browser Client', category: 'frontend', icon: 'IconBrandChrome', description: 'End-user Web Browser' },
  { subtype: 'fe-user', label: 'End User', category: 'frontend', icon: 'IconUser', description: 'System User or Client' },
  { subtype: 'fe-spa', label: 'Single Page App', category: 'frontend', icon: 'IconAppWindow', description: 'React/Vue/Svelte SPA' },
  { subtype: 'fe-ssr', label: 'SSR App', category: 'frontend', icon: 'IconServer', description: 'Next.js/Nuxt.js Server-Side App' },
  { subtype: 'fe-cdn', label: 'CDN Edge', category: 'frontend', icon: 'IconWorld', description: 'Content Delivery Network Proxy' },
  { subtype: 'fe-bff', label: 'BFF Layer', category: 'frontend', icon: 'IconPlugConnected', description: 'Backend for Frontend Service' },
  { subtype: 'fe-admin', label: 'Admin Dashboard', category: 'frontend', icon: 'IconDashboard', description: 'Internal Management Portal' },
  { subtype: 'fe-iot', label: 'IoT Device', category: 'frontend', icon: 'IconCpu', description: 'Internet of Things Client' },
  { subtype: 'fe-watch', label: 'Smartwatch App', category: 'frontend', icon: 'IconDeviceWatch', description: 'Wearable Appliance App' },
  { subtype: 'fe-tv', label: 'Smart TV App', category: 'frontend', icon: 'IconDeviceTv', description: 'Television Interface' },
  { subtype: 'fe-cli', label: 'CLI Tool', category: 'frontend', icon: 'IconTerminal2', description: 'Command Line Interface User' },
  { subtype: 'fe-api-client', label: '3rd Party API Client', category: 'frontend', icon: 'IconCode', description: 'External API Consumer' },
  { subtype: 'fe-webhook-rx', label: 'Webhook Receiver', category: 'frontend', icon: 'IconWebhook', description: 'External System Receiving Push' },
  { subtype: 'fe-extension', label: 'Browser Extension', category: 'frontend', icon: 'IconPuzzle', description: 'Chrome/Firefox Plugin' },

  // Microservice & Architectural Patterns
  { subtype: 'ms-service', label: 'Microservice', category: 'microservice', icon: 'IconBox', description: 'Standalone Functional Service' },
  { subtype: 'ms-api-gateway', label: 'API Gateway', category: 'microservice', icon: 'IconApi', description: 'Entry Point for Microservices' },
  { subtype: 'ms-load-balancer', label: 'Load Balancer', category: 'microservice', icon: 'IconArrowsSplit2', description: 'Distributes Incoming Traffic' },
  { subtype: 'ms-service-mesh', label: 'Service Mesh', category: 'microservice', icon: 'IconTopologyStar', description: 'Service-to-Service Communication' },
  { subtype: 'ms-message-broker', label: 'Message Broker', category: 'microservice', icon: 'IconStack2', description: 'Async Message Queue' },
  { subtype: 'ms-event-bus', label: 'Event Bus', category: 'microservice', icon: 'IconActivity', description: 'Publish/Subscribe Event Hub' },
  { subtype: 'ms-auth-service', label: 'Auth Service', category: 'microservice', icon: 'IconLock', description: 'Authentication and Authorization' },
  { subtype: 'ms-cache', label: 'Cache Layer', category: 'microservice', icon: 'IconCpu', description: 'In-memory Cache Component' },
  { subtype: 'ms-worker', label: 'Background Worker', category: 'microservice', icon: 'IconSettings', description: 'Async Task Processor' },
  { subtype: 'ms-cron', label: 'Cron Job', category: 'microservice', icon: 'IconClock', description: 'Scheduled Task Execution' },
  { subtype: 'ms-graphql', label: 'GraphQL Server', category: 'microservice', icon: 'IconSchema', description: 'Unified API Graph' },
  { subtype: 'ms-grpc', label: 'gRPC Service', category: 'microservice', icon: 'IconPlug', description: 'High-performance RPC Service' },
  { subtype: 'ms-proxy', label: 'Reverse Proxy', category: 'microservice', icon: 'IconServerCog', description: 'Nginx, HAProxy, Envoy, etc.' },
  { subtype: 'ms-firewall', label: 'Firewall', category: 'microservice', icon: 'IconShieldLock', description: 'Network Security Boundary' },
  { subtype: 'ms-waf', label: 'WAF', category: 'microservice', icon: 'IconShield', description: 'Web Application Firewall' },
  { subtype: 'ms-monitoring', label: 'Monitoring', category: 'microservice', icon: 'IconChartHistogram', description: 'Prometheus, Datadog tracking' },
  { subtype: 'ms-logging', label: 'Logging Aggregator', category: 'microservice', icon: 'IconListTree', description: 'ELK, Splunk, Loki logging' },
  { subtype: 'ms-circuit-breaker', label: 'Circuit Breaker', category: 'microservice', icon: 'IconSwitch3', description: 'Fault Tolerance Pattern' },
  { subtype: 'ms-discovery', label: 'Service Discovery', category: 'microservice', icon: 'IconCompass', description: 'Consul, Eureka Service Registry' },
  { subtype: 'ms-config', label: 'Config Server', category: 'microservice', icon: 'IconAdjustments', description: 'Centralized Configuration' },

  // Security & Identity
  { subtype: 'sec-oauth', label: 'OAuth / OIDC Provider', category: 'security', icon: 'IconFingerprint', description: 'Identity Federation' },
  { subtype: 'sec-api-key', label: 'API Key Manager', category: 'security', icon: 'IconKey', description: 'Key Issuance & Validation' },
  { subtype: 'sec-waf', label: 'WAF', category: 'security', icon: 'IconShieldLock', description: 'Web Application Firewall' },
  { subtype: 'sec-vault', label: 'Secret Manager', category: 'security', icon: 'IconKeypass', description: 'Vault / Secrets Management' },
  { subtype: 'sec-idp', label: 'Identity Provider', category: 'security', icon: 'IconUsersGroup', description: 'Auth0, Okta, Cognito' },
  { subtype: 'sec-ssl', label: 'SSL/TLS Termination', category: 'security', icon: 'IconLock', description: 'Secure Tunnel Termination' },

  // Networking
  { subtype: 'net-lb', label: 'Load Balancer', category: 'networking', icon: 'IconArrowsSplit2', description: 'L4/L7 Traffic Distribution' },
  { subtype: 'net-dns', label: 'DNS', category: 'networking', icon: 'IconNetwork', description: 'Route 53, Cloudflare DNS' },
  { subtype: 'net-vpn', label: 'VPN', category: 'networking', icon: 'IconShieldNetwork', description: 'Secure Site-to-Site Tunnel' },
  { subtype: 'net-firewall', label: 'Firewall', category: 'networking', icon: 'IconWall', description: 'Network Access Control' },
  { subtype: 'net-proxy', label: 'Reverse Proxy', category: 'networking', icon: 'IconReplace', description: 'Nginx, HAProxy, Envoy' },
  { subtype: 'net-ingress', label: 'Ingress Controller', category: 'networking', icon: 'IconDoorEnter', description: 'K8s Ingress Management' },

  // Observability
  { subtype: 'obs-logs', label: 'Logging', category: 'observability', icon: 'IconFileText', description: 'ELK, Datadog, Splunk' },
  { subtype: 'obs-metrics', label: 'Metrics', category: 'observability', icon: 'IconChartHistogram', description: 'Prometheus, Grafana' },
  { subtype: 'obs-tracing', label: 'Tracing', category: 'observability', icon: 'IconRoute', description: 'Tempo, Jaeger, Honeycomb' },
  { subtype: 'obs-alert', label: 'Alerting', category: 'observability', icon: 'IconBellRinging', description: 'PagerDuty, OpsGenie' },

  // AI & Machine Learning
  { subtype: 'ai-serving', label: 'Model Serving', category: 'ai', icon: 'IconBrain', description: 'TF Serving, TorchServe' },
  { subtype: 'ai-vector-db', label: 'Vector Database', category: 'ai', icon: 'IconDatabaseStar', description: 'Pinecone, Milvus, Weaviate' },
  { subtype: 'ai-pipeline', label: 'Embedding Pipeline', category: 'ai', icon: 'IconBinaryTree', description: 'Data Vectorization Flow' },
  { subtype: 'ai-inference', label: 'Inference API', category: 'ai', icon: 'IconApi', description: 'LLM / Inference Gateway' },
  { subtype: 'ai-features', label: 'Feature Store', category: 'ai', icon: 'IconTableOptions', description: 'ML Feature Management' },

  // DevOps & Platform
  { subtype: 'dev-pipeline', label: 'CI/CD Pipeline', category: 'devops', icon: 'IconGitBranch', description: 'GitHub Actions, Jenkins' },
  { subtype: 'dev-registry', label: 'Container Registry', category: 'devops', icon: 'IconBox', description: 'ECR, GCR, Docker Hub' },
  { subtype: 'dev-artifacts', label: 'Artifact Store', category: 'devops', icon: 'IconPackage', description: 'Nexus, Artifactory' },
  { subtype: 'dev-k8s', label: 'Kubernetes Cluster', category: 'devops', icon: 'IconBoxMultiple', description: 'Container Orchestration' },
  { subtype: 'dev-helm', label: 'Helm Chart', category: 'devops', icon: 'IconAnchor', description: 'Package Management for K8s' },

  // ER Diagrams & Flows
  { subtype: 'flow-table', label: 'Database Table', category: 'flow', icon: 'IconTable', description: 'Entity with columns and types' },
  { subtype: 'flow-column', label: 'Table Column', category: 'flow', icon: 'IconLayoutRows', description: 'Field in a database table' },
  { subtype: 'flow-pk', label: 'Primary Key', category: 'flow', icon: 'IconKey', description: 'Unique identifier for a record' },
  { subtype: 'flow-fk', label: 'Foreign Key', category: 'flow', icon: 'IconLink', description: 'Reference to another table' },
  { subtype: 'flow-rel', label: 'Relationship', category: 'flow', icon: 'IconHierarchy', description: 'Visual mapping between tables' },

  // Sequence Diagrams
  { subtype: 'flow-actor', label: 'User Actor', category: 'flow', icon: 'IconUserCode', description: 'External user in sequence' },
  { subtype: 'flow-participant', label: 'System Component', category: 'flow', icon: 'IconServerCog', description: 'Participant in a flow' },
  { subtype: 'flow-api-call', label: 'API Call', category: 'flow', icon: 'IconReplace', description: 'Synchronous REST/gRPC call' },
  { subtype: 'flow-auth-flow', label: 'Auth Flow', category: 'flow', icon: 'IconFingerprint', description: 'OCID / Token exchange flow' },
  { subtype: 'flow-event', label: 'Event Message', category: 'flow', icon: 'IconRotateDot', description: 'Asynchronous event broadcase' },
  { subtype: 'flow-db-op', label: 'DB Operation', category: 'flow', icon: 'IconDatabaseSearch', description: 'Read or write data access' },

  // Shapes - Standard
  { subtype: 'sh-text', label: 'Text', category: 'shape', icon: 'IconType', description: 'Plain text label' },
  { subtype: 'sh-rect', label: 'Rectangle', category: 'shape', icon: 'IconSquare', description: 'Simple rectangle shape' },
  { subtype: 'sh-rounded', label: 'Rounded Rect', category: 'shape', icon: 'IconSquareRounded', description: 'Rectangle with rounded corners' },
  { subtype: 'sh-sticky', label: 'Sticky Note', category: 'shape', icon: 'IconStickyNote', description: 'Yellow sticky note' },
  { subtype: 'sh-bolt', label: 'Lightning', category: 'shape', icon: 'IconBolt', description: 'Logic or trigger bolt' },
  { subtype: 'sh-arrow', label: 'Arrow', category: 'shape', icon: 'IconArrowUpRight', description: 'Directional arrow' },
  { subtype: 'sh-list', label: 'List', category: 'shape', icon: 'IconList', description: 'List of items' },
  { subtype: 'sh-play', label: 'Play', category: 'shape', icon: 'IconPlayerPlay', description: 'Action or start button' },
  { subtype: 'sh-code', label: 'Code', category: 'shape', icon: 'IconCode', description: 'Code block or script' },
  { subtype: 'sh-grid', label: 'Grid', category: 'shape', icon: 'IconGridDots', description: 'Matrix or grid layout' },
  { subtype: 'sh-table', label: 'Table', category: 'shape', icon: 'IconTable', description: 'Data table structure' },
  { subtype: 'sh-frame', label: 'Frame', category: 'shape', icon: 'IconFrame', description: 'Container or selection frame' },

  // Shapes - Flowchart
  { subtype: 'sh-flow-rect', label: 'Process', category: 'shape', icon: 'IconSquare', description: 'Flowchart process step' },
  { subtype: 'sh-flow-diamond', label: 'Decision', category: 'shape', icon: 'IconRhombus', description: 'Decision point' },
  { subtype: 'sh-flow-oval', label: 'Terminator', category: 'shape', icon: 'IconCapsule', description: 'Start or end node' },
  { subtype: 'sh-flow-doc', label: 'Document', category: 'shape', icon: 'IconFile', description: 'Input/output document' },
  { subtype: 'sh-flow-multidoc', label: 'Multi-document', category: 'shape', icon: 'IconFiles', description: 'Multiple documents' },
]
