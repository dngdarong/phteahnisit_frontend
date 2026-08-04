import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import RegisterForm from '@/modules/auth/RegisterForm.vue'
import { useAuthStore } from '@/stores/auth'
import { makeTestI18n, makeTestRouter, makeTestPrimeVuePlugin } from '../helpers/mount'

function mountRegister(role) {
  const router = makeTestRouter()
  const pinia = createTestingPinia({ stubActions: false })
  const wrapper = mount(RegisterForm, {
    props: { role },
    global: { plugins: [makeTestI18n(), router, pinia, makeTestPrimeVuePlugin()] },
  })
  return { wrapper, router, auth: useAuthStore(pinia) }
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a student and redirects to login on success', async () => {
    const { wrapper, router, auth } = mountRegister('student')
    auth.registerStudent = vi.fn().mockResolvedValue({})
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('input[type="email"]').setValue('student@test.com')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(auth.registerStudent).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith({ name: 'login' })
  })

  it('calls registerLandlord (not registerStudent) when role="landlord"', async () => {
    const { wrapper, auth } = mountRegister('landlord')
    auth.registerLandlord = vi.fn().mockResolvedValue({})
    auth.registerStudent = vi.fn()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(auth.registerLandlord).toHaveBeenCalled()
    expect(auth.registerStudent).not.toHaveBeenCalled()
  })

  it('surfaces field-level validation errors from a 422 response (Phase 4 API-shape regression)', async () => {
    const { wrapper, auth } = mountRegister('student')
    auth.registerStudent = vi.fn().mockRejectedValue({
      response: { status: 422, data: { errors: { email: ['The email has already been taken.'] } } },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('The email has already been taken.')
  })

  it('falls back to a general error message on a non-422 failure', async () => {
    const { wrapper, auth } = mountRegister('student')
    auth.registerStudent = vi.fn().mockRejectedValue(new Error('network down'))

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Registration failed.')
  })
})
