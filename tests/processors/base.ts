import { parse } from 'node-html-parser'
import type { Processor } from '~/src/build/types'

export function testProcessor(
  markup: string,
  processor: Processor,
  ctx: { id: string } = { id: 'foobar' },
): string {
  const dom = parse(markup)
  const svg = dom.querySelector('svg')
  if (!svg) {
    return ''
  }
  processor(svg, ctx)
  return svg.toString()
}
