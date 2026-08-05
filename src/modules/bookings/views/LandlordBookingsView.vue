<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import bookingService from '@/services/booking.service'
import Button from 'primevue/button'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import RejectDialog from '@/components/RejectDialog.vue'

const { t } = useI18n()
const toast = useToast()

const bookings = ref([])
const loading = ref(true)
const rejectDialogBooking = ref(null)
const rejectReason = ref('')
const approvingIds = reactive(new Set())
const rejecting = ref(false)

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
  if (approvingIds.has(booking.id)) return
  approvingIds.add(booking.id)
  try {
    await bookingService.approve(booking.id)
    toast.add({ severity: 'success', summary: t('booking.approvedToast'), life: 3000 })
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || t('common.loadFailed'), life: 4000 })
  } finally {
    approvingIds.delete(booking.id)
  }
}

function openReject(booking) {
  rejectDialogBooking.value = booking
  rejectReason.value = ''
}

async function confirmReject() {
  if (rejecting.value) return
  rejecting.value = true
  try {
    await bookingService.reject(rejectDialogBooking.value.id, rejectReason.value)
    toast.add({ severity: 'info', summary: t('booking.rejectedToast'), life: 3000 })
    rejectDialogBooking.value = null
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || t('common.loadFailed'), life: 4000 })
    rejectDialogBooking.value = null
  } finally {
    rejecting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="mb-6 text-h1 text-brand-900">{{ t('nav.landlordBookings') }}</h1>

    <div v-if="loading" class="grid place-items-center py-20">
      <LoadingSpinner />
    </div>

    <EmptyState v-else-if="bookings.length === 0" variant="plain" :title="t('booking.noneToReview')" />

    <div v-else class="space-y-3">
      <div v-for="booking in bookings" :key="booking.id" class="rounded-card border border-brand-100 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <router-link
              v-if="booking.room"
              :to="{ name: 'room-detail', params: { id: booking.room.id } }"
              class="font-medium text-brand-900 hover:underline focus-visible:underline"
            >
              {{ booking.room.title }}
            </router-link>
            <p v-else class="font-medium italic text-brand-400">{{ t('booking.roomUnavailable') }}</p>
            <p v-if="booking.student" class="text-sm text-brand-600">
              {{ t('booking.requestedBy') }}: {{ booking.student.name }} &middot; {{ booking.student.phone }}
            </p>
            <p v-else class="text-sm italic text-brand-400">{{ t('booking.requesterUnavailable') }}</p>
            <p class="text-sm text-brand-600">
              {{ t('booking.moveInDate') }}: {{ booking.move_in_date }} &middot;
              {{ booking.duration_months }} {{ t('booking.months') }}
            </p>
          </div>
          <StatusBadge domain="booking" :status="booking.status" />
        </div>
        <div v-if="booking.status === 'pending'" class="mt-3 flex gap-2">
          <Button
            :label="t('room.approve')"
            icon="pi pi-check"
            size="small"
            :loading="approvingIds.has(booking.id)"
            :disabled="approvingIds.has(booking.id)"
            @click="approve(booking)"
          />
          <Button :label="t('room.reject')" icon="pi pi-times" size="small" severity="danger" outlined :disabled="approvingIds.has(booking.id)" @click="openReject(booking)" />
        </div>
      </div>
    </div>

    <RejectDialog
      :visible="!!rejectDialogBooking"
      v-model:reason="rejectReason"
      :header="t('booking.rejectBooking')"
      :hint="t('room.rejectReasonHint')"
      :loading="rejecting"
      @update:visible="(v) => !v && (rejectDialogBooking = null)"
      @cancel="rejectDialogBooking = null"
      @confirm="confirmReject"
    />
  </div>
</template>
