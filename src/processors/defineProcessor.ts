import type { Processor } from './../build/types'

/**
 * Define a processor.
 */
export function defineProcessor<
  T extends object,
  OptionsOptional = object extends T ? true : false,
>(
  processor: (options?: T) => Processor,
): OptionsOptional extends true
  ? (options?: T) => Processor
  : (options: T) => Processor {
  return processor
}
