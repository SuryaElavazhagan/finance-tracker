import { describe, it, expect } from 'vitest'
import { v4 } from '../utils/uuid'

describe('v4', () => {
  it('returns a string', () => {
    expect(typeof v4()).toBe('string')
  })

  it('returns a valid UUID v4 format', () => {
    const uuid = v4()
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('generates unique values each call', () => {
    const a = v4()
    const b = v4()
    expect(a).not.toBe(b)
  })
})
