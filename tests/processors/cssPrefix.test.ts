import { describe, it, expect } from 'vitest'
import { testProcessor } from './base'
import { cssPrefix } from '~/src/processors/cssPrefix'

describe('cssPrefix', () => {
  // Create a mock context with an id
  const mockContext = { id: 'test' }

  it('should prefix all element IDs', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><rect id="rect1" /><circle id="circle1" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect id="test--rect1"></rect>
        <circle id="test--circle1"></circle>
      </svg>
      "
    `,
    )
  })

  it('should prefix all class names', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><rect class="shape red" /><circle class="shape blue" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect class="test--shape test--red"></rect>
        <circle class="test--shape test--blue"></circle>
      </svg>
      "
    `,
    )
  })

  it('should handle empty class names correctly', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><rect class="" /><circle class="  " /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect class></rect>
        <circle class=" "></circle>
      </svg>
      "
    `,
    )
  })

  it('should update CSS selectors in style tags', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><style>#rect1 { fill: red; } .shape { stroke: blue; }</style><rect id="rect1" class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--rect1 {
            fill: red;
          }
          .test--shape {
            stroke: blue;
          }
        </style>
        <rect id="test--rect1" class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should update url(#id) references in attributes', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><linearGradient id="gradient1" /><rect fill="url(#gradient1)" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <linearGradient id="test--gradient1"></linearGradient>
        <rect fill="url(#test--gradient1)"></rect>
      </svg>
      "
    `,
    )
  })

  it('should update direct #id references in attributes', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><clipPath id="clip1" /><use href="#clip1" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <clipPath id="test--clip1"></clipPath>
        <use href="#test--clip1"></use>
      </svg>
      "
    `,
    )
  })

  it('should handle complex cases with multiple references', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        `<svg>
          <defs>
            <linearGradient id="grad1" />
            <filter id="filter1" />
            <clipPath id="clip1" />
          </defs>
          <style>
            #rect1 { fill: url(#grad1); }
            .red-shape { filter: url(#filter1); }
            #rect1.red-shape { clip-path: url(#clip1); }
          </style>
          <rect id="rect1" class="red-shape" />
          <use href="#rect1" />
        </svg>`,
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(`
      "<svg>
        <defs>
          <linearGradient id="test--grad1"></linearGradient>
          <filter id="test--filter1"></filter>
          <clipPath id="test--clip1"></clipPath>
        </defs>
        <style>
          #test--rect1 {
            fill: url(#test--grad1);
          }
          .test--red-shape {
            filter: url(#test--filter1);
          }
          #test--rect1.test--red-shape {
            clip-path: url(#test--clip1);
          }
        </style>
        <rect id="test--rect1" class="test--red-shape"></rect>
        <use href="#test--rect1"></use>
      </svg>
      "
    `) // Using toMatchInlineSnapshot without arguments to auto-generate the snapshot
  })

  it('should correctly reuse the same prefix for repeated class names', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><rect class="shape" /><circle class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <rect class="test--shape"></rect>
        <circle class="test--shape"></circle>
      </svg>
      "
    `,
    )
  })

  it('should handle multiple class names with spaces', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><rect class="shape  red   big" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect class="test--shape test--red test--big"></rect></svg>
      "
    `,
    )
  })

  it('should update CSS selectors with pseudo-classes and combinators', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><style>#rect1:hover { fill: red; } .shape > .inner { stroke: blue; }</style><rect id="rect1" class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--rect1:hover {
            fill: red;
          }
          .test--shape > .test--inner {
            stroke: blue;
          }
        </style>
        <rect id="test--rect1" class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle multiple style tags', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><style>#rect1 { fill: red; }</style><style>.shape { stroke: blue; }</style><rect id="rect1" class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--rect1 {
            fill: red;
          }
        </style>
        <style>
          .test--shape {
            stroke: blue;
          }
        </style>
        <rect id="test--rect1" class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should not modify attributes that are not references', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><rect x="10" y="20" width="30" height="40" stroke="blue" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect x="10" y="20" width="30" height="40" stroke="blue"></rect></svg>
      "
    `,
    )
  })

  it('should handle xlink:href references', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><pattern id="pattern1" /><rect xlink:href="#pattern1" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <pattern id="test--pattern1"></pattern>
        <rect xlink:href="#test--pattern1"></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle nested SVG elements with IDs and classes', async () => {
    const processor = cssPrefix()
    expect(
      await testProcessor(
        '<svg><g id="group1"><rect id="rect1" class="shape" /></g></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <g id="test--group1"><rect id="test--rect1" class="test--shape"></rect></g>
      </svg>
      "
    `,
    )
  })

  it('should prefix class names used in CSS but not in the DOM', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>.shape { fill: red; } .inner { stroke: blue; }</style><rect class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          .test--shape {
            fill: red;
          }
          .test--inner {
            stroke: blue;
          }
        </style>
        <rect class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should prefix IDs used in CSS selectors but not in the DOM', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>#rect1 { fill: red; } #circle1 { stroke: blue; }</style><rect id="rect1" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--rect1 {
            fill: red;
          }
          #test--circle1 {
            stroke: blue;
          }
        </style>
        <rect id="test--rect1"></rect>
      </svg>
      "
    `,
    )
  })

  it('should prefix IDs used in url() references in CSS but not in the DOM', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>.shape { fill: url(#gradient1); filter: url(#filter1); }</style><rect class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          .test--shape {
            fill: url(#test--gradient1);
            filter: url(#test--filter1);
          }
        </style>
        <rect class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle complex CSS selectors with multiple classes and IDs', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>#rect1.shape, .container > .inner, .outer #circle1 { fill: red; }</style><rect id="rect1" class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--rect1.test--shape,
          .test--container > .test--inner,
          .test--outer #test--circle1 {
            fill: red;
          }
        </style>
        <rect id="test--rect1" class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle CSS with media queries and keyframes', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>@media (min-width: 768px) { .shape { fill: red; } } @keyframes anim1 { from { opacity: 0; } to { opacity: 1; } } #rect1 { animation: anim1 2s; }</style><rect id="rect1" class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          @media (min-width: 768px) {
            .test--shape {
              fill: red;
            }
          }
          @keyframes anim1 {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          #test--rect1 {
            animation: anim1 2s;
          }
        </style>
        <rect id="test--rect1" class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle multiple occurrences of the same ID or class in CSS', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>#rect1 { fill: red; } .shape { stroke: blue; } #rect1:hover { fill: green; } .shape:hover { stroke: yellow; }</style><rect id="rect1" class="shape" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--rect1 {
            fill: red;
          }
          .test--shape {
            stroke: blue;
          }
          #test--rect1:hover {
            fill: green;
          }
          .test--shape:hover {
            stroke: yellow;
          }
        </style>
        <rect id="test--rect1" class="test--shape"></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle ID references in both CSS and attributes', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>#gradient1 { stop-color: red; } .shape { fill: url(#gradient1); }</style><linearGradient id="gradient1" /><rect class="shape" /><circle fill="url(#gradient1)" /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--gradient1 {
            stop-color: red;
          }
          .test--shape {
            fill: url(#test--gradient1);
          }
        </style>
        <linearGradient id="test--gradient1"></linearGradient>
        <rect class="test--shape"></rect>
        <circle fill="url(#test--gradient1)"></circle>
      </svg>
      "
    `,
    )
  })

  it('should handle SVG with no IDs or classes in the DOM but references in CSS', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>#rect1 { fill: red; } .shape { stroke: blue; }</style><rect /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          #test--rect1 {
            fill: red;
          }
          .test--shape {
            stroke: blue;
          }
        </style>
        <rect></rect>
      </svg>
      "
    `,
    )
  })

  it('should correctly prefix unused IDs in url() with different formats', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'test' }

    expect(
      await testProcessor(
        '<svg><style>.c1{filter:url(#f1)}.c2{fill:url("#f2")}.c3{mask:url( #f3 )}</style><rect /></svg>',
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg>
        <style>
          .test--c1 {
            filter: url(#test--f1);
          }
          .test--c2 {
            fill: url('#test--f2');
          }
          .test--c3 {
            mask: url(#test--f3);
          }
        </style>
        <rect></rect>
      </svg>
      "
    `,
    )
  })

  it('should handle a complex real-world example with multiple elements and styles', async () => {
    const processor = cssPrefix()
    const mockContext = { id: 'icon' }

    expect(
      await testProcessor(
        `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="blue" />
              <stop offset="100%" stop-color="red" />
            </linearGradient>
            <filter id="shadow1">
              <feDropShadow dx="2" dy="2" stdDeviation="3" />
            </filter>
          </defs>
          <style>
            .shape { fill: url(#gradient1); }
            .outline { stroke: black; filter: url(#shadow1); }
            #circle1 { fill: green; }
            #rect1.special { stroke-width: 2; }
            .container > .inner { opacity: 0.8; }
          </style>
          <g class="container">
            <rect id="rect1" class="shape special" x="2" y="2" width="20" height="10" />
            <circle id="circle1" class="outline" cx="12" cy="16" r="6" />
            <ellipse class="inner" cx="12" cy="16" rx="4" ry="3" />
          </g>
        </svg>
      `,
        processor,
        mockContext,
      ),
    ).toMatchInlineSnapshot(`
      "<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="icon--gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="blue"></stop>
            <stop offset="100%" stop-color="red"></stop>
          </linearGradient>
          <filter id="icon--shadow1">
            <feDropShadow dx="2" dy="2" stdDeviation="3"></feDropShadow>
          </filter>
        </defs>
        <style>
          .icon--shape {
            fill: url(#icon--gradient1);
          }
          .icon--outline {
            stroke: black;
            filter: url(#icon--shadow1);
          }
          #icon--circle1 {
            fill: green;
          }
          #icon--rect1.icon--special {
            stroke-width: 2;
          }
          .icon--container > .icon--inner {
            opacity: 0.8;
          }
        </style>
        <g class="icon--container">
          <rect
            id="icon--rect1"
            class="icon--shape icon--special"
            x="2"
            y="2"
            width="20"
            height="10"
          ></rect>
          <circle
            id="icon--circle1"
            class="icon--outline"
            cx="12"
            cy="16"
            r="6"
          ></circle>
          <ellipse class="icon--inner" cx="12" cy="16" rx="4" ry="3"></ellipse>
        </g>
      </svg>
      "
    `) // Let Vitest generate the snapshot
  })
})
