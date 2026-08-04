import api from './api'

export default {
  list(params) {
    return api.get('/admin/users', { params })
  },
  create(payload) {
    return api.post('/admin/users', payload)
  },
  createAdmin(payload) {
    return api.post('/admin/users/admins', payload)
  },
  detail(id) {
    return api.get(`/admin/users/${id}`)
  },
  update(id, payload) {
    return api.put(`/admin/users/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/admin/users/${id}`)
  },
  disable(id) {
    return api.post(`/admin/users/${id}/disable`)
  },
  enable(id) {
    return api.post(`/admin/users/${id}/enable`)
  },
}
