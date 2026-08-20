/**
 * @fileoverview Central component registry aggregating all cloud and agnostic component definitions.
 */

import type { NodeTemplate } from '@/types/diagram'
import { AWS_REGISTRY } from './aws'
import { GCP_REGISTRY } from './gcp'
import { AZURE_REGISTRY } from './azure'
import { OTHER_REGISTRY } from './other'

export { AWS_REGISTRY, GCP_REGISTRY, AZURE_REGISTRY, OTHER_REGISTRY }

/**
 * The full component registry array containing all cloud provider and generic node templates.
 */
export const REGISTRY: Array<NodeTemplate> = [
  ...AWS_REGISTRY,
  ...GCP_REGISTRY,
  ...AZURE_REGISTRY,
  ...OTHER_REGISTRY,
]
