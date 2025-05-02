import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hash } from 'ohash'
import { HTMLElement } from 'node-html-parser'
import * as nuxtKit from '@nuxt/kit'
import { Sprite } from '~/src/build/Sprite'
import { promises as fs } from 'node:fs'
import type { ModuleContext } from '~/src/build/types'
import type { SpriteSymbol } from '~/src/build/SpriteSymbol'
import { logger } from '~/src/build/utils'

type MockSymbol = {
  id: string
  filePath?: string
  getProcessed?: () => any
  reset?: () => any
}

function mockSymbols(symbols: MockSymbol[]): SpriteSymbol[] {
  return symbols as unknown[] as SpriteSymbol[]
}

vi.mock('@nuxt/kit', async () => {
  const actual = await vi.importActual('@nuxt/kit')
  return {
    ...actual,
    resolveFiles: vi.fn(),
    resolvePath: vi.fn(),
  }
})

// Mock fs to avoid file system operations.
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}))

// Mock SpriteSymbol.
vi.mock('./SpriteSymbol', () => ({
  SpriteSymbol: vi.fn().mockImplementation((filePath, config) => {
    const fileName = filePath.split('/').pop()?.split('.')[0] || 'unknown'
    return {
      id: fileName,
      filePath,
      config,
      processed: null,
      reset: vi.fn(),
      getProcessed: vi.fn().mockResolvedValue({
        attributes: { width: '24', height: '24', viewBox: '0 0 24 24' },
        symbolDom: `<path d="Mock SVG content for ${fileName}"></path>`,
      }),
    }
  }),
}))

