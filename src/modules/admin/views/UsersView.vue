<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import userService from '@/services/user.service'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Select from 'primevue/select'

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const users = ref([])
const loading = ref(true)
const roleFilter = ref(null)

const roleOptions = computed(() => [
  { label: t('admin.allRoles'), value: null },
  { label: t('admin.roles.student'), value: 'student' },
  { label: t('admin.roles.landlord'), value: 'landlord' },
  { label: t('admin.roles.admin'), value: 'admin' },
])

function roleLabel(role) {
  return t(`admin.roles.${role}`)
}

function statusLabel(status) {
  return t(`admin.statuses.${status}`)
}

async function load() {
  loading.value = true
  try {
    const { data } = await userService.list({ role: roleFilter.value })
    users.value = data.data
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    loading.value = false
  }
}

function toggleStatus(user) {
  const isActive = user.status === 'active'
  confirm.require({
    message: isActive ? t('admin.disableConfirm', { name: user.name }) : t('admin.enableConfirm', { name: user.name }),
    header: isActive ? t('admin.disableUser') : t('admin.enableUser'),
    acceptClass: isActive ? 'p-button-danger' : undefined,
    accept: async () => {
      await (isActive ? userService.disable(user.id) : userService.enable(user.id))
      toast.add({ severity: 'success', summary: t('admin.updated'), life: 2500 })
      load()
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-brand-900">{{ t('nav.users') }}</h1>
      <Select v-model="roleFilter" :options="roleOptions" option-label="label" option-value="value" @change="load" class="w-48" />
    </div>

    <DataTable :value="users" :loading="loading" paginator :rows="15" class="rounded-card overflow-hidden">
      <Column field="name" :header="t('admin.name')" />
      <Column field="email" :header="t('admin.email')" />
      <Column field="phone" :header="t('admin.phone')" />
      <Column field="role" :header="t('admin.role')">
        <template #body="{ data }">
          <Tag :value="roleLabel(data.role)" severity="secondary" />
        </template>
      </Column>
      <Column field="status" :header="t('admin.status')">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="data.status === 'active' ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="">
        <template #body="{ data }">
          <Button
            :label="data.status === 'active' ? t('admin.disable') : t('admin.enable')"
            size="small"
            :severity="data.status === 'active' ? 'danger' : 'success'"
            outlined
            @click="toggleStatus(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
