import type { NodeTemplate } from '../../types/diagram'
import { AWS_REGISTRY } from './aws'
import { GCP_REGISTRY } from './gcp'
import { AZURE_REGISTRY } from './azure'
import { OTHER_REGISTRY } from './other'

export { AWS_REGISTRY, GCP_REGISTRY, AZURE_REGISTRY, OTHER_REGISTRY }

/**
 * The full component registry, grouped by provider then category.
 * Consumers should import REGISTRY from "../../data/registry".
 */
export const REGISTRY: NodeTemplate[] = [
  ...AWS_REGISTRY,
  ...GCP_REGISTRY,
  ...AZURE_REGISTRY,
  ...OTHER_REGISTRY,
]
