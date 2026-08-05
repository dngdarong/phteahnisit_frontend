<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import favoriteService from '@/services/favorite.service'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  room: { type: Object, required: true },
  showStatus: { type: Boolean, default: false },
  showFavorite: { type: Boolean, default: false },
})

const emit = defineEmits(['unfavorited'])

const { t } = useI18n()
const toast = useToast()

const thumbnail = computed(() => props.room.images?.[0]?.url ?? null)
const formattedPrice = computed(() => `$${Number(props.room.price).toFixed(0)}`)
const imageFailed = ref(false)

const isFavorited = ref(props.room.is_favorited ?? false)
const togglingFavorite = ref(false)

async function toggleFavorite(event) {
  event.preventDefault() // this card is a router-link - don't navigate on heart click
  event.stopPropagation()
  if (togglingFavorite.value) return

  togglingFavorite.value = true
  try {
    const { data } = await favoriteService.toggle(props.room.id)
    isFavorited.value = data.is_favorited
    if (!data.is_favorited) emit('unfavorited', props.room.id)
  } catch (e) {
    toast.add({ severity: 'error', summary: t('favorites.toggleFailed'), life: 4000 })
  } finally {
    togglingFavorite.value = false
  }
}
</script>

<template>
  <router-link
    :to="{ name: 'room-detail', params: { id: room.id } }"
    class="group block overflow-hidden rounded-card border border-brand-100 bg-white transition duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5"
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

      <button
        v-if="showFavorite"
        type="button"
        class="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand-700 transition hover:bg-white"
        :aria-label="t('favorites.toggle')"
        :disabled="togglingFavorite"
        @click="toggleFavorite"
      >
        <i class="pi text-sm" :class="isFavorited ? 'pi-heart-fill text-status-rejected' : 'pi-heart'" />
      </button>
    </div>

    <div class="space-y-1 p-4">
      <p class="truncate font-medium text-brand-900">{{ room.title }}</p>
      <p class="truncate text-sm text-brand-600">{{ room.district }}, {{ room.province }}</p>
      <p class="pt-1 font-semibold text-brand-700">{{ formattedPrice }} <span class="text-xs font-normal text-brand-500">{{ t('room.perMonthShort') }}</span></p>
    </div>
  </router-link>
</template>
