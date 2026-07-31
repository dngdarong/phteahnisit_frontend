import api from './api'

export default {
  registerStudent(payload) {
    return api.post('/auth/register/student', payload)
  },
  registerLandlord(payload) {
    return api.post('/auth/register/landlord', payload)
  },
  login(email, password) {
    return api.post('/auth/login', { email, password })
  },
  logout() {
    return api.post('/auth/logout')
  },
  me() {
    return api.get('/auth/me')
  },
}
