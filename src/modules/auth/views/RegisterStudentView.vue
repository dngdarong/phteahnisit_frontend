<script setup>
import { useI18n } from 'vue-i18n'
import RegisterForm from '@/modules/auth/RegisterForm.vue'
const { t } = useI18n()
</script>

<template>
  <div class="mx-auto max-w-sm px-4 py-16">
    <h1 class="mb-6 text-xl font-semibold text-brand-900">{{ t('nav.registerStudent') }}</h1>
    <RegisterForm role="student" />
  </div>
</template>
