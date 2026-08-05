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
}
