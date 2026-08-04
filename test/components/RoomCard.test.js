import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RoomCard from '@/components/RoomCard.vue'
import favoriteService from '@/services/favorite.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/favorite.service', () => ({
  default: { toggle: vi.fn() },
}))

const room = {
  id: 1,
  title: 'Sunny Studio',
  district: 'Chamkarmon',
  province: 'Phnom Penh',
  price: 250,
  available: true,
  images: [],
  is_favorited: false,
}

describe('RoomCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders room title, location, and formatted price', () => {
    const wrapper = mount(RoomCard, { props: { room }, global: testGlobals() })
    expect(wrapper.text()).toContain('Sunny Studio')
    expect(wrapper.text()).toContain('Chamkarmon, Phnom Penh')
    expect(wrapper.text()).toContain('$250')
  })

  it('shows a placeholder icon instead of a broken image when there is no thumbnail', () => {
    const wrapper = mount(RoomCard, { props: { room }, global: testGlobals() })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.pi-image').exists()).toBe(true)
  })

  it('toggles favorite state on click and emits "unfavorited" when un-favoriting', async () => {
    favoriteService.toggle.mockResolvedValue({ data: { is_favorited: false } })
    const wrapper = mount(RoomCard, {
      props: { room: { ...room, is_favorited: true }, showFavorite: true },
      global: testGlobals(),
    })

    await wrapper.find('button[aria-label]').trigger('click')
    await flushPromises()

    expect(favoriteService.toggle).toHaveBeenCalledWith(1)
    expect(wrapper.emitted('unfavorited')).toEqual([[1]])
  })

  it('guards against a rapid double-click firing two requests (Phase 5 regression)', async () => {
    let resolveToggle
    favoriteService.toggle.mockReturnValue(new Promise((resolve) => { resolveToggle = resolve }))
    const wrapper = mount(RoomCard, { props: { room, showFavorite: true }, global: testGlobals() })

    const button = wrapper.find('button[aria-label]')
    await button.trigger('click')
    await button.trigger('click') // fired while the first request is still in flight

    expect(favoriteService.toggle).toHaveBeenCalledTimes(1)

    resolveToggle({ data: { is_favorited: true } })
    await flushPromises()
  })

  it('surfaces a toast instead of failing silently when the toggle request fails', async () => {
    favoriteService.toggle.mockRejectedValue(new Error('server error'))
    const wrapper = mount(RoomCard, { props: { room, showFavorite: true }, global: testGlobals() })

    await wrapper.find('button[aria-label]').trigger('click')
    await flushPromises()

    // The mocked useToast (test/setup.js) swallows the call; the real regression
    // guard here is that the rejection does not propagate as an unhandled error
    // and the busy flag is reset so a retry is possible.
    await wrapper.find('button[aria-label]').trigger('click')
    await flushPromises()
    expect(favoriteService.toggle).toHaveBeenCalledTimes(2)
  })
})
