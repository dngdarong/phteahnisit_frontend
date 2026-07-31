<script setup>
import { ref, onMounted } from 'vue'
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

const roleOptions = [
  { label: 'All roles', value: null },
  { label: 'Student', value: 'student' },
  { label: 'Landlord', value: 'landlord' },
  { label: 'Admin', value: 'admin' },
]

async function load() {
  loading.value = true
  const { data } = await userService.list({ role: roleFilter.value })
  users.value = data.data
  loading.value = false
}

function toggleStatus(user) {
  const isActive = user.status === 'active'
  confirm.require({
    message: isActive ? `Disable ${user.name}? They won't be able to log in.` : `Re-enable ${user.name}?`,
    header: isActive ? 'Disable user' : 'Enable user',
    acceptClass: isActive ? 'p-button-danger' : undefined,
    accept: async () => {
      await (isActive ? userService.disable(user.id) : userService.enable(user.id))
      toast.add({ severity: 'success', summary: 'Updated', life: 2500 })
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
      <Column field="name" header="Name" />
      <Column field="email" header="Email" />
      <Column field="phone" header="Phone" />
      <Column field="role" header="Role">
        <template #body="{ data }">
          <Tag :value="data.role" severity="secondary" />
        </template>
      </Column>
      <Column field="status" header="Status">
        <template #body="{ data }">
          <Tag :value="data.status" :severity="data.status === 'active' ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="">
        <template #body="{ data }">
          <Button
            :label="data.status === 'active' ? 'Disable' : 'Enable'"
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
