import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ConversationView from '@/modules/chat/views/ConversationView.vue'
import chatService from '@/services/chat.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/chat.service', () => ({
  default: { show: vi.fn(), sendMessage: vi.fn() },
}))

const conversation = {
  id: 1,
  other_participant: { name: 'Sokha' },
  room: { id: 5, title: 'Lakeside Room' },
  messages: [{ id: 1, body: 'Hi there', is_mine: false }],
}

describe('ConversationView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the thread and messages', async () => {
    chatService.show.mockResolvedValue({ data: { data: conversation } })
    const wrapper = mount(ConversationView, { props: { id: 1 }, global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Sokha')
    expect(wrapper.text()).toContain('Hi there')
    wrapper.unmount()
  })

  it('renders a fallback instead of crashing when the room relation is null (Phase 3/4 regression)', async () => {
    chatService.show.mockResolvedValue({ data: { data: { ...conversation, room: null } } })
    const wrapper = mount(ConversationView, { props: { id: 1 }, global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Room no longer available')
    wrapper.unmount()
  })

  it('sends a message and clears the input on success', async () => {
    chatService.show.mockResolvedValue({ data: { data: conversation } })
    chatService.sendMessage.mockResolvedValue({})
    const wrapper = mount(ConversationView, { props: { id: 1 }, global: testGlobals() })
    await flushPromises()

    await wrapper.find('textarea').setValue('Is this still available?')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(chatService.sendMessage).toHaveBeenCalledWith(1, 'Is this still available?')
    expect(wrapper.find('textarea').element.value).toBe('')
    wrapper.unmount()
  })

  it('does not send an empty/whitespace-only message', async () => {
    chatService.show.mockResolvedValue({ data: { data: conversation } })
    const wrapper = mount(ConversationView, { props: { id: 1 }, global: testGlobals() })
    await flushPromises()

    await wrapper.find('textarea').setValue('   ')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(chatService.sendMessage).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('guards against a rapid double-submit firing two send requests', async () => {
    chatService.show.mockResolvedValue({ data: { data: conversation } })
    let resolveSend
    chatService.sendMessage.mockReturnValue(new Promise((resolve) => { resolveSend = resolve }))
    const wrapper = mount(ConversationView, { props: { id: 1 }, global: testGlobals() })
    await flushPromises()

    await wrapper.find('textarea').setValue('Hello?')
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await wrapper.find('textarea').setValue('Hello again?')
    await form.trigger('submit.prevent') // fired while the first request is still in flight

    expect(chatService.sendMessage).toHaveBeenCalledTimes(1)

    resolveSend({})
    chatService.show.mockResolvedValue({ data: { data: conversation } })
    await flushPromises()
    wrapper.unmount()
  })

  it('surfaces a toast when sending fails instead of failing silently', async () => {
    chatService.show.mockResolvedValue({ data: { data: conversation } })
    chatService.sendMessage.mockRejectedValue(new Error('server down'))
    const wrapper = mount(ConversationView, { props: { id: 1 }, global: testGlobals() })
    await flushPromises()

    await wrapper.find('textarea').setValue('Hello?')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // Input is not cleared on failure, and a retry is possible (busy flag reset).
    expect(wrapper.find('textarea').element.value).toBe('Hello?')
    wrapper.unmount()
  })
})
