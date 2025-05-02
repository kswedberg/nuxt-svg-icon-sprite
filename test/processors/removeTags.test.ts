import { describe, it, expect } from 'vitest'
import { testProcessor } from './base'
import { removeTags } from '~/src/processors/removeTags'

describe('removeTags', () => {
  it('should remove a single tag type', async () => {
    const processor = removeTags({ tags: ['title'] })
    expect(
      await testProcessor(
        '<svg><title>SVG Title</title><rect width="100" height="100" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect width="100" height="100"></rect></svg>
      "
    `,
    )
  })

  it('should remove multiple tag types', async () => {
    const processor = removeTags({ tags: ['title', 'desc'] })
    expect(
      await testProcessor(
        '<svg><title>SVG Title</title><desc>Description</desc><rect width="100" height="100" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect width="100" height="100"></rect></svg>
      "
    `,
    )
  })

  it('should remove all instances of specified tags', async () => {
    const processor = removeTags({ tags: ['circle'] })
    expect(
      await testProcessor(
        '<svg><circle cx="50" cy="50" r="40" /><rect width="100" height="100" /><circle cx="150" cy="150" r="30" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect width="100" height="100"></rect></svg>
      "
    `,
    )
  })

  it('should handle nested tags', async () => {
    const processor = removeTags({ tags: ['g'] })
    expect(
      await testProcessor(
        '<svg><g><circle cx="50" cy="50" r="40" /><rect width="100" height="100" /></g></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(`
      "<svg></svg>
      "
    `)
  })

  it('should remove only the specified tags', async () => {
    const processor = removeTags({ tags: ['title', 'desc'] })
    expect(
      await testProcessor(
        '<svg><title>SVG Title</title><metadata>Some metadata</metadata><desc>Description</desc></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(`
      "<svg><metadata>Some metadata</metadata></svg>
      "
    `)
  })

  it("should do nothing if specified tags don't exist", async () => {
    const processor = removeTags({ tags: ['title', 'desc'] })
    expect(
      await testProcessor(
        '<svg><rect width="100" height="100" /><circle cx="50" cy="50" r="40" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect width="100" height="100"></rect>
        <circle cx="50" cy="50" r="40"></circle>
      </svg>
      "
    `,
    )
  })

  it('should handle tags with attributes', async () => {
    const processor = removeTags({ tags: ['rect'] })
    expect(
      await testProcessor(
        '<svg><rect width="100" height="100" fill="red" stroke="blue" /><circle cx="50" cy="50" r="40" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><circle cx="50" cy="50" r="40"></circle></svg>
      "
    `,
    )
  })

  it('should handle tags with content', async () => {
    const processor = removeTags({ tags: ['text'] })
    expect(
      await testProcessor(
        '<svg><text x="10" y="20">Hello SVG</text><rect width="100" height="100" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect width="100" height="100"></rect></svg>
      "
    `,
    )
  })

  it('should handle complex nested structures', async () => {
    const processor = removeTags({ tags: ['g'] })
    expect(
      await testProcessor(
        `
        <svg>
          <g id="group1">
            <rect width="100" height="100" />
            <g id="subgroup">
              <circle cx="50" cy="50" r="40" />
              <text x="10" y="20">Text in subgroup</text>
            </g>
          </g>
          <circle cx="150" cy="150" r="30" />
        </svg>
      `,
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <circle cx="150" cy="150" r="30"></circle>
      </svg>
      "
    `,
    )
  })

  it('should support CSS selector syntax for tag selection', async () => {
    const processor = removeTags({ tags: ['rect[fill="red"]'] })
    expect(
      await testProcessor(
        `
        <svg>
          <rect width="100" height="100" fill="red" />
          <rect width="100" height="100" fill="blue" />
          <circle cx="50" cy="50" r="40" />
        </svg>
      `,
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect width="100" height="100" fill="blue"></rect>
        <circle cx="50" cy="50" r="40"></circle>
      </svg>
      "
    `,
    )
  })

  it('should handle multiple selectors with different complexities', async () => {
    const processor = removeTags({
      tags: ['rect[fill="red"]', 'circle', 'g > text'],
    })
    expect(
      await testProcessor(
        `
        <svg>
          <rect width="100" height="100" fill="red" />
          <rect width="100" height="100" fill="blue" />
          <circle cx="50" cy="50" r="40" />
          <g>
            <text x="10" y="20">Text in group</text>
            <rect width="50" height="50" />
          </g>
          <text x="10" y="20">Standalone text</text>
        </svg>
      `,
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect width="100" height="100" fill="blue"></rect>

        <g>
          <rect width="50" height="50"></rect>
        </g>
        <text x="10" y="20">Standalone text</text>
      </svg>
      "
    `,
    )
  })

  it('should handle empty tags array', async () => {
    const processor = removeTags({ tags: [] })
    expect(
      await testProcessor(
        '<svg><rect width="100" height="100" /><circle cx="50" cy="50" r="40" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect width="100" height="100"></rect>
        <circle cx="50" cy="50" r="40"></circle>
      </svg>
      "
    `,
    )
  })
})
