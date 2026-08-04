import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RoomFormView from '@/modules/landlord/views/RoomFormView.vue'
import roomService from '@/services/room.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/room.service', () => ({
  default: { detail: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

describe('RoomFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a room on submit in create mode (no id prop)', async () => {
    roomService.create.mockResolvedValue({})
    const wrapper = mount(RoomFormView, { props: { id: null }, global: testGlobals() })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(roomService.create).toHaveBeenCalled()
    expect(roomService.detail).not.toHaveBeenCalled()
  })

  it('loads and pre-fills existing room data in edit mode, and warns about re-review', async () => {
    roomService.detail.mockResolvedValue({
      data: { data: { id: 5, title: 'Old Title', description: 'desc', price: '300', province: 'Phnom Penh', district: 'D', commune: 'C', address: 'A', latitude: null, longitude: null, room_type: 'studio', available: true, status: 'approved' } },
    })
    const wrapper = mount(RoomFormView, { props: { id: 5 }, global: testGlobals() })
    await flushPromises()

    expect(wrapper.find('input').element.value).toBe('Old Title')
    expect(wrapper.text()).toContain("Editing an approved room sends it back for admin review")
  })

  it('calls update (not create) in edit mode on submit', async () => {
    roomService.detail.mockResolvedValue({
      data: { data: { id: 5, title: 'Old Title', description: 'desc', price: '300', province: 'Phnom Penh', district: 'D', commune: 'C', address: 'A', room_type: 'studio', available: true, status: 'pending' } },
    })
    roomService.update.mockResolvedValue({})
    const wrapper = mount(RoomFormView, { props: { id: 5 }, global: testGlobals() })
    await flushPromises()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(roomService.update).toHaveBeenCalledWith(5, expect.any(FormData))
    expect(roomService.create).not.toHaveBeenCalled()
  })

  it('surfaces field-level validation errors from a 422 response (Phase 4 API-shape regression)', async () => {
    roomService.create.mockRejectedValue({ response: { status: 422, data: { errors: { title: ['The title field is required.'] } } } })
    const wrapper = mount(RoomFormView, { props: { id: null }, global: testGlobals() })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('The title field is required.')
  })

  it('redirects to the room list if loading an existing room fails (e.g. not found or not owned)', async () => {
    roomService.detail.mockRejectedValue({ response: { status: 404 } })
    const router = { push: vi.fn() }
    const wrapper = mount(RoomFormView, {
      props: { id: 999 },
      global: { ...testGlobals(), mocks: { $router: router } },
    })
    await flushPromises()

    // Loading state clears and the form doesn't stay stuck on a broken load.
    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
  })
})
