<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const props = defineProps({
  role: { type: String, required: true }, // 'student' | 'landlord'
})

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const form = reactive({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
const errors = ref({})
const submitting = ref(false)

async function submit() {
  errors.value = {}
  submitting.value = true
  try {
    const action = props.role === 'student' ? auth.registerStudent : auth.registerLandlord
    await action(form)
    toast.add({ severity: 'success', summary: t('auth.registerSuccess'), life: 4000 })
    router.push({ name: 'login' })
  } catch (e) {
    if (e.response?.status === 422) {
      errors.value = e.response.data.errors || {}
    } else {
      errors.value = { general: [e.response?.data?.message || 'Registration failed.'] }
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.name') }}</label>
      <InputText v-model="form.name" class="w-full" required />
      <small v-if="errors.name" class="text-status-rejected">{{ errors.name[0] }}</small>
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.email') }}</label>
      <InputText v-model="form.email" type="email" class="w-full" required autocomplete="email" />
      <small v-if="errors.email" class="text-status-rejected">{{ errors.email[0] }}</small>
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.phone') }}</label>
      <InputText v-model="form.phone" class="w-full" placeholder="012345678" required />
      <small v-if="errors.phone" class="text-status-rejected">{{ errors.phone[0] }}</small>
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.password') }}</label>
      <Password v-model="form.password" class="w-full" input-class="w-full" toggle-mask required autocomplete="new-password" />
      <small v-if="errors.password" class="text-status-rejected">{{ errors.password[0] }}</small>
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.passwordConfirm') }}</label>
      <Password v-model="form.password_confirmation" class="w-full" input-class="w-full" :feedback="false" toggle-mask required autocomplete="new-password" />
    </div>

    <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general[0] }}</Message>

    <Button type="submit" :label="t('common.submit')" class="w-full" :loading="submitting" />
  </form>
</template>
