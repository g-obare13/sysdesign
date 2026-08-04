import type { NodeTemplate } from '../../types/diagram'

/** AWS cloud components. */
export const AWS_REGISTRY: NodeTemplate[] = [
  // Compute
  { subtype: 'aws-ec2', label: 'Amazon EC2', category: 'cloud', icon: 'IconServer', description: 'Elastic Compute Cloud' },
  { subtype: 'aws-lambda', label: 'AWS Lambda', category: 'cloud', icon: 'IconBolt', description: 'Serverless Compute' },
  { subtype: 'aws-ecs', label: 'Amazon ECS', category: 'cloud', icon: 'IconBox', description: 'Elastic Container Service' },
  { subtype: 'aws-eks', label: 'Amazon EKS', category: 'cloud', icon: 'IconBox', description: 'Elastic Kubernetes Service' },
  { subtype: 'aws-fargate', label: 'AWS Fargate', category: 'cloud', icon: 'IconBox', description: 'Serverless Compute for Containers' },
  { subtype: 'aws-lightsail', label: 'Amazon Lightsail', category: 'cloud', icon: 'IconServer', description: 'Virtual Private Servers' },
  { subtype: 'aws-batch', label: 'AWS Batch', category: 'cloud', icon: 'IconStack2', description: 'Fully Managed Batch Processing' },
  { subtype: 'aws-outposts', label: 'AWS Outposts', category: 'cloud', icon: 'IconServer', description: 'Hybrid Cloud Compute' },
  { subtype: 'aws-elastic-beanstalk', label: 'Elastic Beanstalk', category: 'cloud', icon: 'IconBrowser', description: 'Web App Deployment' },
  { subtype: 'aws-app-runner', label: 'AWS App Runner', category: 'cloud', icon: 'IconRocket', description: 'Container Web App Service' },

  // Storage
  { subtype: 'aws-s3', label: 'Amazon S3', category: 'cloud', icon: 'IconBucket', description: 'Object Storage' },
  { subtype: 'aws-ebs', label: 'Amazon EBS', category: 'cloud', icon: 'IconDatabase', description: 'Elastic Block Store' },
  { subtype: 'aws-efs', label: 'Amazon EFS', category: 'cloud', icon: 'IconFiles', description: 'Elastic File System' },
  { subtype: 'aws-glacier', label: 'Amazon S3 Glacier', category: 'cloud', icon: 'IconSnowflake', description: 'Archive Storage' },
  { subtype: 'aws-storage-gateway', label: 'Storage Gateway', category: 'cloud', icon: 'IconBuildingBridge', description: 'Hybrid Storage Integration' },
  { subtype: 'aws-backup', label: 'AWS Backup', category: 'cloud', icon: 'IconShieldCheck', description: 'Centralized Backup' },
  { subtype: 'aws-fsx', label: 'Amazon FSx', category: 'cloud', icon: 'IconFolders', description: 'Managed File Storage' },

  // Networking
  { subtype: 'aws-vpc', label: 'Amazon VPC', category: 'cloud', icon: 'IconLock', description: 'Virtual Private Cloud' },
  { subtype: 'aws-api-gateway', label: 'API Gateway', category: 'cloud', icon: 'IconApi', description: 'API Management' },
  { subtype: 'aws-cloudfront', label: 'Amazon CloudFront', category: 'cloud', icon: 'IconWorld', description: 'Content Delivery Network' },
  { subtype: 'aws-route53', label: 'Amazon Route 53', category: 'cloud', icon: 'IconNetwork', description: 'Scalable DNS and Routing' },
  { subtype: 'aws-elb', label: 'Elastic Load Balancer', category: 'cloud', icon: 'IconArrowsSplit2', description: 'Application/Network Load Balancing' },
  { subtype: 'aws-transit-gateway', label: 'Transit Gateway', category: 'cloud', icon: 'IconNetwork', description: 'VPC and Account Connections' },
  { subtype: 'aws-direct-connect', label: 'Direct Connect', category: 'cloud', icon: 'IconPlug', description: 'Dedicated Network Connection' },
  { subtype: 'aws-global-accelerator', label: 'Global Accelerator', category: 'cloud', icon: 'IconRocket', description: 'Global Traffic Manager' },

  // Databases
  { subtype: 'aws-rds', label: 'Amazon RDS', category: 'cloud', icon: 'IconDatabase', description: 'Relational Database Service' },
  { subtype: 'aws-dynamodb', label: 'Amazon DynamoDB', category: 'cloud', icon: 'IconDatabase', description: 'NoSQL Database' },
  { subtype: 'aws-aurora', label: 'Amazon Aurora', category: 'cloud', icon: 'IconDatabase', description: 'MySQL/PostgreSQL Compatible Database' },
  { subtype: 'aws-elasticache', label: 'Amazon ElastiCache', category: 'cloud', icon: 'IconCpu', description: 'In-memory Data Store' },
  { subtype: 'aws-neptune', label: 'Amazon Neptune', category: 'cloud', icon: 'IconChartDots', description: 'Graph Database' },
  { subtype: 'aws-documentdb', label: 'Amazon DocumentDB', category: 'cloud', icon: 'IconFileCode', description: 'MongoDB Compatible Database' },
  { subtype: 'aws-keyspaces', label: 'Amazon Keyspaces', category: 'cloud', icon: 'IconDatabase', description: 'Cassandra Compatible Database' },
  { subtype: 'aws-redshift', label: 'Amazon Redshift', category: 'cloud', icon: 'IconDatabaseExport', description: 'Data Warehouse' },
  { subtype: 'aws-timestream', label: 'Amazon Timestream', category: 'cloud', icon: 'IconClock', description: 'Time Series Database' },

  // Messaging
  { subtype: 'aws-sqs', label: 'Amazon SQS', category: 'cloud', icon: 'IconStack2', description: 'Fully Managed Message Queues' },
  { subtype: 'aws-sns', label: 'Amazon SNS', category: 'cloud', icon: 'IconBell', description: 'Pub/Sub Messaging Service' },
  { subtype: 'aws-eventbridge', label: 'Amazon EventBridge', category: 'cloud', icon: 'IconActivity', description: 'Serverless Event Bus' },
  { subtype: 'aws-kinesis', label: 'Amazon Kinesis', category: 'cloud', icon: 'IconChartLine', description: 'Real-time Data Streaming' },
  { subtype: 'aws-step-functions', label: 'AWS Step Functions', category: 'cloud', icon: 'IconGitBranch', description: 'Visual Workflow Orchestration' },
  { subtype: 'aws-mq', label: 'Amazon MQ', category: 'cloud', icon: 'IconMassage', description: 'Managed Message Broker' },
  { subtype: 'aws-appsync', label: 'AWS AppSync', category: 'cloud', icon: 'IconPlugConnected', description: 'Managed GraphQL Service' },

  // Security & Identity
  { subtype: 'aws-iam', label: 'AWS IAM', category: 'cloud', icon: 'IconLock', description: 'Identity and Access Management' },
  { subtype: 'aws-cognito', label: 'Amazon Cognito', category: 'cloud', icon: 'IconUsers', description: 'Customer Identity' },
  { subtype: 'aws-kms', label: 'AWS KMS', category: 'cloud', icon: 'IconKey', description: 'Key Management Service' },
  { subtype: 'aws-waf', label: 'AWS WAF', category: 'cloud', icon: 'IconShieldLock', description: 'Web Application Firewall' },
  { subtype: 'aws-secrets-manager', label: 'Secrets Manager', category: 'cloud', icon: 'IconKeypass', description: 'Rotate, Manage, and Retrieve Secrets' },
  { subtype: 'aws-shield', label: 'AWS Shield', category: 'cloud', icon: 'IconShield', description: 'DDoS Protection' },
  { subtype: 'aws-guardduty', label: 'Amazon GuardDuty', category: 'cloud', icon: 'IconRadar', description: 'Intelligent Threat Detection' },
  { subtype: 'aws-macie', label: 'Amazon Macie', category: 'cloud', icon: 'IconEye', description: 'Data Security and Privacy' },
  { subtype: 'aws-inspector', label: 'Amazon Inspector', category: 'cloud', icon: 'IconSearch', description: 'Automated Vulnerability Management' },

  // AI & ML
  { subtype: 'aws-sagemaker', label: 'Amazon SageMaker', category: 'cloud', icon: 'IconBrain', description: 'Build, Train, Deploy ML Models' },
  { subtype: 'aws-bedrock', label: 'Amazon Bedrock', category: 'cloud', icon: 'IconBrain', description: 'Generative AI Foundation Models' },
  { subtype: 'aws-rekognition', label: 'Amazon Rekognition', category: 'cloud', icon: 'IconEyeScan', description: 'Image and Video Analysis' },
  { subtype: 'aws-polly', label: 'Amazon Polly', category: 'cloud', icon: 'IconMicrophone', description: 'Text-to-Speech' },
  { subtype: 'aws-comprehend', label: 'Amazon Comprehend', category: 'cloud', icon: 'IconMessageLanguage', description: 'Natural Language Processing' },
  { subtype: 'aws-translate', label: 'Amazon Translate', category: 'cloud', icon: 'IconLanguage', description: 'Neural Machine Translation' },
  { subtype: 'aws-lex', label: 'Amazon Lex', category: 'cloud', icon: 'IconRobot', description: 'Conversational AI Chatbots' },
]
