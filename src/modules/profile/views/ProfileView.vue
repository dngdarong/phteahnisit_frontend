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
    <h1 class="mb-6 text-xl font-semibold text-brand-900">{{ t('nav.profile') }}</h1>

    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.name') }}</label>
        <InputText v-model="form.name" class="w-full" />
        <small v-if="errors.name" class="text-status-rejected">{{ errors.name[0] }}</small>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.email') }}</label>
        <InputText v-model="form.email" type="email" class="w-full" />
        <small v-if="errors.email" class="text-status-rejected">{{ errors.email[0] }}</small>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.phone') }}</label>
        <InputText v-model="form.phone" class="w-full" />
        <small v-if="errors.phone" class="text-status-rejected">{{ errors.phone[0] }}</small>
      </div>

      <hr class="border-brand-100" />
      <p class="text-sm font-medium text-brand-700">{{ t('auth.changePasswordOptional') }}</p>

      <div>
        <label class="mb-1 block text-sm text-brand-600">{{ t('auth.currentPassword') }}</label>
        <Password v-model="form.current_password" class="w-full" input-class="w-full" :feedback="false" toggle-mask />
        <small v-if="errors.current_password" class="text-status-rejected">{{ errors.current_password[0] }}</small>
      </div>
      <div>
        <label class="mb-1 block text-sm text-brand-600">{{ t('auth.password') }}</label>
        <Password v-model="form.password" class="w-full" input-class="w-full" toggle-mask />
        <small v-if="errors.password" class="text-status-rejected">{{ errors.password[0] }}</small>
      </div>
      <div>
        <label class="mb-1 block text-sm text-brand-600">{{ t('auth.passwordConfirm') }}</label>
        <Password v-model="form.password_confirmation" class="w-full" input-class="w-full" :feedback="false" toggle-mask />
      </div>

      <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general[0] }}</Message>

      <Button type="submit" :label="t('common.save')" class="w-full" :loading="submitting" />
    </form>
  </div>
</template>
