import path from 'node:path'
import { promises as fs } from 'node:fs'
import { parse } from 'node-html-parser'
import type { SpriteConfig, Processor } from './types'
import { logger } from './utils'

function toValidId(input: string): string {
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

/**
 * A fully processed symbol.
 */
export type SpriteSymbolProcessed = {
  attributes: Record<string, string>
  symbolDom: string
}

export class SpriteSymbol {
  config: SpriteConfig
  filePath: string
  id: string
  processed: Promise<SpriteSymbolProcessed | null> | null = null
  processors: Processor[]

  constructor(filePath: string, config: SpriteConfig) {
    this.id = toValidId(path.parse(filePath).name)
    this.filePath = filePath
    this.config = config
    if (config.processSpriteSymbol) {
      this.processors = Array.isArray(config.processSpriteSymbol)
        ? config.processSpriteSymbol
        : [config.processSpriteSymbol]
    } else {
      this.processors = []
    }
  }

  reset() {
    this.processed = null
  }

  getProcessed(): Promise<SpriteSymbolProcessed | null> | null {
    if (this.processed === null) {
      this.processed = fs
        .readFile(this.filePath)
        .then(async (buffer) => {
          const fileContents = buffer.toString().trim()

          if (!fileContents) {
            throw new Error('SVG file is empty.')
          }

          if (!fileContents.includes('<svg')) {
            throw new Error('Invalid SVG.')
          }

          const dom = parse(fileContents)
          const svg = dom.querySelector('svg')
          if (!svg) {
            throw new Error('Failed to find <svg> in file.')
          }

          for (const processor of this.processors) {
            await processor(svg, {
              id: this.id,
              filePath: this.filePath,
            })
          }

          const attributes = {
            ...svg.attributes,
            id: this.id,
          }

          return {
            attributes,
            symbolDom: svg.innerHTML,
          }
        })
        .catch((e) => {
          if (e instanceof Error) {
            logger.warn(`Failed to process SVG "${this.filePath}":`, e)
          }
          return null
        })

      return this.processed
    }

    return this.processed
  }
}
