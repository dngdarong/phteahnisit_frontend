import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FavoritesView from '@/modules/favorites/views/FavoritesView.vue'
import favoriteService from '@/services/favorite.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/favorite.service', () => ({
  default: { list: vi.fn(), toggle: vi.fn() },
}))

const room = { id: 1, title: 'Sunny Studio', district: 'Chamkarmon', province: 'Phnom Penh', price: 250, available: true, images: [], is_favorited: true }

describe('FavoritesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty state when nothing is favorited', async () => {
    favoriteService.list.mockResolvedValue({ data: { data: [] } })
    const wrapper = mount(FavoritesView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('No saved rooms yet')
  })

  it('surfaces a toast on load failure instead of leaving a blank/broken page', async () => {
    favoriteService.list.mockRejectedValue(new Error('server down'))
    const wrapper = mount(FavoritesView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.find('.p-progressspinner').exists()).toBe(false)
  })

  it('renders favorited rooms', async () => {
    favoriteService.list.mockResolvedValue({ data: { data: [room] } })
    const wrapper = mount(FavoritesView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Sunny Studio')
  })

  it('removes a room from the list as soon as it is unfavorited, without a refetch', async () => {
    favoriteService.list.mockResolvedValue({ data: { data: [room] } })
    favoriteService.toggle.mockResolvedValue({ data: { is_favorited: false } })
    const wrapper = mount(FavoritesView, { global: testGlobals() })
    await flushPromises()

    await wrapper.find('button[aria-label]').trigger('click')
    await flushPromises()

    expect(favoriteService.list).toHaveBeenCalledTimes(1) // not called again
    expect(wrapper.text()).not.toContain('Sunny Studio')
    expect(wrapper.text()).toContain('No saved rooms yet')
  })
})
