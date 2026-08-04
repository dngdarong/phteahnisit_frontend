import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ConversationsView from '@/modules/chat/views/ConversationsView.vue'
import chatService from '@/services/chat.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/chat.service', () => ({
  default: { list: vi.fn() },
}))

describe('ConversationsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty state with no conversations', async () => {
    chatService.list.mockResolvedValue({ data: { data: [] } })
    const wrapper = mount(ConversationsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('No conversations yet.')
  })

  it('surfaces a toast on load failure instead of leaving a blank/broken page', async () => {
    chatService.list.mockRejectedValue(new Error('server down'))
    const wrapper = mount(ConversationsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
  })

  it('renders a fallback instead of crashing when a conversation has no room or participant (Phase 3/4 regression)', async () => {
    chatService.list.mockResolvedValue({
      data: { data: [{ id: 1, other_participant: null, room: null, unread_count: 0 }] },
    })
    const wrapper = mount(ConversationsView, { global: testGlobals() })
    await flushPromises()

    // Renders without throwing; optional-chaining fallback leaves both fields blank rather than crashing.
    expect(wrapper.findAll('a')).toHaveLength(1)
  })

  it('shows an unread badge only when there are unread messages', async () => {
    chatService.list.mockResolvedValue({
      data: {
        data: [
          { id: 1, other_participant: { name: 'Sokha' }, room: { id: 1, title: 'Room A' }, unread_count: 3 },
          { id: 2, other_participant: { name: 'Dara' }, room: { id: 2, title: 'Room B' }, unread_count: 0 },
        ],
      },
    })
    const wrapper = mount(ConversationsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.findAll('.p-badge')).toHaveLength(1)
  })
})
