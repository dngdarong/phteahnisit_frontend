<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import roomService from '@/services/room.service'
import favoriteService from '@/services/favorite.service'
import bookingService from '@/services/booking.service'
import chatService from '@/services/chat.service'
import Button from 'primevue/button'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Galleria from 'primevue/galleria'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import FormField from '@/components/FormField.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const room = ref(null)
const loading = ref(true)
const notFound = ref(false)
const failedImages = reactive(new Set())

async function load() {
  loading.value = true
  try {
    const { data } = await roomService.detail(props.id)
    room.value = data.data ?? data
    isFavorited.value = room.value.is_favorited ?? false
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
const isBookable = computed(() => room.value?.status === 'approved' && room.value?.available)

// --- Favorite ---
const isFavorited = ref(false)
const togglingFavorite = ref(false)

async function toggleFavorite() {
  if (togglingFavorite.value) return
  togglingFavorite.value = true
  try {
    const { data } = await favoriteService.toggle(room.value.id)
    isFavorited.value = data.is_favorited
  } catch (e) {
    toast.add({ severity: 'error', summary: t('favorites.toggleFailed'), life: 4000 })
  } finally {
    togglingFavorite.value = false
  }
}

// --- Booking ---
const showBookingForm = ref(false)
const bookingForm = reactive({ move_in_date: null, duration_months: 1 })
const bookingErrors = ref({})
const submittingBooking = ref(false)

// toISOString() converts through UTC, which silently shifts the date back a
// day in any positive-UTC-offset timezone (e.g. Cambodia, UTC+7) - format
// from the DatePicker's local date parts instead.
function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function submitBooking() {
  bookingErrors.value = {}
  submittingBooking.value = true
  try {
    await bookingService.create({
      room_id: room.value.id,
      move_in_date: bookingForm.move_in_date ? toLocalDateString(bookingForm.move_in_date) : null,
      duration_months: bookingForm.duration_months,
    })
    toast.add({ severity: 'success', summary: t('booking.requestSent'), life: 4000 })
    showBookingForm.value = false
    router.push({ name: 'my-bookings' })
  } catch (e) {
    bookingErrors.value = e.response?.data?.errors || { general: [e.response?.data?.message || t('booking.requestFailed')] }
  } finally {
    submittingBooking.value = false
  }
}

// --- Chat ---
const showMessageForm = ref(false)
const messageBody = ref('')
const sendingMessage = ref(false)

async function sendMessage() {
  if (!messageBody.value.trim() || sendingMessage.value) return
  sendingMessage.value = true
  try {
    const { data } = await chatService.sendToRoom(room.value.id, messageBody.value.trim())
    router.push({ name: 'chat-thread', params: { id: data.data.conversation_id } })
  } catch (e) {
    toast.add({ severity: 'error', summary: t('chat.sendFailed'), life: 4000 })
  } finally {
    sendingMessage.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div v-if="loading" class="grid place-items-center py-24">
      <LoadingSpinner />
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
            loading="lazy"
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
            :alt="room.title"
            class="h-16 w-24 object-cover"
            loading="lazy"
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
        <div class="flex items-center gap-3">
          <p class="text-2xl font-semibold text-brand-700">
            {{ formattedPrice }} <span class="text-sm font-normal text-brand-500">{{ t('room.perMonthLong') }}</span>
          </p>
          <button
            v-if="auth.isStudent"
            type="button"
            class="grid h-10 w-10 place-items-center rounded-full border border-brand-200 text-brand-700 transition-colors duration-[var(--motion-fast)] hover:bg-brand-50 focus-visible:bg-brand-50"
            :aria-label="t('favorites.toggle')"
            :disabled="togglingFavorite"
            @click="toggleFavorite"
          >
            <i class="pi text-lg" :class="isFavorited ? 'pi-heart-fill text-status-rejected' : 'pi-heart'" />
          </button>
        </div>
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
        <div class="mt-2 flex flex-wrap gap-2">
          <a :href="`tel:${room.landlord.phone}`">
            <Button :label="room.landlord.phone" icon="pi pi-phone" />
          </a>
          <Button
            v-if="auth.isStudent"
            :label="t('chat.message')"
            icon="pi pi-comment"
            outlined
            @click="showMessageForm = !showMessageForm"
          />
        </div>

        <div v-if="showMessageForm" class="mt-4 space-y-2 border-t border-brand-100 pt-4">
          <Textarea v-model="messageBody" class="w-full" rows="3" :placeholder="t('chat.messagePlaceholder')" />
          <Button :label="t('chat.send')" icon="pi pi-send" :loading="sendingMessage" @click="sendMessage" />
        </div>
      </div>

      <div v-if="auth.isStudent && isBookable" class="rounded-card border border-brand-100 p-5">
        <div class="flex items-center justify-between">
          <p class="font-medium text-brand-900">{{ t('booking.bookThisRoom') }}</p>
          <Button
            v-if="!showBookingForm"
            :label="t('booking.requestToBook')"
            icon="pi pi-calendar-plus"
            @click="showBookingForm = true"
          />
        </div>

        <form v-if="showBookingForm" class="mt-4 space-y-4" @submit.prevent="submitBooking">
          <FormField :label="t('booking.moveInDate')" input-id="booking-move-in-date" :error="bookingErrors.move_in_date?.[0]">
            <DatePicker input-id="booking-move-in-date" v-model="bookingForm.move_in_date" class="w-full" show-icon :min-date="new Date()" />
          </FormField>
          <FormField :label="t('booking.durationMonths')" input-id="booking-duration-months" :error="bookingErrors.duration_months?.[0]">
            <InputNumber input-id="booking-duration-months" v-model="bookingForm.duration_months" class="w-full" :min="1" :max="36" show-buttons />
          </FormField>
          <Message v-if="bookingErrors.room" severity="error" :closable="false">{{ bookingErrors.room[0] }}</Message>
          <Message v-if="bookingErrors.general" severity="error" :closable="false">{{ bookingErrors.general[0] }}</Message>
          <div class="flex gap-2">
            <Button type="submit" :label="t('booking.submitRequest')" :loading="submittingBooking" />
            <Button type="button" :label="t('common.cancel')" text @click="showBookingForm = false" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
