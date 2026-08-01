import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/*
 * Maps PrimeVue's Aura preset onto the same brand green scale used in
 * Tailwind (src/assets/styles/main.css @theme block), so components
 * from both systems look like one product instead of two libraries
 * bolted together.
 *
 * v0.2: re-anchored to the blended palette's sage-green primary
 * (#3F7D57) / primary-d (#2C5C3E) / primary-l (#DCEBDF) - same scale
 * shape as v0.1, just the new shade.
 */
export default definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f5faf6',
      100: '#dcebdf',
      200: '#c3ddc9',
      300: '#9fc9aa',
      400: '#6da97d',
      500: '#3f7d57',
      600: '#356b49',
      700: '#2c5c3e',
      800: '#234a32',
      900: '#1b3a28',
      950: '#132a1c',
    },
  },
})
