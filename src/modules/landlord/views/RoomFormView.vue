<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import roomService from '@/services/room.service'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({ id: { type: [String, Number], default: null } })
const isEdit = computed(() => !!props.id)

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const form = reactive({
  title: '',
  description: '',
  price: null,
  province: null,
  district: '',
  commune: '',
  address: '',
  latitude: null,
  longitude: null,
  room_type: 'single_room',
  available: true,
})
const newImages = ref([])
const errors = ref({})
const submitting = ref(false)
const loadingExisting = ref(false)
const wasApproved = ref(false)

const provinces = [
  'Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham',
  'Preah Sihanouk', 'Kandal', 'Kampong Speu', 'Takeo',
]
const roomTypes = [
  { label: 'Single room', value: 'single_room' },
  { label: 'Shared room', value: 'shared_room' },
  { label: 'Studio', value: 'studio' },
  { label: 'Apartment', value: 'apartment' },
]

async function loadExisting() {
  loadingExisting.value = true
  try {
    const { data } = await roomService.detail(props.id)
    const room = data.data ?? data
    Object.assign(form, {
      title: room.title,
      description: room.description,
      price: Number(room.price),
      province: room.province,
      district: room.district,
      commune: room.commune,
      address: room.address,
      latitude: room.latitude,
      longitude: room.longitude,
      room_type: room.room_type,
      available: room.available,
    })
    wasApproved.value = room.status === 'approved'
  } catch (e) {
    toast.add({ severity: 'error', summary: t('room.loadFailed'), life: 4000 })
    router.push({ name: 'landlord-rooms' })
  } finally {
    loadingExisting.value = false
  }
}

function onFilesSelect(e) {
  newImages.value = e.files
}

function buildFormData() {
  const fd = new FormData()
  Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== undefined) fd.append(key, value)
  })
  newImages.value.forEach((file) => fd.append('images[]', file))
  return fd
}

async function submit() {
  errors.value = {}
  submitting.value = true
  try {
    const fd = buildFormData()
    if (isEdit.value) {
      await roomService.update(props.id, fd)
    } else {
      await roomService.create(fd)
    }
    toast.add({ severity: 'success', summary: t('common.save'), life: 3000 })
    router.push({ name: 'landlord-rooms' })
  } catch (e) {
    if (e.response?.status === 422) {
      errors.value = e.response.data.errors || {}
    } else {
      errors.value = { general: [e.response?.data?.message || t('room.saveFailed')] }
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (isEdit.value) loadExisting()
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="mb-2 text-xl font-semibold text-brand-900">
      {{ isEdit ? t('common.edit') : t('nav.postRoom') }}
    </h1>
    <Message v-if="isEdit && wasApproved" severity="warn" :closable="false" class="mb-4">
      {{ t('room.approvedEditWarning') }}
    </Message>

    <div v-if="loadingExisting" class="grid place-items-center py-24">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.title') }}</label>
        <InputText v-model="form.title" class="w-full" required />
        <small v-if="errors.title" class="text-status-rejected">{{ errors.title[0] }}</small>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.description') }}</label>
        <Textarea v-model="form.description" class="w-full" rows="4" required />
        <small v-if="errors.description" class="text-status-rejected">{{ errors.description[0] }}</small>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.price') }} (USD/mo)</label>
          <InputNumber v-model="form.price" class="w-full" mode="currency" currency="USD" :min="0.01" required />
          <small v-if="errors.price" class="text-status-rejected">{{ errors.price[0] }}</small>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.roomType') }}</label>
          <Select v-model="form.room_type" :options="roomTypes" option-label="label" option-value="value" class="w-full" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.province') }}</label>
          <Select v-model="form.province" :options="provinces" class="w-full" required />
          <small v-if="errors.province" class="text-status-rejected">{{ errors.province[0] }}</small>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.district') }}</label>
          <InputText v-model="form.district" class="w-full" required />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.address') }}</label>
        <InputText v-model="form.address" class="w-full" required />
        <small v-if="errors.address" class="text-status-rejected">{{ errors.address[0] }}</small>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.latitude') }}</label>
          <InputNumber v-model="form.latitude" class="w-full" :min-fraction-digits="0" :max-fraction-digits="7" :min="-90" :max="90" />
          <small v-if="errors.latitude" class="text-status-rejected">{{ errors.latitude[0] }}</small>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.longitude') }}</label>
          <InputNumber v-model="form.longitude" class="w-full" :min-fraction-digits="0" :max-fraction-digits="7" :min="-180" :max="180" />
          <small v-if="errors.longitude" class="text-status-rejected">{{ errors.longitude[0] }}</small>
        </div>
      </div>
      <p class="-mt-2 text-xs text-brand-500">{{ t('room.locationHint') }}</p>

      <div class="flex items-center gap-3">
        <ToggleSwitch v-model="form.available" />
        <span class="text-sm text-brand-700">{{ t('room.available') }}</span>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">{{ t('room.photos') }}</label>
        <FileUpload
          mode="basic"
          multiple
          accept="image/jpeg,image/png,image/webp"
          :auto="false"
          :choose-label="t('room.choosePhotos')"
          @select="onFilesSelect"
        />
        <small v-if="errors.images" class="text-status-rejected">{{ errors.images[0] }}</small>
      </div>

      <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general[0] }}</Message>

      <Button type="submit" :label="t('common.save')" :loading="submitting" />
    </form>
  </div>
</template>
