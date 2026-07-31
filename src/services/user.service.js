import api from './api'

export default {
  list(params) {
    return api.get('/admin/users', { params })
  },
  createAdmin(payload) {
    return api.post('/admin/users/admins', payload)
  },
  disable(id) {
    return api.post(`/admin/users/${id}/disable`)
  },
  enable(id) {
    return api.post(`/admin/users/${id}/enable`)
  },
}
