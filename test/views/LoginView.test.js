import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import LoginView from '@/modules/auth/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import { makeTestI18n, makeTestRouter, makeTestPrimeVuePlugin } from '../helpers/mount'

function mountLogin() {
  const router = makeTestRouter()
  const pinia = createTestingPinia({ stubActions: false })
  const wrapper = mount(LoginView, {
    global: { plugins: [makeTestI18n(), router, pinia, makeTestPrimeVuePlugin()] },
  })
  return { wrapper, router, auth: useAuthStore(pinia) }
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in and redirects to home on success', async () => {
    const { wrapper, router, auth } = mountLogin()
    auth.login = vi.fn().mockResolvedValue({ id: 1, role: 'student' })
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('input[type="email"]').setValue('student@test.com')
    await wrapper.find('input[type="password"]').setValue('secret123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(auth.login).toHaveBeenCalledWith('student@test.com', 'secret123')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'home' })
    expect(wrapper.find('.p-message').exists()).toBe(false)
  })

  it('redirects to the ?redirect= query target instead of home when present', async () => {
    const router = makeTestRouter()
    await router.push({ name: 'login', query: { redirect: '/rooms/5' } })
    await router.isReady()
    const pinia = createTestingPinia({ stubActions: false })
    const wrapper = mount(LoginView, { global: { plugins: [makeTestI18n(), router, pinia, makeTestPrimeVuePlugin()] } })
    const auth = useAuthStore(pinia)
    auth.login = vi.fn().mockResolvedValue({ id: 1 })
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('input[type="email"]').setValue('a@b.com')
    await wrapper.find('input[type="password"]').setValue('secret123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith('/rooms/5')
  })

  it('shows the backend validation message on a 422/401-style failure instead of failing silently', async () => {
    const { wrapper, auth } = mountLogin()
    auth.login = vi.fn().mockRejectedValue({
      response: { status: 422, data: { message: 'These credentials do not match our records.' } },
    })

    await wrapper.find('input[type="email"]').setValue('wrong@test.com')
    await wrapper.find('input[type="password"]').setValue('bad')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('These credentials do not match our records.')
  })

  it('falls back to a generic message when the backend error has no message field', async () => {
    const { wrapper, auth } = mountLogin()
    auth.login = vi.fn().mockRejectedValue(new Error('network down'))

    await wrapper.find('input[type="email"]').setValue('a@b.com')
    await wrapper.find('input[type="password"]').setValue('secret123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Login failed. Check your credentials.')
  })
})
