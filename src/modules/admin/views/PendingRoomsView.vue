<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import roomService from '@/services/room.service'
import RoomCard from '@/components/RoomCard.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'

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
    <h1 class="mb-6 text-xl font-semibold text-brand-900">{{ t('nav.pendingApprovals') }}</h1>

    <div v-if="loading" class="grid place-items-center py-20">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <div v-else-if="rooms.length === 0" class="rounded-card border border-dashed border-brand-200 py-16 text-center text-brand-500">
      {{ t('room.noneWaiting') }}
    </div>

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

    <Dialog v-model:visible="rejectDialogRoom" modal :header="t('room.rejectListing')" :style="{ width: '28rem' }">
      <p class="mb-3 text-sm text-brand-600">{{ t('room.rejectReasonHint') }}</p>
      <Textarea v-model="rejectReason" class="w-full" rows="3" />
      <template #footer>
        <Button :label="t('common.cancel')" text :disabled="rejecting" @click="rejectDialogRoom = null" />
        <Button :label="t('room.reject')" severity="danger" :loading="rejecting" @click="confirmReject" />
      </template>
    </Dialog>
  </div>
</template>
