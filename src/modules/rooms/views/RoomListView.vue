<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import roomService from '@/services/room.service'
import RoomCard from '@/components/RoomCard.vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'

const { t } = useI18n()
const auth = useAuthStore()

const rooms = ref([])
const loading = ref(false)
const total = ref(0)
const filters = reactive({
  keyword: '',
  province: null,
  room_type: null,
  per_page: 12,
})
const page = ref(0) // Paginator is 0-indexed

const provinces = [
  'Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham',
  'Preah Sihanouk', 'Kandal', 'Kampong Speu', 'Takeo',
]
const roomTypes = [
  { label: 'Single room', value: 'single_room' },
  { label: 'Shared room', value: 'shared_room' },
  { label: 'Studio', value: 'studio' },
  { label: 'Apartment', value: 'apartment' },
]

async function load() {
  loading.value = true
  try {
    const { data } = await roomService.search({
      ...filters,
      page: page.value + 1,
    })
    rooms.value = data.data
    total.value = data.meta?.total ?? data.data.length
  } finally {
    loading.value = false
  }
}

function onPageChange(e) {
  page.value = e.page
  load()
}

let debounceTimer
watch(filters, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 0
    load()
  }, 350)
}, { deep: true })

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row">
      <span class="flex-1">
        <InputText v-model="filters.keyword" class="w-full" :placeholder="t('room.searchPlaceholder')" />
      </span>
      <Select
        v-model="filters.province"
        :options="provinces"
        show-clear
        :placeholder="t('room.province')"
        class="w-full sm:w-48"
      />
      <Select
        v-model="filters.room_type"
        :options="roomTypes"
        option-label="label"
        option-value="value"
        show-clear
        :placeholder="t('room.roomType')"
        class="w-full sm:w-48"
      />
      <router-link
        :to="{ name: 'room-map' }"
        class="flex items-center justify-center gap-1.5 rounded-md border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 sm:w-auto"
      >
        <i class="pi pi-map-marker" />
        {{ t('room.viewOnMap') }}
      </router-link>
    </div>

    <div v-if="loading" class="grid place-items-center py-20">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <div v-else-if="rooms.length === 0" class="rounded-card border border-dashed border-brand-200 py-16 text-center">
      <i class="pi pi-search mb-3 text-3xl text-brand-300" />
      <p class="font-medium text-brand-800">{{ t('room.noResults') }}</p>
      <p class="text-sm text-brand-500">{{ t('room.noResultsHint') }}</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RoomCard v-for="room in rooms" :key="room.id" :room="room" :show-favorite="auth.isStudent" />
    </div>

    <Paginator
      v-if="total > filters.per_page"
      class="mt-6"
      :rows="filters.per_page"
      :total-records="total"
      :first="page * filters.per_page"
      @page="onPageChange"
    />
  </div>
</template>
