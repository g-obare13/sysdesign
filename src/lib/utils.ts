/**
 * @fileoverview Utility functions for class name merging and common helpers.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple CSS class names and handles Tailwind CSS conflict resolution.
 *
 * @param inputs - List of class names, conditional objects, or arrays
 * @returns Combined and deduplicated className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
