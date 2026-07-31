import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/*
 * Maps PrimeVue's Aura preset onto the same brand green scale used in
 * Tailwind (src/assets/styles/main.css @theme block), so components
 * from both systems look like one product instead of two libraries
 * bolted together.
 */
export default definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f2f8f3',
      100: '#dfeee1',
      200: '#bcdcc0',
      300: '#8fc397',
      400: '#62a76c',
      500: '#438a4e',
      600: '#326e3c',
      700: '#285731',
      800: '#21462a',
      900: '#1c3a24',
      950: '#122619',
    },
  },
})
