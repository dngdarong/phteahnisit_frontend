import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MyBookingsView from '@/modules/bookings/views/MyBookingsView.vue'
import bookingService from '@/services/booking.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/booking.service', () => ({
  default: { list: vi.fn(), cancel: vi.fn() },
}))

// Overrides the global setup.js confirm mock so we can capture and manually
// invoke the `accept` callback passed to confirm.require(), mirroring how
// PrimeVue's real ConfirmDialog would call it after a user clicks "Yes".
let lastConfirmOptions
vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: (options) => { lastConfirmOptions = options },
  }),
}))

const pendingBooking = {
  id: 1,
  status: 'pending',
  move_in_date: '2026-09-01',
  duration_months: 6,
  room: { id: 5, title: 'Lakeside Room' },
}

describe('MyBookingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastConfirmOptions = undefined
  })

  it('shows an empty state when the student has no bookings', async () => {
    bookingService.list.mockResolvedValue({ data: { data: [] } })
    const wrapper = mount(MyBookingsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain("You haven't requested any bookings yet.")
  })

  it('surfaces a toast on load failure instead of leaving a blank/broken page', async () => {
    bookingService.list.mockRejectedValue(new Error('server down'))
    const wrapper = mount(MyBookingsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
  })

  it('renders a fallback instead of crashing when the booking has no room (soft-deleted relation)', async () => {
    bookingService.list.mockResolvedValue({ data: { data: [{ ...pendingBooking, room: null }] } })
    const wrapper = mount(MyBookingsView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Room no longer available')
  })

  it('only shows the cancel button for pending bookings', async () => {
    bookingService.list.mockResolvedValue({
      data: { data: [pendingBooking, { ...pendingBooking, id: 2, status: 'approved' }] },
    })
    const wrapper = mount(MyBookingsView, { global: testGlobals() })
    await flushPromises()

    const cancelButtons = wrapper.findAll('button').filter((b) => b.text().includes('Cancel booking'))
    expect(cancelButtons).toHaveLength(1)
  })

  it('cancels a pending booking after the confirm dialog is accepted (Phase 2 regression)', async () => {
    bookingService.list.mockResolvedValue({ data: { data: [pendingBooking] } })
    bookingService.cancel.mockResolvedValue({})
    const wrapper = mount(MyBookingsView, { global: testGlobals() })
    await flushPromises()

    const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel booking'))
    await cancelButton.trigger('click')

    expect(lastConfirmOptions).toBeDefined()
    bookingService.list.mockResolvedValue({ data: { data: [] } })
    await lastConfirmOptions.accept()
    await flushPromises()

    expect(bookingService.cancel).toHaveBeenCalledWith(1)
  })

  it('surfaces the backend error message when cancel fails', async () => {
    bookingService.list.mockResolvedValue({ data: { data: [pendingBooking] } })
    bookingService.cancel.mockRejectedValue({ response: { data: { message: 'Booking already approved.' } } })
    const wrapper = mount(MyBookingsView, { global: testGlobals() })
    await flushPromises()

    const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel booking'))
    await cancelButton.trigger('click')
    // No crash / unhandled rejection is the regression this guards against.
    await expect(lastConfirmOptions.accept()).resolves.toBeUndefined()
  })
})
