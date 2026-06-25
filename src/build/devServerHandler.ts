import { defineEventHandler } from 'h3'
import type { H3Event } from 'h3'
import type { Collector } from './Collector'

/**
 * @param {H3Event} event
 */
function getRequestPath(event: H3Event): string {
  const raw =
    event.node?.req?.originalUrl || event.path || event.node?.req?.url || '/'

  return raw.split('?')[0] ?? raw
}

/**
 * Serve sprites during dev mode.
 *
 * This is a workaround because Nuxt is quite buggy with templates and HMR.
 * Using the server handler makes sure we always serve the latest "version"
 * of the sprite during development.
 */
export function createDevServerHandler(collector: Collector) {
  return defineEventHandler(async (event) => {
    const res = event.node?.res
    if (
      res?.setHeader &&
      res.statusCode !== 304 &&
      !res.getHeader('content-type')
    ) {
      res.setHeader('content-type', 'image/svg+xml')
    }
    if (res?.setHeader) {
      res.setHeader('Cache-Control', 'max-age=100000')
    }

    const fileName = getRequestPath(event).split('/').pop() ?? ''
    const [_prefix, spriteName, _hash, _extension] = fileName.split('.') ?? []

    const sprite = collector.sprites.find((v) => v.name === spriteName)
    if (!sprite) {
      return '<svg></svg>'
    }
    const { content } = await sprite.getSprite()
    return content
  })
}
