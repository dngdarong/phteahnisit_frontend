import { describe, it, expect, beforeEach } from 'vitest'
import api from '@/services/api'

// api.js wires two interceptors directly onto the shared axios instance rather
// than exposing them as named exports, so we reach into axios's internal
// handlers array to exercise them without a real HTTP round-trip. This is the
// standard way to unit-test axios interceptors in isolation.
const requestInterceptor = api.interceptors.request.handlers[0].fulfilled
const responseRejected = api.interceptors.response.handlers[0].rejected
const responseFulfilled = api.interceptors.response.handlers[0].fulfilled

describe('api service (axios instance)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('attaches a Bearer token header when one is present', () => {
    localStorage.setItem('phteahnisit_token', 'tok-abc')
    const config = requestInterceptor({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer tok-abc')
  })

  it('does not add an Authorization header when unauthenticated', () => {
    const config = requestInterceptor({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('passes successful responses through unchanged', () => {
    const response = { status: 200, data: { data: [] } }
    expect(responseFulfilled(response)).toBe(response)
  })

  it('clears the local session on a 401 response (disabled/expired-token case)', async () => {
    localStorage.setItem('phteahnisit_token', 'tok-abc')
    localStorage.setItem('phteahnisit_user', JSON.stringify({ id: 1 }))
    const error = { response: { status: 401, data: { message: 'Unauthenticated.' } } }

    await expect(responseRejected(error)).rejects.toBe(error)

    expect(localStorage.getItem('phteahnisit_token')).toBeNull()
    expect(localStorage.getItem('phteahnisit_user')).toBeNull()
  })

  it('leaves the local session untouched on a non-401 error (e.g. a 422 validation error)', async () => {
    localStorage.setItem('phteahnisit_token', 'tok-abc')
    localStorage.setItem('phteahnisit_user', JSON.stringify({ id: 1 }))
    const error = { response: { status: 422, data: { message: 'The given data was invalid.', errors: { email: ['required'] } } } }

    await expect(responseRejected(error)).rejects.toBe(error)

    expect(localStorage.getItem('phteahnisit_token')).toBe('tok-abc')
  })

  it('does not crash on a network error with no response object at all', async () => {
    const error = { message: 'Network Error' }
    await expect(responseRejected(error)).rejects.toBe(error)
  })

  it.each([403, 404, 500])('leaves the local session untouched on a %i response', async (status) => {
    localStorage.setItem('phteahnisit_token', 'tok-abc')
    localStorage.setItem('phteahnisit_user', JSON.stringify({ id: 1 }))
    const error = { response: { status, data: { message: 'error' } } }

    await expect(responseRejected(error)).rejects.toBe(error)

    expect(localStorage.getItem('phteahnisit_token')).toBe('tok-abc')
  })

  it.each([403, 404, 422, 500])('propagates the original error object unchanged for a %i response (no shape rewriting)', async (status) => {
    const error = { response: { status, data: { message: 'error', errors: { field: ['bad'] } } } }
    await expect(responseRejected(error)).rejects.toBe(error)
  })
})
