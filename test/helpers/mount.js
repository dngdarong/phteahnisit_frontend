import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createTestingPinia } from '@pinia/testing'
import PrimeVue from 'primevue/config'
import en from '@/locales/en.json'
import km from '@/locales/km.json'
import brandPreset from '@/assets/styles/primevue-preset'

/** Mirrors src/main.js's `app.use(PrimeVue, ...)` call - PrimeVue's input/dialog
 *  components read `$primevue` config during render and throw without it. */
export function makeTestPrimeVuePlugin() {
  return [PrimeVue, { theme: { preset: brandPreset, options: { darkModeSelector: false } } }]
}

/** Minimal named routes covering every `:to="{ name: ... }"` used by tested components/views. */
const routes = [
  { path: '/', name: 'home', component: { template: '<div />' } },
  { path: '/login', name: 'login', component: { template: '<div />' } },
  { path: '/register/student', name: 'register-student', component: { template: '<div />' } },
  { path: '/register/landlord', name: 'register-landlord', component: { template: '<div />' } },
  { path: '/rooms/:id', name: 'room-detail', component: { template: '<div />' } },
  { path: '/map', name: 'room-map', component: { template: '<div />' } },
  { path: '/profile', name: 'profile', component: { template: '<div />' } },
  { path: '/chat', name: 'chat-list', component: { template: '<div />' } },
  { path: '/chat/:id', name: 'chat-thread', component: { template: '<div />' } },
  { path: '/favorites', name: 'favorites', component: { template: '<div />' } },
  { path: '/bookings', name: 'my-bookings', component: { template: '<div />' } },
  { path: '/landlord/rooms', name: 'landlord-rooms', component: { template: '<div />' } },
  { path: '/landlord/rooms/new', name: 'landlord-room-create', component: { template: '<div />' } },
  { path: '/landlord/rooms/:id/edit', name: 'landlord-room-edit', component: { template: '<div />' } },
  { path: '/landlord/bookings', name: 'landlord-bookings', component: { template: '<div />' } },
]

export function makeTestRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

export function makeTestI18n() {
  return createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en, km } })
}

/** Shared `global` mount options: real i18n (English), a real in-memory router, and a spy-friendly Pinia. */
export function testGlobals(piniaOptions = {}) {
  return {
    plugins: [
      makeTestI18n(),
      makeTestRouter(),
      createTestingPinia({ stubActions: false, ...piniaOptions }),
      makeTestPrimeVuePlugin(),
    ],
  }
}
