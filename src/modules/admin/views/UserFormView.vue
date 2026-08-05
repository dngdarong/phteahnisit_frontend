<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import userService from '@/services/user.service'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const props = defineProps({ id: { type: [String, Number], default: null } })
const isEdit = computed(() => !!props.id)

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  role: 'student',
  status: 'active',
  password: '',
  password_confirmation: '',
})
const errors = ref({})
const submitting = ref(false)
const loadingExisting = ref(false)

const roleOptions = [
  { label: t('admin.roles.student'), value: 'student' },
  { label: t('admin.roles.landlord'), value: 'landlord' },
  { label: t('admin.roles.admin'), value: 'admin' },
]
const statusOptions = [
  { label: t('admin.statuses.active'), value: 'active' },
  { label: t('admin.statuses.inactive'), value: 'inactive' },
]

async function loadExisting() {
  loadingExisting.value = true
  try {
    const { data } = await userService.detail(props.id)
    const user = data.data ?? data
    Object.assign(form, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
    router.push({ name: 'admin-users' })
  } finally {
    loadingExisting.value = false
  }
}

async function submit() {
  errors.value = {}
  submitting.value = true
  try {
    if (isEdit.value) {
      // Edit never sends a password - admin edits don't set passwords
      // directly (Business Rules: only an explicit administrative
      // reset flow may, and none exists yet).
      await userService.update(props.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
      })
    } else {
      await userService.create(form)
    }
    toast.add({ severity: 'success', summary: t('common.save'), life: 3000 })
    router.push({ name: 'admin-users' })
  } catch (e) {
    if (e.response?.status === 422) {
      errors.value = e.response.data.errors || {}
    } else {
      errors.value = { general: [e.response?.data?.message || t('admin.saveFailed')] }
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
  <div class="mx-auto max-w-md px-4 py-8">
    <h1 class="mb-6 text-h1 text-brand-900">
      {{ isEdit ? t('admin.editUser') : t('admin.addUser') }}
    </h1>

    <div v-if="loadingExisting" class="grid place-items-center py-24">
      <LoadingSpinner />
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div>
        <label for="user-form-name" class="mb-1 block text-sm font-medium text-brand-700">{{ t('admin.name') }}</label>
        <InputText id="user-form-name" v-model="form.name" class="w-full" required />
        <small v-if="errors.name" class="text-status-rejected">{{ errors.name[0] }}</small>
      </div>
      <div>
        <label for="user-form-email" class="mb-1 block text-sm font-medium text-brand-700">{{ t('admin.email') }}</label>
        <InputText id="user-form-email" v-model="form.email" type="email" class="w-full" required />
        <small v-if="errors.email" class="text-status-rejected">{{ errors.email[0] }}</small>
      </div>
      <div>
        <label for="user-form-phone" class="mb-1 block text-sm font-medium text-brand-700">{{ t('admin.phone') }}</label>
        <InputText id="user-form-phone" v-model="form.phone" class="w-full" placeholder="012345678" required />
        <small v-if="errors.phone" class="text-status-rejected">{{ errors.phone[0] }}</small>
      </div>
      <div>
        <label for="user-form-role" class="mb-1 block text-sm font-medium text-brand-700">{{ t('admin.role') }}</label>
        <Select input-id="user-form-role" v-model="form.role" :options="roleOptions" option-label="label" option-value="value" class="w-full" />
        <small v-if="errors.role" class="text-status-rejected">{{ errors.role[0] }}</small>
      </div>
      <div v-if="isEdit">
        <label for="user-form-status" class="mb-1 block text-sm font-medium text-brand-700">{{ t('admin.status') }}</label>
        <Select input-id="user-form-status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" class="w-full" />
      </div>

      <template v-if="!isEdit">
        <div>
          <label for="user-form-password" class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.password') }}</label>
          <Password input-id="user-form-password" v-model="form.password" class="w-full" input-class="w-full" toggle-mask required autocomplete="new-password" />
          <small v-if="errors.password" class="text-status-rejected">{{ errors.password[0] }}</small>
        </div>
        <div>
          <label for="user-form-password-confirm" class="mb-1 block text-sm font-medium text-brand-700">{{ t('auth.passwordConfirm') }}</label>
          <Password input-id="user-form-password-confirm" v-model="form.password_confirmation" class="w-full" input-class="w-full" :feedback="false" toggle-mask required autocomplete="new-password" />
        </div>
      </template>
      <p v-else class="text-xs text-brand-500">{{ t('admin.editPasswordHint') }}</p>

      <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general[0] }}</Message>

      <Button type="submit" :label="t('common.save')" class="w-full" :loading="submitting" />
    </form>
  </div>
</template>
