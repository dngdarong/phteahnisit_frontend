import { defineStore } from 'pinia'
import authService from '@/services/auth.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('phteahnisit_user') || 'null'),
    token: localStorage.getItem('phteahnisit_token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role ?? null,
    isLandlord: (state) => state.user?.role === 'landlord',
    isStudent: (state) => state.user?.role === 'student',
  },

  actions: {
    setSession(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem('phteahnisit_user', JSON.stringify(user))
      localStorage.setItem('phteahnisit_token', token)
    },

    async login(email, password) {
      const { data } = await authService.login(email, password)
      this.setSession(data.user, data.token)
      return data.user
    },

    async registerStudent(payload) {
      return authService.registerStudent(payload)
    },

    async registerLandlord(payload) {
      return authService.registerLandlord(payload)
    },

    async logout() {
      try {
        await authService.logout()
      } finally {
        this.clearSession()
      }
    },

    /** Local-only session clear, no API call - used for logout and by the
     * api.js 401 interceptor (which must not itself trigger another request). */
    clearSession() {
      this.user = null
      this.token = null
      localStorage.removeItem('phteahnisit_user')
      localStorage.removeItem('phteahnisit_token')
    },

    /** Re-sync with the backend, e.g. on app load, to catch server-side status changes. */
    async refresh() {
      if (!this.token) return
      const { data } = await authService.me()
      this.user = data.data ?? data
      localStorage.setItem('phteahnisit_user', JSON.stringify(this.user))
    },
  },
})
