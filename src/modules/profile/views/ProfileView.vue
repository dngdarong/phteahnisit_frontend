<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormField from '@/components/FormField.vue'

const { t } = useI18n()
const toast = useToast()
const auth = useAuthStore()

const form = reactive({ name: '', email: '', phone: '', current_password: '', password: '', password_confirmation: '' })
const errors = ref({})
const submitting = ref(false)

onMounted(() => {
  if (auth.user) {
    form.name = auth.user.name
    form.email = auth.user.email
    form.phone = auth.user.phone
  }
})

async function submit() {
  errors.value = {}
  submitting.value = true
  try {
    const payload = { name: form.name, email: form.email, phone: form.phone }
    if (form.password) {
      payload.current_password = form.current_password
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }
    const { data } = await api.put('/profile', payload)
    auth.user = data.data ?? data
    localStorage.setItem('phteahnisit_user', JSON.stringify(auth.user))
    toast.add({ severity: 'success', summary: t('common.save'), life: 3000 })
    form.current_password = form.password = form.password_confirmation = ''
  } catch (e) {
    if (e.response?.status === 422) {
      errors.value = e.response.data.errors || {}
    } else {
      errors.value = { general: [e.response?.data?.message || t('auth.updateFailed')] }
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm px-4 py-12">
    <h1 class="mb-6 text-h1 text-brand-900">{{ t('nav.profile') }}</h1>

    <form class="space-y-4" @submit.prevent="submit">
      <FormField :label="t('auth.name')" input-id="profile-name" :error="errors.name?.[0]">
        <InputText id="profile-name" v-model="form.name" class="w-full" />
      </FormField>
      <FormField :label="t('auth.email')" input-id="profile-email" :error="errors.email?.[0]">
        <InputText id="profile-email" v-model="form.email" type="email" class="w-full" />
      </FormField>
      <FormField :label="t('auth.phone')" input-id="profile-phone" :error="errors.phone?.[0]">
        <InputText id="profile-phone" v-model="form.phone" class="w-full" />
      </FormField>

      <hr class="border-brand-100" />
      <p class="text-sm font-medium text-brand-700">{{ t('auth.changePasswordOptional') }}</p>

      <FormField :label="t('auth.currentPassword')" input-id="profile-current-password" variant="subtle" :error="errors.current_password?.[0]">
        <Password input-id="profile-current-password" v-model="form.current_password" class="w-full" input-class="w-full" :feedback="false" toggle-mask />
      </FormField>
      <FormField :label="t('auth.password')" input-id="profile-password" variant="subtle" :error="errors.password?.[0]">
        <Password input-id="profile-password" v-model="form.password" class="w-full" input-class="w-full" toggle-mask />
      </FormField>
      <FormField :label="t('auth.passwordConfirm')" input-id="profile-password-confirm" variant="subtle">
        <Password input-id="profile-password-confirm" v-model="form.password_confirmation" class="w-full" input-class="w-full" :feedback="false" toggle-mask />
      </FormField>

      <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general[0] }}</Message>

      <Button type="submit" :label="t('common.save')" class="w-full" :loading="submitting" />
    </form>
  </div>
</template>
