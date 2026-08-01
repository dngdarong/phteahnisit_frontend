<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import roomService from '@/services/room.service'
import ProgressSpinner from 'primevue/progressspinner'

const { t } = useI18n()

const rooms = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data } = await roomService.map()
    rooms.value = data.data
  } finally {
    loading.value = false
  }
}

function directionsUrl(room) {
  return `https://www.google.com/maps/search/?api=1&query=${room.latitude},${room.longitude}`
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="mb-1 text-xl font-semibold text-brand-900">{{ t('room.mapTitle') }}</h1>
    <p class="mb-6 text-sm text-brand-500">{{ t('room.mapHint') }}</p>

    <div v-if="loading" class="grid place-items-center py-20">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <div v-else-if="rooms.length === 0" class="rounded-card border border-dashed border-brand-200 py-16 text-center text-brand-500">
      {{ t('room.noPinnedRooms') }}
    </div>

    <div v-else class="space-y-3">
      <div v-for="room in rooms" :key="room.id" class="flex items-center gap-3 rounded-card border border-brand-100 p-4">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
          <i class="pi pi-map-marker" />
        </span>
        <div class="min-w-0 flex-1">
          <router-link :to="{ name: 'room-detail', params: { id: room.id } }" class="font-medium text-brand-900 hover:underline">
            {{ room.title }}
          </router-link>
          <p class="truncate text-sm text-brand-500">{{ room.district }}, {{ room.province }} &middot; ${{ Number(room.price).toFixed(0) }}{{ t('room.perMonthShort') }}</p>
        </div>
        <a :href="directionsUrl(room)" target="_blank" rel="noopener" class="shrink-0 text-sm font-medium text-brand-700 hover:underline">
          {{ t('room.openInMaps') }}
        </a>
      </div>
    </div>
  </div>
</template>
