/**
 * @fileoverview Stable public entry point for the component template registry.
 * Re-exports provider registries (AWS, GCP, Azure, generic) and the aggregated catalog.
 */

export {
  REGISTRY,
  AWS_REGISTRY,
  GCP_REGISTRY,
  AZURE_REGISTRY,
  OTHER_REGISTRY,
} from './registry/index'
