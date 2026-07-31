import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

// Attach the Sanctum token, if we have one, to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('phteahnisit_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 means the token is gone/invalid server-side (e.g. account was
// disabled - see EnsureUserIsActive on the backend). Clear local state
// and bounce to login rather than leaving the UI in a broken auth state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('phteahnisit_token')
      localStorage.removeItem('phteahnisit_user')
    }
    return Promise.reject(error)
  },
)

export default api
