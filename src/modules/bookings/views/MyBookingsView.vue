<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import bookingService from '@/services/booking.service'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const bookings = ref([])
const loading = ref(true)

const statusSeverity = { pending: 'warn', approved: 'success', rejected: 'danger', cancelled: 'secondary' }

async function load() {
  loading.value = true
  try {
    const { data } = await bookingService.list()
    bookings.value = data.data
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    loading.value = false
  }
}

function confirmCancel(booking) {
  confirm.require({
    message: t('booking.cancelConfirm', { title: booking.room.title }),
    header: t('booking.cancelBooking'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await bookingService.cancel(booking.id)
        toast.add({ severity: 'success', summary: t('booking.cancelled'), life: 3000 })
        load()
      } catch (e) {
        toast.add({ severity: 'error', summary: e.response?.data?.message || t('booking.requestFailed'), life: 4000 })
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="mb-6 text-xl font-semibold text-brand-900">{{ t('nav.myBookings') }}</h1>

    <div v-if="loading" class="grid place-items-center py-20">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <div v-else-if="bookings.length === 0" class="rounded-card border border-dashed border-brand-200 py-16 text-center">
      <i class="pi pi-calendar mb-3 text-3xl text-brand-300" />
      <p class="font-medium text-brand-800">{{ t('booking.noneYet') }}</p>
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
              {{ t('booking.moveInDate') }}: {{ booking.move_in_date }} &middot;
              {{ booking.duration_months }} {{ t('booking.months') }}
            </p>
          </div>
          <Tag :value="t(`booking.status.${booking.status}`)" :severity="statusSeverity[booking.status]" />
        </div>
        <Button
          v-if="booking.status === 'pending'"
          :label="t('booking.cancelBooking')"
          icon="pi pi-times"
          size="small"
          severity="danger"
          outlined
          class="mt-3"
          @click="confirmCancel(booking)"
        />
      </div>
    </div>
  </div>
</template>
