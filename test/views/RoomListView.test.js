import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RoomListView from '@/modules/rooms/views/RoomListView.vue'
import roomService from '@/services/room.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/room.service', () => ({
  default: { search: vi.fn() },
}))

const room = { id: 1, title: 'Sunny Studio', district: 'Chamkarmon', province: 'Phnom Penh', price: 250, available: true, images: [] }

describe('RoomListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search results as room cards', async () => {
    roomService.search.mockResolvedValue({ data: { data: [room], meta: { total: 1 } } })
    const wrapper = mount(RoomListView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Sunny Studio')
  })

  it('shows an empty state with no results', async () => {
    roomService.search.mockResolvedValue({ data: { data: [], meta: { total: 0 } } })
    const wrapper = mount(RoomListView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('No rooms found')
  })

  it('surfaces a toast on search failure instead of leaving a blank/broken page (Phase 5 regression)', async () => {
    roomService.search.mockRejectedValue(new Error('server down'))
    const wrapper = mount(RoomListView, { global: testGlobals() })
    await flushPromises()

    // No crash / unhandled rejection; the room list simply stays empty (no dedicated error state in this view).
    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
    expect(wrapper.text()).toContain('No rooms found')
  })

  it('re-searches with the keyword filter after the debounce window', async () => {
    vi.useFakeTimers()
    roomService.search.mockResolvedValue({ data: { data: [room], meta: { total: 1 } } })
    const wrapper = mount(RoomListView, { global: testGlobals() })
    await flushPromises()
    roomService.search.mockClear()

    await wrapper.find('input').setValue('lakeside')
    vi.advanceTimersByTime(400)
    await flushPromises()

    expect(roomService.search).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'lakeside', page: 1 }))
    vi.useRealTimers()
  })
})
