import api from './api'

export default {
  // Public
  search(params) {
    return api.get('/rooms', { params })
  },
  detail(id) {
    return api.get(`/rooms/${id}`)
  },
  map(params) {
    return api.get('/rooms/map', { params })
  },

  // Landlord
  mine(params) {
    return api.get('/my-rooms', { params })
  },
  create(formData) {
    return api.post('/rooms', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  update(id, formData) {
    formData.append('_method', 'PUT') // Laravel method spoofing for multipart PUT
    return api.post(`/rooms/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  remove(id) {
    return api.delete(`/rooms/${id}`)
  },

  // Admin
  pending(params) {
    return api.get('/admin/rooms/pending', { params })
  },
  adminIndex(params) {
    return api.get('/admin/rooms', { params })
  },
  approve(id) {
    return api.post(`/admin/rooms/${id}/approve`)
  },
  reject(id, reason) {
    return api.post(`/admin/rooms/${id}/reject`, { reason })
  },
  forceRemove(id) {
    return api.delete(`/admin/rooms/${id}/force`)
  },
}
