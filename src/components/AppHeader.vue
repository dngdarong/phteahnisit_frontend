<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { ref } from 'vue'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const menu = ref()

const menuItems = computed(() => {
  const items = [{ label: t('nav.profile'), icon: 'pi pi-user', command: () => router.push({ name: 'profile' }) }]

  if (auth.isLandlord) {
    items.unshift({
      label: t('nav.myRooms'),
      icon: 'pi pi-home',
      command: () => router.push({ name: 'landlord-rooms' }),
    })
  }
  if (auth.isAdmin) {
    items.unshift(
      { label: t('nav.users'), icon: 'pi pi-users', command: () => router.push({ name: 'admin-users' }) },
      { label: t('nav.pendingApprovals'), icon: 'pi pi-check-square', command: () => router.push({ name: 'admin-rooms' }) },
    )
  }

  items.push({
    label: t('nav.logout'),
    icon: 'pi pi-sign-out',
    command: async () => {
      await auth.logout()
      router.push({ name: 'home' })
    },
  })
  return items
})

function toggleLocale() {
  locale.value = locale.value === 'km' ? 'en' : 'km'
  localStorage.setItem('phteahnisit_locale', locale.value)
}
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-brand-100 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <router-link :to="{ name: 'home' }" class="flex items-center gap-2">
        <span class="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white">
          <i class="pi pi-home" />
        </span>
        <span class="text-lg font-semibold text-brand-800">phteahnisit</span>
      </router-link>

      <nav class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
          @click="toggleLocale"
        >
          {{ locale === 'km' ? 'EN' : 'ខ្មែរ' }}
        </button>

        <template v-if="!auth.isAuthenticated">
          <router-link :to="{ name: 'login' }" class="text-sm font-medium text-brand-700 hover:text-brand-900">
            {{ t('nav.login') }}
          </router-link>
          <Button
            :label="t('nav.registerLandlord')"
            size="small"
            @click="router.push({ name: 'register-landlord' })"
          />
        </template>

        <template v-else>
          <Button
            v-if="auth.isLandlord"
            :label="t('nav.postRoom')"
            icon="pi pi-plus"
            size="small"
            @click="router.push({ name: 'landlord-room-create' })"
          />
          <button
            type="button"
            class="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100"
            :aria-label="t('nav.profile')"
            @click="menu.toggle($event)"
          >
            <i class="pi pi-user" />
          </button>
          <Menu ref="menu" :model="menuItems" :popup="true" />
        </template>
      </nav>
    </div>
  </header>
</template>
