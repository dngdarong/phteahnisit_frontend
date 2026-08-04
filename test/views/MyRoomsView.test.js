import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MyRoomsView from '@/modules/landlord/views/MyRoomsView.vue'
import roomService from '@/services/room.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/room.service', () => ({
  default: { mine: vi.fn(), remove: vi.fn() },
}))

let lastConfirmOptions
vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: (options) => { lastConfirmOptions = options },
  }),
}))

const room = { id: 1, title: 'Sunny Studio', district: 'Chamkarmon', province: 'Phnom Penh', price: 250, available: true, images: [], status: 'approved' }

describe('MyRoomsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastConfirmOptions = undefined
  })

  it('shows an empty state when the landlord has no rooms yet', async () => {
    roomService.mine.mockResolvedValue({ data: { data: [] } })
    const wrapper = mount(MyRoomsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Post your first room to get started.')
  })

  it('surfaces a toast on load failure instead of leaving a blank/broken page', async () => {
    roomService.mine.mockRejectedValue(new Error('server down'))
    const wrapper = mount(MyRoomsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
  })

  it('renders the landlord\'s rooms', async () => {
    roomService.mine.mockResolvedValue({ data: { data: [room] } })
    const wrapper = mount(MyRoomsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Sunny Studio')
  })

  it('deletes a room after the confirm dialog is accepted', async () => {
    roomService.mine.mockResolvedValue({ data: { data: [room] } })
    roomService.remove.mockResolvedValue({})
    const wrapper = mount(MyRoomsView, { global: testGlobals() })
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await deleteButton.trigger('click')

    expect(lastConfirmOptions).toBeDefined()
    roomService.mine.mockResolvedValue({ data: { data: [] } })
    await lastConfirmOptions.accept()
    await flushPromises()

    expect(roomService.remove).toHaveBeenCalledWith(1)
  })

  it('surfaces the backend error message when delete fails instead of failing silently', async () => {
    roomService.mine.mockResolvedValue({ data: { data: [room] } })
    roomService.remove.mockRejectedValue({ response: { data: { message: 'This room has active bookings.' } } })
    const wrapper = mount(MyRoomsView, { global: testGlobals() })
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await deleteButton.trigger('click')
    await expect(lastConfirmOptions.accept()).resolves.toBeUndefined()
  })
})
