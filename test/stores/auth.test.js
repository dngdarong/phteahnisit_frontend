import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/auth.service'

vi.mock('@/services/auth.service', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    registerStudent: vi.fn(),
    registerLandlord: vi.fn(),
  },
}))

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts unauthenticated when localStorage is empty', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.role).toBeNull()
  })

  it('derives role-based getters from the persisted user', () => {
    localStorage.setItem('phteahnisit_user', JSON.stringify({ role: 'landlord' }))
    localStorage.setItem('phteahnisit_token', 'abc123')
    const store = useAuthStore()

    expect(store.isAuthenticated).toBe(true)
    expect(store.role).toBe('landlord')
    expect(store.isLandlord).toBe(true)
    expect(store.isAdmin).toBe(false)
    expect(store.isStudent).toBe(false)
  })

  it('setSession persists user and token to localStorage', () => {
    const store = useAuthStore()
    store.setSession({ id: 1, role: 'student' }, 'tok-1')

    expect(store.user).toEqual({ id: 1, role: 'student' })
    expect(store.token).toBe('tok-1')
    expect(JSON.parse(localStorage.getItem('phteahnisit_user'))).toEqual({ id: 1, role: 'student' })
    expect(localStorage.getItem('phteahnisit_token')).toBe('tok-1')
  })

  it('login calls the auth service and stores the returned session', async () => {
    authService.login.mockResolvedValue({ data: { user: { id: 2, role: 'admin' }, token: 'tok-2' } })
    const store = useAuthStore()

    const user = await store.login('a@b.com', 'secret')

    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'secret')
    expect(user).toEqual({ id: 2, role: 'admin' })
    expect(store.isAdmin).toBe(true)
  })

  it('logout clears local session even if the server call fails', async () => {
    authService.logout.mockRejectedValue(new Error('network down'))
    const store = useAuthStore()
    store.setSession({ id: 1, role: 'student' }, 'tok-1')

    await expect(store.logout()).rejects.toThrow('network down')

    // Regression guard: a failed logout request must not leave a stale session
    // behind (the `finally` block clearing state is the important behavior here).
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(localStorage.getItem('phteahnisit_token')).toBeNull()
  })

  it('refresh re-syncs the user from the backend, unwrapping a Resource envelope', async () => {
    authService.me.mockResolvedValue({ data: { data: { id: 1, role: 'student', name: 'Updated' } } })
    const store = useAuthStore()
    store.setSession({ id: 1, role: 'student', name: 'Old' }, 'tok-1')

    await store.refresh()

    expect(store.user).toEqual({ id: 1, role: 'student', name: 'Updated' })
  })

  it('refresh is a no-op when there is no token', async () => {
    const store = useAuthStore()
    await store.refresh()
    expect(authService.me).not.toHaveBeenCalled()
  })
})
