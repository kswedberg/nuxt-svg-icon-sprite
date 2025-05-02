import { parse } from 'node-html-parser'
import type { Processor } from '~/src/build/types'
import * as prettier from 'prettier'

function format(v: string): Promise<string> {
  return prettier.format(v, {
    parser: 'html',
    proseWrap: 'always',
    semi: false,
    singleQuote: true,
    arrowParens: 'always',
    printWidth: 80,
    trailingComma: 'all',
  })
}

export function testProcessor(
  markup: string,
  processor: Processor,
  ctx: { id: string } = { id: 'foobar' },
): Promise<string> {
  const dom = parse(markup)
  const svg = dom.querySelector('svg')
  if (!svg) {
    return Promise.resolve('')
  }
  processor(svg, ctx)
  return format(svg.toString())
}
