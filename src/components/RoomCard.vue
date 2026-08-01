<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  room: { type: Object, required: true },
  showStatus: { type: Boolean, default: false },
})

const { t } = useI18n()

const thumbnail = computed(() => props.room.images?.[0]?.url ?? null)
const formattedPrice = computed(() => `$${Number(props.room.price).toFixed(0)}`)
const imageFailed = ref(false)
</script>

<template>
  <router-link
    :to="{ name: 'room-detail', params: { id: room.id } }"
    class="group block overflow-hidden rounded-card border border-brand-100 bg-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5"
  >
    <div class="relative aspect-[4/3] bg-brand-50">
      <img
        v-if="thumbnail && !imageFailed"
        :src="thumbnail"
        :alt="room.title"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="imageFailed = true"
      />
      <div v-else class="grid h-full place-items-center text-brand-300">
        <i class="pi pi-image text-3xl" />
      </div>

      <div v-if="showStatus" class="absolute left-3 top-3">
        <StatusBadge :status="room.status" />
      </div>
      <div
        v-else-if="!room.available"
        class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-brand-700"
      >
        {{ t('room.unavailable') }}
      </div>
    </div>

    <div class="space-y-1 p-4">
      <p class="truncate font-medium text-brand-900">{{ room.title }}</p>
      <p class="truncate text-sm text-brand-600">{{ room.district }}, {{ room.province }}</p>
      <p class="pt-1 font-semibold text-brand-700">{{ formattedPrice }} <span class="text-xs font-normal text-brand-500">{{ t('room.perMonthShort') }}</span></p>
    </div>
  </router-link>
</template>
