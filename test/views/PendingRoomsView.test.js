import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import PendingRoomsView from '@/modules/admin/views/PendingRoomsView.vue'
import roomService from '@/services/room.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/room.service', () => ({
  default: { pending: vi.fn(), approve: vi.fn(), reject: vi.fn() },
}))

const pendingRoom = {
  id: 1,
  title: 'Sunny Studio',
  district: 'Chamkarmon',
  province: 'Phnom Penh',
  price: 250,
  available: true,
  images: [],
  landlord: { name: 'Bora', phone: '012345678' },
}

describe('PendingRoomsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty state when nothing is waiting for review', async () => {
    roomService.pending.mockResolvedValue({ data: { data: [] } })
    const wrapper = mount(PendingRoomsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Nothing waiting for review.')
  })

  it('surfaces a toast on load failure instead of leaving a blank/broken page', async () => {
    roomService.pending.mockRejectedValue(new Error('server down'))
    const wrapper = mount(PendingRoomsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
  })

  it('approves a room and guards against a rapid double-click firing two requests (Phase 5 regression)', async () => {
    roomService.pending.mockResolvedValue({ data: { data: [pendingRoom] } })
    let resolveApprove
    roomService.approve.mockReturnValue(new Promise((resolve) => { resolveApprove = resolve }))
    const wrapper = mount(PendingRoomsView, { global: testGlobals() })
    await flushPromises()

    const approveButton = wrapper.findAll('button').find((b) => b.text().includes('Approve'))
    await approveButton.trigger('click')
    await approveButton.trigger('click') // second click while the first request is still in flight

    expect(roomService.approve).toHaveBeenCalledTimes(1)
    expect(roomService.approve).toHaveBeenCalledWith(1)

    resolveApprove({})
    roomService.pending.mockResolvedValue({ data: { data: [] } })
    await flushPromises()
  })

  it('disables the reject button while an approval for that room is in flight', async () => {
    roomService.pending.mockResolvedValue({ data: { data: [pendingRoom] } })
    roomService.approve.mockReturnValue(new Promise(() => {})) // never resolves within the test
    const wrapper = mount(PendingRoomsView, { global: testGlobals() })
    await flushPromises()

    const approveButton = wrapper.findAll('button').find((b) => b.text().includes('Approve'))
    await approveButton.trigger('click')

    const rejectButton = wrapper.findAll('button').find((b) => b.text().includes('Reject'))
    expect(rejectButton.attributes('disabled')).toBeDefined()
  })

  it('rejects a room with the entered reason via the reject dialog', async () => {
    roomService.pending.mockResolvedValue({ data: { data: [pendingRoom] } })
    roomService.reject.mockResolvedValue({})
    const container = document.createElement('div')
    document.body.appendChild(container)
    const wrapper = mount(PendingRoomsView, { global: testGlobals(), attachTo: container })
    await flushPromises()

    const rejectButton = wrapper.findAll('button').find((b) => b.text().includes('Reject'))
    await rejectButton.trigger('click')
    await flushPromises()

    const body = new DOMWrapper(document.body)
    await body.find('textarea').setValue('Photos are unclear')

    const dialog = body.find('.p-dialog')
    const confirmButton = dialog.findAll('button').find((b) => b.text() === 'Reject')
    roomService.pending.mockResolvedValue({ data: { data: [] } })
    await confirmButton.trigger('click')
    await flushPromises()

    expect(roomService.reject).toHaveBeenCalledWith(1, 'Photos are unclear')

    wrapper.unmount()
    container.remove()
  })
})
