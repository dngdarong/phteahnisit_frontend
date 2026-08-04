import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ProfileView from '@/modules/profile/views/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { makeTestI18n, makeTestRouter, makeTestPrimeVuePlugin } from '../helpers/mount'

vi.mock('@/services/api', () => ({
  default: { put: vi.fn() },
}))

function mountProfile(user = { id: 1, name: 'Sokha', email: 'sokha@test.com', phone: '012345678' }) {
  const pinia = createTestingPinia({ stubActions: false, initialState: { auth: { user, token: 'tok-1' } } })
  const wrapper = mount(ProfileView, {
    global: { plugins: [makeTestI18n(), makeTestRouter(), pinia, makeTestPrimeVuePlugin()] },
  })
  return { wrapper, auth: useAuthStore(pinia) }
}

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('pre-fills the form from the current session user', async () => {
    const { wrapper } = mountProfile()
    await flushPromises()
    expect(wrapper.find('input[type="email"]').element.value).toBe('sokha@test.com')
  })

  it('saves profile changes and updates the local session (Phase 6 auth-store regression)', async () => {
    api.put.mockResolvedValue({ data: { data: { id: 1, name: 'Sokha Updated', email: 'sokha@test.com', phone: '012345678' } } })
    const { wrapper, auth } = mountProfile()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(api.put).toHaveBeenCalledWith('/profile', expect.objectContaining({ name: 'Sokha' }))
    expect(auth.user.name).toBe('Sokha Updated')
    expect(JSON.parse(localStorage.getItem('phteahnisit_user')).name).toBe('Sokha Updated')
  })

  it('surfaces field-level validation errors from a 422 response (Phase 4 API-shape regression)', async () => {
    api.put.mockRejectedValue({ response: { status: 422, data: { errors: { email: ['This email is already taken.'] } } } })
    const { wrapper } = mountProfile()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('This email is already taken.')
  })

  it('falls back to a general error message on a non-422 failure', async () => {
    api.put.mockRejectedValue(new Error('network down'))
    const { wrapper } = mountProfile()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Update failed.')
  })
})
