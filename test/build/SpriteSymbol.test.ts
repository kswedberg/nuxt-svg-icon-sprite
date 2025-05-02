import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SpriteSymbol } from '~/src/build/SpriteSymbol'
import { parse } from 'node-html-parser'
import path from 'node:path'
import { promises as fs } from 'node:fs'

// Mock dependencies
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}))

vi.mock('node-html-parser', () => ({
  parse: vi.fn(),
}))

// Helper function to create a mock HTML element
function createMockSvgElement(attributes = {}, innerHTML = '') {
  return {
    attributes,
    innerHTML,
    querySelector: vi.fn().mockReturnThis(),
  }
}

describe('SpriteSymbol', () => {
  // Test variables
  const testFilePath = '/path/to/icon.svg'
  const fileName = 'icon'
  const validId = `${fileName}`
  const basicConfig = { processSpriteSymbol: undefined }

  beforeEach(() => {
    vi.resetAllMocks()

    // Mock path.parse
    vi.spyOn(path, 'parse').mockReturnValue({
      name: fileName,
      root: '/',
      dir: '/path/to',
      base: 'icon.svg',
      ext: '.svg',
    } as path.ParsedPath)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should correctly initialize with basic config', () => {
      const symbol = new SpriteSymbol(testFilePath, basicConfig)

      expect(symbol.id).toBe(validId)
      expect(symbol.filePath).toBe(testFilePath)
      expect(symbol.config).toBe(basicConfig)
      expect(symbol.processors).toEqual([])
      expect(symbol.processed).toBeNull()
    })

    it('should handle single processor function', () => {
      const processor = vi.fn()
      const config = { processSpriteSymbol: processor }

      const symbol = new SpriteSymbol(testFilePath, config)

      expect(symbol.processors).toEqual([processor])
    })

    it('should handle array of processor functions', () => {
      const processor1 = vi.fn()
      const processor2 = vi.fn()
      const config = { processSpriteSymbol: [processor1, processor2] }

      const symbol = new SpriteSymbol(testFilePath, config)

      expect(symbol.processors).toEqual([processor1, processor2])
    })
  })

  describe('reset', () => {
    it('should set processed to null', async () => {
      const symbol = new SpriteSymbol(testFilePath, basicConfig)

      // Set processed to a value
      symbol.processed = Promise.resolve({ attributes: {}, symbolDom: '' })

      symbol.reset()

      expect(symbol.processed).toBeNull()
    })
  })

  describe('getProcessed', () => {
    const validSvgContent =
      '<svg width="24" height="24"><path d="M1 1"></path></svg>'
    const mockSvgElement = createMockSvgElement(
      { width: '24', height: '24' },
      '<path d="M1 1"></path>',
    )

    beforeEach(() => {
      // Setup default mocks
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from(validSvgContent))
      vi.mocked(parse).mockReturnValue({
        querySelector: vi.fn().mockReturnValue(mockSvgElement),
      } as any)
    })

    it('should return the cached processed result if available', async () => {
      const symbol = new SpriteSymbol(testFilePath, basicConfig)
      const mockResult = {
        attributes: { id: validId },
        symbolDom: '<path></path>',
      }

      // Set a mock processed value
      symbol.processed = Promise.resolve(mockResult)

      const result = await symbol.getProcessed()

      expect(result).toBe(mockResult)
      expect(fs.readFile).not.toHaveBeenCalled()
      expect(parse).not.toHaveBeenCalled()
    })

    it('should process a valid SVG file', async () => {
      const symbol = new SpriteSymbol(testFilePath, basicConfig)

      const result = await symbol.getProcessed()

      expect(fs.readFile).toHaveBeenCalledWith(testFilePath)
      expect(parse).toHaveBeenCalledWith(validSvgContent)
      expect(result).toEqual({
        attributes: {
          width: '24',
          height: '24',
          id: validId,
        },
        symbolDom: '<path d="M1 1"></path>',
      })
    })

    it('should run all processors on the SVG element', async () => {
      const processor1 = vi.fn().mockResolvedValue(undefined)
      const processor2 = vi.fn().mockResolvedValue(undefined)
      const config = { processSpriteSymbol: [processor1, processor2] }

      const symbol = new SpriteSymbol(testFilePath, config)

      await symbol.getProcessed()

      expect(processor1).toHaveBeenCalledWith(mockSvgElement, {
        id: validId,
        filePath: testFilePath,
      })
      expect(processor2).toHaveBeenCalledWith(mockSvgElement, {
        id: validId,
        filePath: testFilePath,
      })
    })

    it('should throw an error for empty SVG file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('  '))

      const symbol = new SpriteSymbol(testFilePath, basicConfig)

      const result = await symbol.getProcessed()

      expect(result).toBeNull()
    })

    it('should throw an error for invalid SVG file (no <svg> tag)', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        Buffer.from('<div>Not an SVG</div>'),
      )

      const symbol = new SpriteSymbol(testFilePath, basicConfig)

      const result = await symbol.getProcessed()

      expect(result).toBeNull()
    })

    it('should throw an error when SVG element not found', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('<svg></svg>'))
      vi.mocked(parse).mockReturnValue({
        querySelector: vi.fn().mockReturnValue(null),
      } as any)

      const symbol = new SpriteSymbol(testFilePath, basicConfig)

      const result = await symbol.getProcessed()

      expect(result).toBeNull()
    })

    it('should return null on file read error', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      const symbol = new SpriteSymbol(testFilePath, basicConfig)

      const result = await symbol.getProcessed()

      expect(result).toBeNull()
    })
  })
})