describe('Sprite', () => {
  // Test fixtures.
  const mockContext: ModuleContext = {
    dev: true,
    srcDir: '/mock/src',
    buildAssetsDir: '/mock/assets',
    runtimeOptions: {
      ariaHidden: true,
    },
    buildResolver: vi.fn() as unknown as ModuleContext['buildResolver'],
  }

  const mockConfig = {
    importPatterns: ['**/*.svg'],
    symbolFiles: {
      customIcon: '/path/to/custom.svg',
    },
  }

  // Mock file paths.
  const mockFilePaths = [
    '/mock/src/icons/icon1.svg',
    '/mock/src/icons/icon2.svg',
  ]

  // Mock SVG content
  const mockSvgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
    </svg>
  `

  beforeEach(() => {
    vi.resetAllMocks()

    // Setup resolveFiles mock
    vi.mocked(nuxtKit.resolveFiles).mockResolvedValue(mockFilePaths)

    // Setup resolvePath mock
    vi.mocked(nuxtKit.resolvePath).mockImplementation((pathToResolve) =>
      Promise.resolve(
        typeof pathToResolve === 'string' ? pathToResolve : '/resolved/path',
      ),
    )

    // Setup fs.readFile mock
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from(mockSvgContent))
  })

  it('should initialize with correct properties', () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    expect(sprite.name).toBe('default')
    expect(sprite.config).toEqual(mockConfig)
    expect(sprite.context).toEqual(mockContext)
    expect(sprite.generatedSprite).toBeNull()
    expect(sprite.hash).toBeNull()
  })

  it('should initialize processors based on config', () => {
    const configWithSingleProcessor = {
      ...mockConfig,
      processSprite: vi.fn(),
    }

    const configWithMultipleProcessors = {
      ...mockConfig,
      processSprite: [vi.fn(), vi.fn()],
    }

    const spriteWithSingleProcessor = new Sprite(
      'default',
      configWithSingleProcessor,
      mockContext,
    )
    const spriteWithMultipleProcessors = new Sprite(
      'default',
      configWithMultipleProcessors,
      mockContext,
    )
    const spriteWithoutProcessors = new Sprite(
      'default',
      mockConfig,
      mockContext,
    )

    expect(spriteWithSingleProcessor['processors']).toHaveLength(1)
    expect(spriteWithMultipleProcessors['processors']).toHaveLength(2)
    expect(spriteWithoutProcessors['processors']).toHaveLength(0)
  })

  it('should reset generated sprite and hash', () => {
    const sprite = new Sprite('default', mockConfig, mockContext)
    sprite.generatedSprite = 'mock-sprite'
    sprite.hash = 'mock-hash'

    sprite.reset()

    expect(sprite.generatedSprite).toBeNull()
    expect(sprite.hash).toBeNull()
  })

  it('should get sprite file name with hash', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Mock getSprite to return a fixed hash.
    vi.spyOn(sprite, 'getSprite').mockResolvedValue({
      content: 'mock-sprite-content',
      hash: 'abc123',
    })

    const fileName = await sprite.getSpriteFileName()
    expect(fileName).toBe('nuxt-svg-icon-sprite/sprite-default.abc123.svg')
  })

  it('should get prefix based on name', () => {
    const defaultSprite = new Sprite('default', mockConfig, mockContext)
    const customSprite = new Sprite('custom', mockConfig, mockContext)

    expect(defaultSprite.getPrefix()).toBe('')
    expect(customSprite.getPrefix()).toBe('custom/')
  })

  it('should get import pattern files when configured', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    const files = await sprite['getImportPatternFiles']()

    expect(nuxtKit.resolveFiles).toHaveBeenCalledWith(
      mockContext.srcDir,
      mockConfig.importPatterns,
      { followSymbolicLinks: false },
    )
    expect(files).toEqual(mockFilePaths)
  })

  it('should return empty array when no import patterns', async () => {
    const configWithoutPatterns = { ...mockConfig, importPatterns: undefined }
    const sprite = new Sprite('default', configWithoutPatterns, mockContext)

    const files = await sprite['getImportPatternFiles']()

    expect(nuxtKit.resolveFiles).not.toHaveBeenCalled()
    expect(files).toEqual([])
  })

  it('should initialize sprite with symbols from import patterns and symbol files', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    await sprite.init()

    // Should create SpriteSymbol instances for each file.
    expect(sprite['symbols']).toHaveLength(
      mockFilePaths.length + Object.keys(mockConfig.symbolFiles!).length,
    )
  })

  it('should log error when no symbols found', async () => {
    vi.mocked(nuxtKit.resolveFiles).mockResolvedValue([])
    const configWithoutSymbols = { ...mockConfig, symbolFiles: undefined }
    const sprite = new Sprite('default', configWithoutSymbols, mockContext)
    const loggerSpy = vi.spyOn(logger, 'error')

    await sprite.init()

    expect(loggerSpy).toHaveBeenCalledWith(
      'No SVG files found in specified importPatterns.',
    )
  })

  it('should get processed symbols sorted by ID', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Create symbols with specific IDs in reverse order.
    sprite['symbols'] = mockSymbols([
      {
        id: 'z-icon',
        getProcessed: vi
          .fn()
          .mockResolvedValue({ attributes: {}, symbolDom: '' }),
      },
      {
        id: 'a-icon',
        getProcessed: vi
          .fn()
          .mockResolvedValue({ attributes: {}, symbolDom: '' }),
      },
      {
        id: 'm-icon',
        getProcessed: vi
          .fn()
          .mockResolvedValue({ attributes: {}, symbolDom: '' }),
      },
    ])

    const processedSymbols = await sprite.getProcessedSymbols()

    // Should be sorted alphabetically by id.
    expect(processedSymbols.map((ps) => ps.symbol.id)).toEqual([
      'a-icon',
      'm-icon',
      'z-icon',
    ])
  })

  it('should filter out symbols with null processed data', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Create symbols where some return null.
    sprite['symbols'] = mockSymbols([
      { id: 'icon1', getProcessed: vi.fn().mockResolvedValue(null) },
      {
        id: 'icon2',
        getProcessed: vi
          .fn()
          .mockResolvedValue({ attributes: {}, symbolDom: '' }),
      },
      { id: 'icon3', getProcessed: vi.fn().mockResolvedValue(null) },
    ])

    const processedSymbols = await sprite.getProcessedSymbols()

    // Should only include symbols with non-null processed data.
    expect(processedSymbols).toHaveLength(1)
    expect(processedSymbols[0].symbol.id).toBe('icon2')
  })

  it('should generate sprite SVG with symbols', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Setup sprite with symbols.
    sprite['symbols'] = mockSymbols([
      {
        id: 'icon1',
        filePath: '/mock/src/icons/icon1.svg',
        getProcessed: vi.fn().mockResolvedValue({
          attributes: { width: '24', height: '24', viewBox: '0 0 24 24' },
          symbolDom: '<path d="M1 1h22v22H1z" />',
        }),
      },
      {
        id: 'icon2',
        filePath: '/mock/src/icons/icon2.svg',
        getProcessed: vi.fn().mockResolvedValue({
          attributes: { width: '16', height: '16', viewBox: '0 0 16 16' },
          symbolDom: '<circle cx="8" cy="8" r="7"></circle>',
        }),
      },
    ])

    const { content, hash: spriteHash } = await sprite.getSprite()

    // Use toMatchInlineSnapshot for generated content.
    expect(content).toMatchInlineSnapshot(`
      "<svg xmlns="http://www.w3.org/2000/svg" version="1.1"><defs>

      <!-- File: /mock/src/icons/icon1.svg -->
      <symbol width="24" height="24" viewBox="0 0 24 24" id="icon1"><path d="M1 1h22v22H1z" ></path></symbol>

      <!-- File: /mock/src/icons/icon2.svg -->
      <symbol width="16" height="16" viewBox="0 0 16 16" id="icon2"><circle cx="8" cy="8" r="7"></circle></symbol></defs></svg>"
    `)

    // Verify hash was generated using ohash.
    expect(spriteHash).toBe(hash(content))
    expect(sprite.hash).toBe(spriteHash)
    expect(sprite.generatedSprite).toBe(content)
  })

  it('should run processors on sprite', async () => {
    const processor1 = vi.fn()
    const processor2 = vi.fn()

    const configWithProcessors = {
      ...mockConfig,
      processSprite: [processor1, processor2],
    }

    const sprite = new Sprite('default', configWithProcessors, mockContext)

    // Setup sprite with symbols.
    sprite['symbols'] = mockSymbols([
      {
        id: 'test-icon',
        filePath: '/mock/src/icons/test-icon.svg',
        getProcessed: vi.fn().mockResolvedValue({
          attributes: { viewBox: '0 0 24 24' },
          symbolDom: '<path d="M1 1h22v22H1z" />',
        }),
      },
    ])

    await sprite.getSprite()

    // Verify processors were called.
    expect(processor1).toHaveBeenCalled()
    expect(processor2).toHaveBeenCalled()

    // Verify processor was called with SVG element and context.
    expect(processor1.mock.calls[0][0]).toBeInstanceOf(HTMLElement)
    expect(processor1.mock.calls[0][1]).toEqual({ id: 'default' })
  })

  it('should cache generated sprite and hash', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Setup sprite with symbols.
    sprite['symbols'] = mockSymbols([
      {
        id: 'test-icon',
        filePath: '/mock/src/icons/test-icon.svg',
        getProcessed: vi.fn().mockResolvedValue({
          attributes: { viewBox: '0 0 24 24' },
          symbolDom: '<path d="M1 1h22v22H1z" />',
        }),
      },
    ])

    // First call should generate the sprite.
    const firstResult = await sprite.getSprite()

    // Mock getProcessedSymbols to verify it's not called again.
    const getProcessedSymbolsSpy = vi.spyOn(sprite, 'getProcessedSymbols')

    // Second call should use cached values.
    const secondResult = await sprite.getSprite()

    // Verify the results are the same.
    expect(secondResult).toEqual(firstResult)

    // Verify getProcessedSymbols was not called again.
    expect(getProcessedSymbolsSpy).not.toHaveBeenCalled()
  })

  it('should generate a new sprite after reset', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Setup sprite with symbols.
    sprite['symbols'] = mockSymbols([
      {
        id: 'test-icon',
        filePath: '/mock/src/icons/test-icon.svg',
        getProcessed: vi.fn().mockResolvedValue({
          attributes: { viewBox: '0 0 24 24' },
          symbolDom: '<path d="M1 1h22v22H1z" />',
        }),
      },
    ])

    // First call should generate the sprite.
    await sprite.getSprite()

    // Reset the sprite.
    sprite.reset()

    // Mock getProcessedSymbols to verify it's called again.
    const getProcessedSymbolsSpy = vi.spyOn(sprite, 'getProcessedSymbols')

    // Second call should generate a new sprite.
    await sprite.getSprite()

    // Verify getProcessedSymbols was called again.
    expect(getProcessedSymbolsSpy).toHaveBeenCalled()
  })

  it('should handle add event when file matches import patterns', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)
    const newFilePath = '/mock/src/icons/new-icon.svg'

    // Mock getImportPatternFiles to include the new file.
    vi.mocked(nuxtKit.resolveFiles)
      .mockResolvedValueOnce(mockFilePaths)
      .mockResolvedValueOnce([...mockFilePaths, newFilePath])

    await sprite.init()

    const initialSymbolCount = sprite['symbols'].length
    const resetSpy = vi.spyOn(sprite, 'reset')

    // Add a new file that matches the import patterns.
    await sprite.handleAdd(newFilePath)

    // Should add a new symbol and reset the sprite.
    expect(sprite['symbols']).toHaveLength(initialSymbolCount + 1)
    expect(resetSpy).toHaveBeenCalled()
  })

  it('should handle change event for existing file', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Initialize with symbols.
    await sprite.init()

    // Mock a symbol's filePath to match the one we'll change.
    sprite['symbols'][0].filePath = mockFilePaths[0]

    const symbolResetSpy = vi.spyOn(sprite['symbols'][0], 'reset')
    const spriteResetSpy = vi.spyOn(sprite, 'reset')

    // Trigger change event.
    await sprite.handleChange(mockFilePaths[0])

    // Should reset the symbol and the sprite.
    expect(symbolResetSpy).toHaveBeenCalled()
    expect(spriteResetSpy).toHaveBeenCalled()
  })

  it('should handle unlink event for existing file', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Initialize with symbols.
    await sprite.init()

    // Mock a symbol's filePath and id to match the one we'll unlink.
    sprite['symbols'][0].filePath = mockFilePaths[0]
    sprite['symbols'][0].id = 'icon1'

    const initialSymbolCount = sprite['symbols'].length
    const resetSpy = vi.spyOn(sprite, 'reset')

    // Trigger unlink event.
    await sprite.handleUnlink(mockFilePaths[0])

    // Should remove the symbol and reset the sprite.
    expect(sprite['symbols']).toHaveLength(initialSymbolCount - 1)
    expect(sprite['symbols'].find((s) => s.id === 'icon1')).toBeUndefined()
    expect(resetSpy).toHaveBeenCalled()
  })

  it('should handle add directory event', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Start with no symbols.
    sprite['symbols'] = []

    const resetSpy = vi.spyOn(sprite, 'reset')

    // Trigger addDir event.
    await sprite.handleAddDir()

    // Should add symbols for all files in import patterns.
    expect(sprite['symbols']).toHaveLength(mockFilePaths.length)
    expect(resetSpy).toHaveBeenCalled()
  })

  it('should handle unlink directory event', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Start with symbols in the directory to be removed.
    sprite['symbols'] = mockSymbols([
      {
        id: 'icon1',
        filePath: '/mock/src/icons/subdir/icon1.svg',
        reset: vi.fn(),
      },
      {
        id: 'icon2',
        filePath: '/mock/src/icons/subdir/icon2.svg',
        reset: vi.fn(),
      },
      {
        id: 'icon3',
        filePath: '/mock/src/icons/other/icon3.svg',
        reset: vi.fn(),
      },
    ])

    const resetSpy = vi.spyOn(sprite, 'reset')

    // Trigger unlinkDir event.
    await sprite.handleUnlinkDir('/mock/src/icons/subdir')

    expect(
      sprite['symbols'].every((s) =>
        s.filePath.includes('/mock/src/icons/subdir'),
      ),
    ).toBe(false)
    expect(resetSpy).toHaveBeenCalled()
  })

  it('should use ohash to generate sprite hash', async () => {
    const sprite = new Sprite('default', mockConfig, mockContext)

    // Setup sprite with minimal symbols.
    sprite['symbols'] = mockSymbols([
      {
        id: 'test-icon',
        filePath: '/mock/src/icons/test-icon.svg',
        getProcessed: vi.fn().mockResolvedValue({
          attributes: { viewBox: '0 0 24 24' },
          symbolDom: '<path d="M1 1h22v22H1z" />',
        }),
      },
    ])

    const { content, hash: spriteHash } = await sprite.getSprite()

    const calculatedHash = hash(content)
    expect(spriteHash).toBe(calculatedHash)
    expect(sprite.hash).toBe(calculatedHash)
  })
})
