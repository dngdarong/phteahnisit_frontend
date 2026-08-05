<script setup>
// Phase 10.3: replaces the byte-for-byte-identical
// `<label class="mb-1 block text-sm font-medium text-brand-700">...</label>`
// + input + `<small class="text-status-rejected">{{ error }}</small>` block
// copy-pasted ~40x across RegisterForm.vue, LoginView.vue, ProfileView.vue,
// RoomFormView.vue, UserFormView.vue and RoomDetailView.vue's booking form.
//
// Props:
//  - label (String, required): the field label text
//  - inputId (String, optional): id of the paired form control, wired to
//    the label's `for` attribute (omit for composite widgets with no
//    stable input id, e.g. FileUpload - same as before this phase)
//  - error (String, optional): first validation error message; rendered
//    with the same `<small class="text-status-rejected">` used everywhere
//  - variant ('default' | 'subtle', default 'default'): 'subtle' reproduces
//    ProfileView's muted secondary-field label style (text-brand-600, no
//    font-medium) used for its optional change-password fields
//
// Slots:
//  - default: the form control itself (InputText, Password, Select, etc.)
//
// Example:
//  <FormField label="Name" input-id="register-name" :error="errors.name?.[0]">
//    <InputText id="register-name" v-model="form.name" class="w-full" required />
//  </FormField>
//
// Used in: RegisterForm.vue, LoginView.vue, ProfileView.vue, RoomFormView.vue,
// UserFormView.vue, RoomDetailView.vue
defineProps({
  label: { type: String, required: true },
  inputId: { type: String, default: null },
  error: { type: String, default: null },
  variant: { type: String, default: 'default' }, // 'default' | 'subtle'
})
</script>

<template>
  <div>
    <label
      :for="inputId"
      class="mb-1 block text-sm"
      :class="variant === 'subtle' ? 'text-brand-600' : 'font-medium text-brand-700'"
    >{{ label }}</label>
    <slot />
    <small v-if="error" class="text-status-rejected">{{ error }}</small>
  </div>
</template>
