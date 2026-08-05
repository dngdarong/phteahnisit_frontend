<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import favoriteService from '@/services/favorite.service'
import RoomCard from '@/components/RoomCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()
const toast = useToast()

const rooms = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data } = await favoriteService.list()
    rooms.value = data.data
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    loading.value = false
  }
}

function onUnfavorited(roomId) {
  rooms.value = rooms.value.filter((r) => r.id !== roomId)
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="mb-6 text-h1 text-brand-900">{{ t('nav.favorites') }}</h1>

    <div v-if="loading" class="grid place-items-center py-20">
      <LoadingSpinner />
    </div>

    <EmptyState v-else-if="rooms.length === 0" icon="pi-heart" :title="t('favorites.empty')" :hint="t('favorites.emptyHint')" />

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RoomCard
        v-for="room in rooms"
        :key="room.id"
        :room="room"
        show-favorite
        @unfavorited="onUnfavorited"
      />
    </div>
  </div>
</template>
