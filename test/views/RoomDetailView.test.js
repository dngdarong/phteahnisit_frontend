import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import RoomDetailView from '@/modules/rooms/views/RoomDetailView.vue'
import roomService from '@/services/room.service'
import favoriteService from '@/services/favorite.service'
import bookingService from '@/services/booking.service'
import chatService from '@/services/chat.service'
import { makeTestI18n, makeTestRouter, makeTestPrimeVuePlugin } from '../helpers/mount'

vi.mock('@/services/room.service', () => ({ default: { detail: vi.fn() } }))
vi.mock('@/services/favorite.service', () => ({ default: { toggle: vi.fn() } }))
vi.mock('@/services/booking.service', () => ({ default: { create: vi.fn() } }))
vi.mock('@/services/chat.service', () => ({ default: { sendToRoom: vi.fn() } }))

const approvedRoom = {
  id: 5,
  title: 'Lakeside Room',
  address: '123 St',
  district: 'Chamkarmon',
  province: 'Phnom Penh',
  price: 300,
  available: true,
  status: 'approved',
  room_type: 'studio',
  description: 'Nice room',
  images: [],
  is_favorited: false,
  landlord: { name: 'Bora', phone: '012345678' },
}

function mountDetail(role = 'student') {
  const pinia = createTestingPinia({
    stubActions: false,
    initialState: { auth: { user: { id: 1, role }, token: 'tok-1' } },
  })
  const router = makeTestRouter()
  const wrapper = mount(RoomDetailView, {
    props: { id: 5 },
    global: { plugins: [makeTestI18n(), router, pinia, makeTestPrimeVuePlugin()] },
  })
  return { wrapper, router }
}

describe('RoomDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders room details on load', async () => {
    roomService.detail.mockResolvedValue({ data: { data: approvedRoom } })
    const { wrapper } = mountDetail()
    await flushPromises()

    expect(wrapper.text()).toContain('Lakeside Room')
    expect(wrapper.text()).toContain('$300')
  })

  it('shows a not-found state instead of crashing on a 404 (deleted/unapproved room)', async () => {
    roomService.detail.mockRejectedValue({ response: { status: 404 } })
    const { wrapper } = mountDetail()
    await flushPromises()

    expect(wrapper.text()).toContain('Room not found or no longer available.')
  })

  it('does not render the contact-landlord block when the landlord relation is null (Phase 3/4 regression)', async () => {
    roomService.detail.mockResolvedValue({ data: { data: { ...approvedRoom, landlord: null } } })
    const { wrapper } = mountDetail()
    await flushPromises()

    expect(wrapper.text()).toContain('Lakeside Room') // still renders the room itself
    expect(wrapper.text()).not.toContain('Contact landlord')
  })

  it('toggles favorite state and guards against a rapid double-click (Phase 5 regression)', async () => {
    roomService.detail.mockResolvedValue({ data: { data: approvedRoom } })
    let resolveToggle
    favoriteService.toggle.mockReturnValue(new Promise((resolve) => { resolveToggle = resolve }))
    const { wrapper } = mountDetail('student')
    await flushPromises()

    const favButton = wrapper.find('button[aria-label="Save to favorites"]')
    await favButton.trigger('click')
    await favButton.trigger('click')

    expect(favoriteService.toggle).toHaveBeenCalledTimes(1)
    resolveToggle({ data: { is_favorited: true } })
    await flushPromises()
  })

  it('submits a booking request and redirects to my-bookings on success', async () => {
    roomService.detail.mockResolvedValue({ data: { data: approvedRoom } })
    bookingService.create.mockResolvedValue({})
    const { wrapper, router } = mountDetail('student')
    await flushPromises()
    const pushSpy = vi.spyOn(router, 'push')

    const requestButton = wrapper.findAll('button').find((b) => b.text().includes('Request to book'))
    await requestButton.trigger('click')
    await flushPromises()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(bookingService.create).toHaveBeenCalledWith(expect.objectContaining({ room_id: 5 }))
    expect(pushSpy).toHaveBeenCalledWith({ name: 'my-bookings' })
  })

  it('surfaces booking validation errors from a 422 response without crashing (Phase 4 API-shape regression)', async () => {
    roomService.detail.mockResolvedValue({ data: { data: approvedRoom } })
    bookingService.create.mockRejectedValue({ response: { status: 422, data: { errors: { move_in_date: ['The move in date must be a future date.'] } } } })
    const { wrapper } = mountDetail('student')
    await flushPromises()

    const requestButton = wrapper.findAll('button').find((b) => b.text().includes('Request to book'))
    await requestButton.trigger('click')
    await flushPromises()
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('The move in date must be a future date.')
  })

  it('sends a message to the landlord and redirects to the resulting conversation thread', async () => {
    roomService.detail.mockResolvedValue({ data: { data: approvedRoom } })
    chatService.sendToRoom.mockResolvedValue({ data: { data: { conversation_id: 42 } } })
    const { wrapper, router } = mountDetail('student')
    await flushPromises()
    const pushSpy = vi.spyOn(router, 'push')

    const messageButton = wrapper.findAll('button').find((b) => b.text().includes('Message landlord'))
    await messageButton.trigger('click')
    await wrapper.find('textarea').setValue('Is this available?')
    const sendButton = wrapper.findAll('button').find((b) => b.text().includes('Send'))
    await sendButton.trigger('click')
    await flushPromises()

    expect(chatService.sendToRoom).toHaveBeenCalledWith(5, 'Is this available?')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'chat-thread', params: { id: 42 } })
  })

  it('does not show the booking/favorite/message actions for a landlord viewing their own listing type', async () => {
    roomService.detail.mockResolvedValue({ data: { data: approvedRoom } })
    const { wrapper } = mountDetail('landlord')
    await flushPromises()

    expect(wrapper.find('button[aria-label="Save to favorites"]').exists()).toBe(false)
    expect(wrapper.findAll('button').find((b) => b.text().includes('Request to book'))).toBeUndefined()
  })
})
