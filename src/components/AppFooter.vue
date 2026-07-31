<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-brand-100 bg-brand-50/50 py-6 text-center text-sm text-brand-700">
    <p>phteahnisit (ផ្ទះនិស្សិត) — {{ new Date().getFullYear() }}</p>
  </footer>
</template>
