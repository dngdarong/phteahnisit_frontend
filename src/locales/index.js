import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import km from '@/locales/km.json'

const savedLocale = localStorage.getItem('phteahnisit_locale') || 'km'

export default createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, km },
})
