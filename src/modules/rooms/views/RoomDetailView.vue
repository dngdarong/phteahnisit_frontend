<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import roomService from '@/services/room.service'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Galleria from 'primevue/galleria'

const props = defineProps({ id: { type: [String, Number], required: true } })
const { t } = useI18n()

const room = ref(null)
const loading = ref(true)
const notFound = ref(false)
const failedImages = reactive(new Set())

async function load() {
  loading.value = true
  try {
    const { data } = await roomService.detail(props.id)
    room.value = data.data ?? data
  } catch (e) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

const formattedPrice = computed(() => (room.value ? `$${Number(room.value.price).toFixed(0)}` : ''))
const roomTypeLabel = computed(() =>
  room.value?.room_type?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '',
)
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div v-if="loading" class="grid place-items-center py-24">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <div v-else-if="notFound" class="py-24 text-center text-brand-600">
      {{ t('room.notFound') }}
    </div>

    <div v-else-if="room" class="space-y-6">
      <Galleria
        v-if="room.images?.length"
        :value="room.images"
        :num-visible="5"
        :show-thumbnails="room.images.length > 1"
        class="overflow-hidden rounded-card"
      >
        <template #item="slotProps">
          <img
            v-if="!failedImages.has(slotProps.item.url)"
            :src="slotProps.item.url"
            :alt="room.title"
            class="aspect-video w-full object-cover"
            @error="failedImages.add(slotProps.item.url)"
          />
          <div v-else class="grid aspect-video place-items-center bg-brand-50 text-brand-300">
            <i class="pi pi-image text-4xl" />
          </div>
        </template>
        <template #thumbnail="slotProps">
          <img
            v-if="!failedImages.has(slotProps.item.url)"
            :src="slotProps.item.url"
            class="h-16 w-24 object-cover"
            @error="failedImages.add(slotProps.item.url)"
          />
          <div v-else class="grid h-16 w-24 place-items-center bg-brand-50 text-brand-300">
            <i class="pi pi-image" />
          </div>
        </template>
      </Galleria>
      <div v-else class="grid aspect-video place-items-center rounded-card bg-brand-50 text-brand-300">
        <i class="pi pi-image text-4xl" />
      </div>

      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-brand-900">{{ room.title }}</h1>
          <p class="text-brand-600">{{ room.address }}, {{ room.district }}, {{ room.province }}</p>
        </div>
        <p class="text-2xl font-semibold text-brand-700">
          {{ formattedPrice }} <span class="text-sm font-normal text-brand-500">{{ t('room.perMonthLong') }}</span>
        </p>
      </div>

      <div class="flex flex-wrap gap-2 text-sm">
        <span class="rounded-full bg-brand-50 px-3 py-1 text-brand-700">{{ roomTypeLabel }}</span>
        <span
          class="rounded-full px-3 py-1"
          :class="room.available ? 'bg-brand-50 text-brand-700' : 'bg-brand-100 text-brand-500'"
        >
          {{ room.available ? t('room.available') : t('room.unavailable') }}
        </span>
      </div>

      <p class="whitespace-pre-line leading-relaxed text-brand-800">{{ room.description }}</p>

      <div v-if="room.landlord" class="rounded-card border border-brand-100 p-5">
        <p class="mb-1 text-sm text-brand-500">{{ t('room.contactLandlord') }}</p>
        <p class="font-medium text-brand-900">{{ room.landlord.name }}</p>
        <a :href="`tel:${room.landlord.phone}`">
          <Button :label="room.landlord.phone" icon="pi pi-phone" class="mt-2" />
        </a>
      </div>
    </div>
  </div>
</template>
