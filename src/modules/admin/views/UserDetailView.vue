<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import userService from '@/services/user.service'
import Button from 'primevue/button'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const user = ref(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data } = await userService.detail(props.id)
    user.value = data.data ?? data
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
    router.push({ name: 'admin-users' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-8">
    <div v-if="loading" class="grid place-items-center py-24">
      <LoadingSpinner />
    </div>

    <template v-else-if="user">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-h1 text-brand-900">{{ user.name }}</h1>
        <span class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          {{ t(`admin.roles.${user.role}`) }}
        </span>
      </div>

      <div class="space-y-3 rounded-card border border-brand-100 bg-white p-5">
        <div class="flex justify-between text-sm">
          <span class="text-brand-500">{{ t('admin.email') }}</span>
          <span class="font-medium text-brand-900">{{ user.email }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-brand-500">{{ t('admin.phone') }}</span>
          <span class="font-medium text-brand-900">{{ user.phone }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-brand-500">{{ t('admin.status') }}</span>
          <StatusBadge domain="user" :status="user.status" />
        </div>
        <div v-if="user.rooms_count !== undefined" class="flex justify-between text-sm">
          <span class="text-brand-500">{{ t('admin.roomsCount') }}</span>
          <span class="font-medium text-brand-900">{{ user.rooms_count }}</span>
        </div>
        <div v-if="user.bookings_count !== undefined" class="flex justify-between text-sm">
          <span class="text-brand-500">{{ t('admin.bookingsCount') }}</span>
          <span class="font-medium text-brand-900">{{ user.bookings_count }}</span>
        </div>
        <div v-if="user.favorites_count !== undefined" class="flex justify-between text-sm">
          <span class="text-brand-500">{{ t('admin.favoritesCount') }}</span>
          <span class="font-medium text-brand-900">{{ user.favorites_count }}</span>
        </div>
      </div>

      <div class="mt-6 flex gap-2">
        <Button
          :label="t('common.edit')"
          icon="pi pi-pencil"
          outlined
          class="flex-1"
          @click="router.push({ name: 'admin-user-edit', params: { id: user.id } })"
        />
        <Button :label="t('common.cancel')" text @click="router.push({ name: 'admin-users' })" />
      </div>
    </template>
  </div>
</template>
