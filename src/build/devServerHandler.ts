import {
  defineEventHandler,
  defaultContentType,
  setResponseHeader,
  getRequestURL,
} from 'h3'
import type { Collector } from './Collector'

/**
 * Serve sprites during dev mode.
 *
 * This is a workaround because Nuxt is quite buggy with templates and HMR.
 * Using the server handler makes sure we always serve the latest "version"
 * of the sprite during development.
 */
export function createDevServerHandler(collector: Collector) {
  return defineEventHandler(async (event) => {
    defaultContentType(event, 'image/svg+xml')
    // Workaround for a Chrome bug.
    if (typeof setResponseHeader === 'function') {
      setResponseHeader(event, 'Cache-Control', 'max-age=100000')
    }
    // @ts-ignore Preparing for H3 2.x
    else if (event?.res?.headers?.set) {
      // @ts-ignore
      event.res.headers.set('Cache-Control', 'max-age=100000')
    }

    const url = getRequestURL(event)
    const fileName = url.pathname.split('/').slice(-1)?.[0] ?? ''
    const [_prefix, spriteName, _hash, _extension] = fileName.split('.') ?? []

    const sprite = collector.sprites.find((v) => v.name === spriteName)
    if (!sprite) {
      return '<svg></svg>'
    }
    const { content } = await sprite.getSprite()
    return content
  })
}
