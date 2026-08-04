import api from './api'

export default {
  list(params) {
    return api.get('/favorites', { params })
  },
  toggle(roomId) {
    return api.post(`/rooms/${roomId}/favorite`)
  },
}
