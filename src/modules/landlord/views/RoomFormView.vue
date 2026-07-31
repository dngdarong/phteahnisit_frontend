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
  room_type: 'single_room',
  available: true,
})
const newImages = ref([])
const errors = ref({})
const submitting = ref(false)
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
    room_type: room.room_type,
    available: room.available,
  })
  wasApproved.value = room.status === 'approved'
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
      errors.value = { general: [e.response?.data?.message || 'Something went wrong.'] }
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
      Editing an approved room sends it back for admin review before it's visible to students again.
    </Message>

    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">Title</label>
        <InputText v-model="form.title" class="w-full" required />
        <small v-if="errors.title" class="text-status-rejected">{{ errors.title[0] }}</small>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">Description</label>
        <Textarea v-model="form.description" class="w-full" rows="4" required />
        <small v-if="errors.description" class="text-status-rejected">{{ errors.description[0] }}</small>
      </div>

      <div class="grid grid-cols-2 gap-4">
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

      <div class="grid grid-cols-2 gap-4">
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
        <label class="mb-1 block text-sm font-medium text-brand-700">Address</label>
        <InputText v-model="form.address" class="w-full" required />
        <small v-if="errors.address" class="text-status-rejected">{{ errors.address[0] }}</small>
      </div>

      <div class="flex items-center gap-3">
        <ToggleSwitch v-model="form.available" />
        <span class="text-sm text-brand-700">{{ t('room.available') }}</span>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-brand-700">Photos (JPEG, PNG, or WEBP)</label>
        <FileUpload
          mode="basic"
          multiple
          accept="image/jpeg,image/png,image/webp"
          :auto="false"
          choose-label="Choose photos"
          @select="onFilesSelect"
        />
        <small v-if="errors.images" class="text-status-rejected">{{ errors.images[0] }}</small>
      </div>

      <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general[0] }}</Message>

      <Button type="submit" :label="t('common.save')" :loading="submitting" />
    </form>
  </div>
</template>
