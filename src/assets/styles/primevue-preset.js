import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/*
 * Maps PrimeVue's Aura preset onto the same brand green scale used in
 * Tailwind (src/assets/styles/main.css @theme block), so components
 * from both systems look like one product instead of two libraries
 * bolted together.
 *
 * Phase 10.2 (Theme Consolidation): the ramp used to be hardcoded here
 * as a second copy of the same hex values defined in main.css's
 * `--color-brand-*` @theme block. Now it references those CSS custom
 * properties directly via var() - one source of truth for the color
 * values, main.css is the only place they're written as hex. PrimeVue's
 * theming layer resolves these tokens into plain CSS custom properties
 * at render time, so a var() reference here works exactly like a
 * literal color would; there's no build-order dependency between this
 * module and main.css.
 *
 * The `--color-brand-950` step doesn't exist in Tailwind's ramp (it
 * only goes to 900) - kept as a literal, slightly-darker-than-900 value
 * since Aura's `primary.950` is only ever used for its own internal
 * dark-mode contrast math, and this app is light-mode only
 * (see main.js: `darkModeSelector: false`).
 */
export default definePreset(Aura, {
  semantic: {
    primary: {
      50: 'var(--color-brand-50)',
      100: 'var(--color-brand-100)',
      200: 'var(--color-brand-200)',
      300: 'var(--color-brand-300)',
      400: 'var(--color-brand-400)',
      500: 'var(--color-brand-500)',
      600: 'var(--color-brand-600)',
      700: 'var(--color-brand-700)',
      800: 'var(--color-brand-800)',
      900: 'var(--color-brand-900)',
      950: '#132a1c',
    },
    // Align PrimeVue's modal radius with the hand-built `rounded-card`
    // cards (both are "content card" surfaces at a similar scale) -
    // Aura's default here is `border.radius.xl` (12px); --radius-card
    // is 16px, a 4px difference that's imperceptible on a dialog corner
    // but means both now trace back to the same single token.
    overlay: {
      modal: {
        borderRadius: 'var(--radius-card)',
      },
    },
  },
})
