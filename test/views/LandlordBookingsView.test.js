import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import LandlordBookingsView from '@/modules/bookings/views/LandlordBookingsView.vue'
import bookingService from '@/services/booking.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/booking.service', () => ({
  default: { landlordList: vi.fn(), approve: vi.fn(), reject: vi.fn() },
}))

const pendingBooking = {
  id: 10,
  status: 'pending',
  move_in_date: '2026-09-01',
  duration_months: 6,
  room: { id: 5, title: 'Lakeside Room' },
  student: { name: 'Sokha', phone: '012345678' },
}

describe('LandlordBookingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty state when there are no bookings to review', async () => {
    bookingService.landlordList.mockResolvedValue({ data: { data: [] } })
    const wrapper = mount(LandlordBookingsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('No booking requests waiting for review.')
  })

  it('surfaces a toast on load failure instead of leaving a blank/broken page', async () => {
    bookingService.landlordList.mockRejectedValue(new Error('server down'))
    const wrapper = mount(LandlordBookingsView, { global: testGlobals() })
    await flushPromises()

    // No unhandled rejection and no crash is the regression this guards (Phase 5 fix).
    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
  })

  it('renders a fallback instead of crashing when the booking has no room or student (soft-deleted relation)', async () => {
    bookingService.landlordList.mockResolvedValue({
      data: { data: [{ ...pendingBooking, room: null, student: null }] },
    })
    const wrapper = mount(LandlordBookingsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Room no longer available')
    expect(wrapper.text()).toContain('Requester account no longer available')
  })

  it('approves a booking and guards against a rapid double-click firing two requests', async () => {
    bookingService.landlordList.mockResolvedValue({ data: { data: [pendingBooking] } })
    let resolveApprove
    bookingService.approve.mockReturnValue(new Promise((resolve) => { resolveApprove = resolve }))
    const wrapper = mount(LandlordBookingsView, { global: testGlobals() })
    await flushPromises()

    const approveButton = wrapper.findAll('button').find((b) => b.text().includes('Approve'))
    await approveButton.trigger('click')
    await approveButton.trigger('click') // second click while the first request is still in flight

    expect(bookingService.approve).toHaveBeenCalledTimes(1)
    expect(bookingService.approve).toHaveBeenCalledWith(10)

    resolveApprove({})
    bookingService.landlordList.mockResolvedValue({ data: { data: [] } })
    await flushPromises()
  })

  it('rejects a booking with the entered reason via the confirm dialog', async () => {
    bookingService.landlordList.mockResolvedValue({ data: { data: [pendingBooking] } })
    bookingService.reject.mockResolvedValue({})
    // PrimeVue's Dialog teleports its content to document.body (Portal
    // appendTo="body"), so it never appears under `wrapper`'s own root -
    // attach to a real DOM node and query document.body for it directly.
    const container = document.createElement('div')
    document.body.appendChild(container)
    const wrapper = mount(LandlordBookingsView, { global: testGlobals(), attachTo: container })
    await flushPromises()

    const rejectButton = wrapper.findAll('button').find((b) => b.text().includes('Reject'))
    await rejectButton.trigger('click')
    await flushPromises()

    const body = new DOMWrapper(document.body)
    await body.find('textarea').setValue('Room no longer needed')

    // Scope to the dialog itself - the underlying list still has its own
    // "Reject" button in the DOM (teleport only moves the dialog, not the
    // rest of the page), so an unscoped text match would hit the wrong one.
    const dialog = body.find('.p-dialog')
    const confirmButton = dialog.findAll('button').find((b) => b.text() === 'Reject')
    bookingService.landlordList.mockResolvedValue({ data: { data: [] } })
    await confirmButton.trigger('click')
    await flushPromises()

    expect(bookingService.reject).toHaveBeenCalledWith(10, 'Room no longer needed')

    wrapper.unmount()
    container.remove()
  })
})
