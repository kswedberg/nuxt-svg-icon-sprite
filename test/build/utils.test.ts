import { describe, it, expect } from 'vitest'
import { toValidId } from '~/src/build/utils'

describe('toValidId', () => {
  it('returns the same string if already valid', () => {
    expect(toValidId('validId_123')).toBe('validId_123')
  })

  it('trims whitespace and replaces invalid chars with hyphens, collapsing multiples and removing trailing hyphens', () => {
    const input = '  Hello World!  '
    const result = toValidId(input)
    expect(result).toBe('Hello-World')
  })

  it('collapses multiple invalid characters into a single hyphen', () => {
    const input = 'foo///bar'
    const result = toValidId(input)
    expect(result).toBe('foo-bar')
  })

  it('prefixes with id- when starting with a digit', () => {
    expect(toValidId('123abc')).toBe('id-123abc')
  })

  it('prefixes with id- when starting with a hyphen', () => {
    expect(toValidId('-abc')).toBe('id--abc')
  })

  it('throws an error when input is empty or becomes empty after sanitization', () => {
    expect(() => toValidId('')).toThrow('Failed to generate ID for symbol.')
    expect(() => toValidId('   ')).toThrow('Failed to generate ID for symbol.')
  })

  it('truncates strings longer than the max length of 64', () => {
    const long = 'a'.repeat(70)
    const result = toValidId(long)
    expect(result.length).toBe(64)
    expect(result).toBe('a'.repeat(64))
  })

  it('ensures no trailing hyphen after truncation', () => {
    const input = 'a'.repeat(63) + '!'
    const result = toValidId(input)
    expect(result).toBe('a'.repeat(63))
  })

  it('handles complex mixed input', () => {
    const input = '   123--###Hello**World!!   '
    const result = toValidId(input)
    expect(result).toBe('id-123-Hello-World')
  })
})
