<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import bookingService from '@/services/booking.service'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'

const { t } = useI18n()
const toast = useToast()

const bookings = ref([])
const loading = ref(true)
const rejectDialogBooking = ref(null)
const rejectReason = ref('')

const statusSeverity = { pending: 'warn', approved: 'success', rejected: 'danger', cancelled: 'secondary' }

async function load() {
  loading.value = true
  try {
    const { data } = await bookingService.landlordList()
    bookings.value = data.data
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    loading.value = false
  }
}

async function approve(booking) {
  try {
    await bookingService.approve(booking.id)
    toast.add({ severity: 'success', summary: t('booking.approvedToast'), life: 3000 })
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || t('common.loadFailed'), life: 4000 })
  }
}

function openReject(booking) {
  rejectDialogBooking.value = booking
  rejectReason.value = ''
}

async function confirmReject() {
  try {
    await bookingService.reject(rejectDialogBooking.value.id, rejectReason.value)
    toast.add({ severity: 'info', summary: t('booking.rejectedToast'), life: 3000 })
    rejectDialogBooking.value = null
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || t('common.loadFailed'), life: 4000 })
    rejectDialogBooking.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="mb-6 text-xl font-semibold text-brand-900">{{ t('nav.landlordBookings') }}</h1>

    <div v-if="loading" class="grid place-items-center py-20">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <div v-else-if="bookings.length === 0" class="rounded-card border border-dashed border-brand-200 py-16 text-center text-brand-500">
      {{ t('booking.noneToReview') }}
    </div>

    <div v-else class="space-y-3">
      <div v-for="booking in bookings" :key="booking.id" class="rounded-card border border-brand-100 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <router-link
              :to="{ name: 'room-detail', params: { id: booking.room.id } }"
              class="font-medium text-brand-900 hover:underline"
            >
              {{ booking.room.title }}
            </router-link>
            <p class="text-sm text-brand-600">
              {{ t('booking.requestedBy') }}: {{ booking.student.name }} &middot; {{ booking.student.phone }}
            </p>
            <p class="text-sm text-brand-600">
              {{ t('booking.moveInDate') }}: {{ booking.move_in_date }} &middot;
              {{ booking.duration_months }} {{ t('booking.months') }}
            </p>
          </div>
          <Tag :value="t(`booking.status.${booking.status}`)" :severity="statusSeverity[booking.status]" />
        </div>
        <div v-if="booking.status === 'pending'" class="mt-3 flex gap-2">
          <Button :label="t('room.approve')" icon="pi pi-check" size="small" @click="approve(booking)" />
          <Button :label="t('room.reject')" icon="pi pi-times" size="small" severity="danger" outlined @click="openReject(booking)" />
        </div>
      </div>
    </div>

    <Dialog v-model:visible="rejectDialogBooking" modal :header="t('booking.rejectBooking')" :style="{ width: '28rem' }">
      <p class="mb-3 text-sm text-brand-600">{{ t('room.rejectReasonHint') }}</p>
      <Textarea v-model="rejectReason" class="w-full" rows="3" />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="rejectDialogBooking = null" />
        <Button :label="t('room.reject')" severity="danger" @click="confirmReject" />
      </template>
    </Dialog>
  </div>
</template>
