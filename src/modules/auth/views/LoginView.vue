<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.email, form.password)
    toast.add({ severity: 'success', summary: t('auth.loginSuccess'), life: 3000 })
    router.push(route.query.redirect || { name: 'home' })
  } catch (e) {
    error.value = e.response?.data?.message || t('auth.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm px-4 py-16">
    <h1 class="mb-6 text-xl font-semibold text-brand-900">{{ t('auth.loginTitle') }}</h1>

    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.email') }}</label>
        <InputText v-model="form.email" type="email" class="w-full" required autocomplete="email" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.password') }}</label>
        <Password v-model="form.password" class="w-full" input-class="w-full" :feedback="false" toggle-mask required autocomplete="current-password" />
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <Button type="submit" :label="t('nav.login')" class="w-full" :loading="loading" />
    </form>

    <p class="mt-6 text-center text-sm text-brand-600">
      <router-link :to="{ name: 'register-student' }" class="font-medium text-brand-700 hover:underline">{{ t('nav.registerStudent') }}</router-link>
      ·
      <router-link :to="{ name: 'register-landlord' }" class="font-medium text-brand-700 hover:underline">{{ t('nav.registerLandlord') }}</router-link>
    </p>
  </div>
</template>
