import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/StatusBadge.vue'
import { testGlobals } from '../helpers/mount'

describe('StatusBadge', () => {
  it.each(['pending', 'approved', 'rejected'])('renders the localized label for status "%s"', (status) => {
    const wrapper = mount(StatusBadge, { props: { status }, global: testGlobals() })
    expect(wrapper.text().length).toBeGreaterThan(0)
    expect(wrapper.classes().join(' ')).not.toContain('undefined')
  })

  it('falls back to the pending style for an unrecognized status instead of crashing', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'not-a-real-status' }, global: testGlobals() })
    expect(wrapper.html()).toContain('color-status-pending')
  })
})
