import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import App from './App.vue'
import router from './router'
import i18n from './locales'
import brandPreset from './assets/styles/primevue-preset'
import './assets/styles/main.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: brandPreset,
    options: { darkModeSelector: false }, // v0.1 scope: light mode only
  },
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
