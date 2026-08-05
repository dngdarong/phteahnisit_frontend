import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { makeTestI18n, makeTestRouter, makeTestPrimeVuePlugin } from '../helpers/mount'

function mountHeader(user) {
  const pinia = createTestingPinia({
    stubActions: false,
    initialState: user ? { auth: { user, token: 'tok-1' } } : { auth: { user: null, token: null } },
  })
  return mount(AppHeader, {
    global: { plugins: [makeTestI18n(), makeTestRouter(), pinia, makeTestPrimeVuePlugin()] },
  })
}

describe('AppHeader', () => {
  it('shows login/register links for a guest', () => {
    const wrapper = mountHeader(null)
    expect(wrapper.text()).toContain('Log in')
    expect(wrapper.text()).toContain('Sign up as landlord')
  })

  it('shows the "post a room" shortcut for an authenticated landlord', () => {
    const wrapper = mountHeader({ id: 1, role: 'landlord', name: 'Bora' })
    expect(wrapper.text()).toContain('Post a room')
    expect(wrapper.text()).not.toContain('Log in')
  })

  it('includes role-specific menu items for a landlord vs. a student', () => {
    const auth = useAuthStore(createTestingPinia({ stubActions: false, initialState: { auth: { user: { role: 'student' }, token: 'tok-1' } } }))
    expect(auth.isStudent).toBe(true)

    const wrapper = mountHeader({ id: 1, role: 'landlord', name: 'Bora' })
    const menu = wrapper.findComponent({ name: 'Menu' })
    const labels = menu.props('model').map((item) => item.label)
    expect(labels).toContain('My rooms')
    expect(labels).toContain('Booking requests')
    expect(labels).not.toContain('My bookings') // landlord, not student
  })
})
