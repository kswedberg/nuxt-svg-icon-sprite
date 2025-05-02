import { describe, it, expect } from 'vitest'
import { testProcessor } from './base'
import { forceCurrentColor } from '~/src/processors/forceCurrentColor'

describe('forceCurrentColor', () => {
  it('should replace stroke and fill colors with currentColor', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><path stroke="blue" fill="red" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><path stroke="currentColor" fill="currentColor"></path></svg>
      "
    `,
    )
  })

  it('should handle multiple elements with different colors', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><rect stroke="green" /><circle fill="#000" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect stroke="currentColor"></rect>
        <circle fill="currentColor"></circle>
      </svg>
      "
    `,
    )
  })

  it('should not replace colors when SVG has data-keep-color attribute', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg data-keep-color><path stroke="blue" fill="red" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><path stroke="blue" fill="red"></path></svg>
      "
    `,
    )
  })

  it('should not replace colors on element with data-keep-color attribute', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><path stroke="blue" fill="red" /><rect stroke="green" data-keep-color /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <path stroke="currentColor" fill="currentColor"></path>
        <rect stroke="green"></rect>
      </svg>
      "
    `,
    )
  })

  it('should use custom ignore attribute when specified', async () => {
    const processor = forceCurrentColor({
      ignoreAttribute: 'data-preserve-colors',
    })
    expect(
      await testProcessor(
        '<svg data-preserve-colors><path stroke="blue" fill="red" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><path stroke="blue" fill="red"></path></svg>
      "
    `,
    )
  })

  it('should handle elements with custom ignore attribute', async () => {
    const processor = forceCurrentColor({
      ignoreAttribute: 'data-preserve-colors',
    })
    expect(
      await testProcessor(
        '<svg><path stroke="blue" fill="red" data-preserve-colors /><circle fill="green" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <path stroke="blue" fill="red"></path>
        <circle fill="currentColor"></circle>
      </svg>
      "
    `,
    )
  })

  it('should not modify elements without stroke or fill attributes', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><rect x="10" y="20" width="30" height="40" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect x="10" y="20" width="30" height="40"></rect></svg>
      "
    `,
    )
  })

  it('should handle empty stroke and fill values', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor('<svg><path stroke="" fill="" /></svg>', processor),
    ).toMatchInlineSnapshot(`
      "<svg><path stroke="" fill=""></path></svg>
      "
    `)
  })

  it('should handle nested SVG elements correctly', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><g><path stroke="blue" /><g><circle fill="red" /></g></g></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <g>
          <path stroke="currentColor"></path>
          <g><circle fill="currentColor"></circle></g>
        </g>
      </svg>
      "
    `,
    )
  })

  it('should handle SVG with mixed keep-color instructions', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><g data-keep-color><path stroke="blue" /><circle fill="red" /></g><rect fill="green" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <g>
          <path stroke="currentColor"></path>
          <circle fill="currentColor"></circle>
        </g>
        <rect fill="currentColor"></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle multiple color definitions on the same element', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><path stroke="blue" fill="red" stroke-width="2" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <path stroke="currentColor" fill="currentColor" stroke-width="2"></path>
      </svg>
      "
    `,
    )
  })

  it('should not modify color values in other attributes', async () => {
    const processor = forceCurrentColor()
    expect(
      await testProcessor(
        '<svg><filter><feFlood flood-color="red" /></filter></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <filter><feFlood flood-color="red"></feFlood></filter>
      </svg>
      "
    `,
    )
  })
})
