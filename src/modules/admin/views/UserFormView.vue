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
import FormField from '@/components/FormField.vue'

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
      <FormField :label="t('admin.name')" input-id="user-form-name" :error="errors.name?.[0]">
        <InputText id="user-form-name" v-model="form.name" class="w-full" required />
      </FormField>
      <FormField :label="t('admin.email')" input-id="user-form-email" :error="errors.email?.[0]">
        <InputText id="user-form-email" v-model="form.email" type="email" class="w-full" required />
      </FormField>
      <FormField :label="t('admin.phone')" input-id="user-form-phone" :error="errors.phone?.[0]">
        <InputText id="user-form-phone" v-model="form.phone" class="w-full" placeholder="012345678" required />
      </FormField>
      <FormField :label="t('admin.role')" input-id="user-form-role" :error="errors.role?.[0]">
        <Select input-id="user-form-role" v-model="form.role" :options="roleOptions" option-label="label" option-value="value" class="w-full" />
      </FormField>
      <FormField v-if="isEdit" :label="t('admin.status')" input-id="user-form-status">
        <Select input-id="user-form-status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" class="w-full" />
      </FormField>

      <template v-if="!isEdit">
        <FormField :label="t('auth.password')" input-id="user-form-password" :error="errors.password?.[0]">
          <Password input-id="user-form-password" v-model="form.password" class="w-full" input-class="w-full" toggle-mask required autocomplete="new-password" />
        </FormField>
        <FormField :label="t('auth.passwordConfirm')" input-id="user-form-password-confirm">
          <Password input-id="user-form-password-confirm" v-model="form.password_confirmation" class="w-full" input-class="w-full" :feedback="false" toggle-mask required autocomplete="new-password" />
        </FormField>
      </template>
      <p v-else class="text-xs text-brand-500">{{ t('admin.editPasswordHint') }}</p>

      <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general[0] }}</Message>

      <Button type="submit" :label="t('common.save')" class="w-full" :loading="submitting" />
    </form>
  </div>
</template>
