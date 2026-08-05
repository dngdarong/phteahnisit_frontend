<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import roomService from '@/services/room.service'
import RoomCard from '@/components/RoomCard.vue'
import Button from 'primevue/button'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import RejectDialog from '@/components/RejectDialog.vue'

const { t } = useI18n()
const toast = useToast()

const rooms = ref([])
const loading = ref(true)
const rejectDialogRoom = ref(null)
const rejectReason = ref('')
const approvingIds = reactive(new Set())
const rejecting = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await roomService.pending()
    rooms.value = data.data
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    loading.value = false
  }
}

async function approve(room) {
  if (approvingIds.has(room.id)) return
  approvingIds.add(room.id)
  try {
    await roomService.approve(room.id)
    toast.add({ severity: 'success', summary: t('room.approvedToast', { title: room.title }), life: 3000 })
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || t('common.loadFailed'), life: 4000 })
  } finally {
    approvingIds.delete(room.id)
  }
}

function openReject(room) {
  rejectDialogRoom.value = room
  rejectReason.value = ''
}

async function confirmReject() {
  if (rejecting.value) return
  rejecting.value = true
  try {
    await roomService.reject(rejectDialogRoom.value.id, rejectReason.value)
    toast.add({ severity: 'info', summary: t('room.rejectedToast', { title: rejectDialogRoom.value.title }), life: 3000 })
    rejectDialogRoom.value = null
    load()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || t('common.loadFailed'), life: 4000 })
  } finally {
    rejecting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="mb-6 text-h1 text-brand-900">{{ t('nav.pendingApprovals') }}</h1>

    <div v-if="loading" class="grid place-items-center py-20">
      <LoadingSpinner />
    </div>

    <EmptyState v-else-if="rooms.length === 0" variant="plain" :title="t('room.noneWaiting')" />

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="room in rooms" :key="room.id" class="space-y-2">
        <RoomCard :room="room" show-status />
        <p class="text-xs text-brand-500">{{ t('room.owner') }}: {{ room.landlord?.name }} · {{ room.landlord?.phone }}</p>
        <div class="flex gap-2">
          <Button
            :label="t('room.approve')"
            icon="pi pi-check"
            size="small"
            class="flex-1"
            :loading="approvingIds.has(room.id)"
            :disabled="approvingIds.has(room.id)"
            @click="approve(room)"
          />
          <Button :label="t('room.reject')" icon="pi pi-times" size="small" severity="danger" outlined :disabled="approvingIds.has(room.id)" @click="openReject(room)" />
        </div>
      </div>
    </div>

    <RejectDialog
      :visible="!!rejectDialogRoom"
      v-model:reason="rejectReason"
      :header="t('room.rejectListing')"
      :hint="t('room.rejectReasonHint')"
      :loading="rejecting"
      @update:visible="(v) => !v && (rejectDialogRoom = null)"
      @cancel="rejectDialogRoom = null"
      @confirm="confirmReject"
    />
  </div>
</template>
