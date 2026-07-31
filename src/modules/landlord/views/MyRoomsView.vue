<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import roomService from '@/services/room.service'
import RoomCard from '@/components/RoomCard.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const { t } = useI18n()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const rooms = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data } = await roomService.mine()
  rooms.value = data.data
  loading.value = false
}

function confirmDelete(room) {
  confirm.require({
    message: `Delete "${room.title}"? This can't be undone from here.`,
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await roomService.remove(room.id)
      toast.add({ severity: 'success', summary: 'Room deleted', life: 3000 })
      load()
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-brand-900">{{ t('nav.myRooms') }}</h1>
      <Button :label="t('nav.postRoom')" icon="pi pi-plus" @click="router.push({ name: 'landlord-room-create' })" />
    </div>

    <div v-if="loading" class="grid place-items-center py-20">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" stroke-width="4" />
    </div>

    <div v-else-if="rooms.length === 0" class="rounded-card border border-dashed border-brand-200 py-16 text-center">
      <p class="font-medium text-brand-800">{{ t('room.noResults') }}</p>
      <p class="text-sm text-brand-500">Post your first room to get started.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="room in rooms" :key="room.id" class="space-y-2">
        <RoomCard :room="room" show-status />
        <div class="flex gap-2">
          <Button
            :label="t('common.edit')"
            icon="pi pi-pencil"
            size="small"
            outlined
            class="flex-1"
            @click="router.push({ name: 'landlord-room-edit', params: { id: room.id } })"
          />
          <Button
            :label="t('common.delete')"
            icon="pi pi-trash"
            size="small"
            severity="danger"
            outlined
            @click="confirmDelete(room)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
