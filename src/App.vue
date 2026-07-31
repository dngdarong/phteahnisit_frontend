<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const auth = useAuthStore()

onMounted(() => {
  // Re-sync with the backend on load, so a status change (e.g. an
  // admin disabling this account) is caught even from a stored token.
  if (auth.isAuthenticated) {
    auth.refresh().catch(() => {})
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <Toast />
    <ConfirmDialog />
    <AppHeader />
    <main class="flex-1">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
