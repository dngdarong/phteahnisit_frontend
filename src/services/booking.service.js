import api from './api'

export default {
  // Student
  list(params) {
    return api.get('/bookings', { params })
  },
  create(payload) {
    return api.post('/bookings', payload)
  },
  cancel(id) {
    return api.post(`/bookings/${id}/cancel`)
  },

  // Landlord
  landlordList(params) {
    return api.get('/landlord/bookings', { params })
  },
  approve(id) {
    return api.post(`/landlord/bookings/${id}/approve`)
  },
  reject(id, reason) {
    return api.post(`/landlord/bookings/${id}/reject`, { reason })
  },
}
