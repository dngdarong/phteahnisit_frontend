import { vi } from 'vitest'

// PrimeVue's useToast/useConfirm require the app to be bootstrapped with
// ToastService/ConfirmationService (see src/main.js). Tests mount components
// in isolation, so provide lightweight spies instead of the real plugins.
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}))

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: vi.fn() }),
}))

// jsdom doesn't implement these; several PrimeVue components (Select,
// Textarea with auto-resize, DatePicker) call them unconditionally on mount.
window.matchMedia = window.matchMedia || (() => ({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))

global.ResizeObserver = global.ResizeObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
