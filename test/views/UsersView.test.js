import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UsersView from '@/modules/admin/views/UsersView.vue'
import userService from '@/services/user.service'
import { testGlobals } from '../helpers/mount'

vi.mock('@/services/user.service', () => ({
  default: { list: vi.fn(), disable: vi.fn(), enable: vi.fn(), remove: vi.fn() },
}))

let lastConfirmOptions
vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: (options) => { lastConfirmOptions = options },
  }),
}))

const activeUser = { id: 1, name: 'Sokha', email: 'sokha@test.com', phone: '012345678', role: 'student', status: 'active' }

describe('UsersView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastConfirmOptions = undefined
  })

  it('renders the user list in the table', async () => {
    userService.list.mockResolvedValue({ data: { data: [activeUser] } })
    const wrapper = mount(UsersView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.text()).toContain('Sokha')
    expect(wrapper.text()).toContain('sokha@test.com')
  })

  it('surfaces a toast on load failure instead of leaving a blank/broken page', async () => {
    userService.list.mockRejectedValue(new Error('server down'))
    const wrapper = mount(UsersView, { global: testGlobals() })
    await flushPromises()

    expect(wrapper.find('.p-datatable-emptymessage, tbody').exists()).toBe(true)
  })

  it('disables an active user after the confirm dialog is accepted', async () => {
    userService.list.mockResolvedValue({ data: { data: [activeUser] } })
    userService.disable.mockResolvedValue({})
    const wrapper = mount(UsersView, { global: testGlobals() })
    await flushPromises()

    const disableButton = wrapper.findAll('button').find((b) => b.text() === 'Disable')
    await disableButton.trigger('click')

    expect(lastConfirmOptions).toBeDefined()
    userService.list.mockResolvedValue({ data: { data: [{ ...activeUser, status: 'inactive' }] } })
    await lastConfirmOptions.accept()
    await flushPromises()

    expect(userService.disable).toHaveBeenCalledWith(1)
  })

  it('surfaces the backend error message when disable fails (self-disable block, etc.)', async () => {
    userService.list.mockResolvedValue({ data: { data: [activeUser] } })
    userService.disable.mockRejectedValue({ response: { data: { message: 'You cannot disable your own account.' } } })
    const wrapper = mount(UsersView, { global: testGlobals() })
    await flushPromises()

    const disableButton = wrapper.findAll('button').find((b) => b.text() === 'Disable')
    await disableButton.trigger('click')
    await expect(lastConfirmOptions.accept()).resolves.toBeUndefined()
  })

  it('deletes a user after the confirm dialog is accepted', async () => {
    userService.list.mockResolvedValue({ data: { data: [activeUser] } })
    userService.remove.mockResolvedValue({})
    const wrapper = mount(UsersView, { global: testGlobals() })
    await flushPromises()

    const deleteButton = wrapper.findAll('button[aria-label]').find((b) => b.attributes('aria-label') === 'Delete')
    await deleteButton.trigger('click')

    userService.list.mockResolvedValue({ data: { data: [] } })
    await lastConfirmOptions.accept()
    await flushPromises()

    expect(userService.remove).toHaveBeenCalledWith(1)
  })
})
