import api from './api'

export default {
  list(params) {
    return api.get('/conversations', { params })
  },
  show(id) {
    return api.get(`/conversations/${id}`)
  },
  /** Student-initiated: implicitly starts (or reuses) the conversation for this room. */
  sendToRoom(roomId, body) {
    return api.post(`/rooms/${roomId}/messages`, { body })
  },
  sendMessage(conversationId, body) {
    return api.post(`/conversations/${conversationId}/messages`, { body })
  },
}
