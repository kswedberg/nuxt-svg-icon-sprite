import type { ConsolaInstance } from 'consola'
import { useLogger } from '@nuxt/kit'

export const logger: ConsolaInstance = useLogger('nuxt-svg-icon-sprite')

/**
 * Type check for falsy values.
 *
 * Used as the callback for array.filter, e.g.
 * items.filter(falsy)
 */
export function falsy<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

export function toValidId(input: string): string {
  let sanitized = input
    .trim()
    .replace(/[^\w-]/g, '-')
    .replace(/-+/g, '-')

  // Make sure it starts with a valid character (letter or underscore)
  // If it starts with a number or hyphen, prefix with 'id-'.
  if (/^[0-9-]/.test(sanitized)) {
    sanitized = 'id-' + sanitized
  }

  if (!sanitized) {
    throw new Error('Failed to generate ID for symbol.')
  }

  const MAX_LENGTH = 64
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH)
  }

  // Make sure we don't end with a hyphen.
  if (sanitized.endsWith('-')) {
    sanitized = sanitized.slice(0, -1)
  }

  return sanitized
}
