<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import userService from '@/services/user.service'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Select from 'primevue/select'
import StatusBadge from '@/components/StatusBadge.vue'
import RolePill from '@/components/RolePill.vue'

const { t } = useI18n()
const router = useRouter()
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

// Guards against an in-flight request resolving after a newer one (e.g. the
// initial unfiltered load landing after the user has already picked a role
// filter), which would otherwise overwrite the correct filtered result with
// stale data.
let requestId = 0

async function load() {
  const thisRequest = ++requestId
  loading.value = true
  try {
    const { data } = await userService.list({ role: roleFilter.value })
    if (thisRequest !== requestId) return
    users.value = data.data
  } catch (e) {
    if (thisRequest !== requestId) return
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    if (thisRequest === requestId) loading.value = false
  }
}

function toggleStatus(user) {
  const isActive = user.status === 'active'
  confirm.require({
    message: isActive ? t('admin.disableConfirm', { name: user.name }) : t('admin.enableConfirm', { name: user.name }),
    header: isActive ? t('admin.disableUser') : t('admin.enableUser'),
    acceptClass: isActive ? 'p-button-danger' : undefined,
    accept: async () => {
      try {
        await (isActive ? userService.disable(user.id) : userService.enable(user.id))
        toast.add({ severity: 'success', summary: t('admin.updated'), life: 2500 })
        load()
      } catch (e) {
        toast.add({ severity: 'error', summary: e.response?.data?.message || t('admin.saveFailed'), life: 4000 })
      }
    },
  })
}

function confirmDelete(user) {
  confirm.require({
    message: t('admin.deleteConfirm', { name: user.name }),
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await userService.remove(user.id)
        toast.add({ severity: 'success', summary: t('admin.deleted'), life: 3000 })
        load()
      } catch (e) {
        toast.add({ severity: 'error', summary: e.response?.data?.message || t('admin.deleteFailed'), life: 4000 })
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-h1 text-brand-900">{{ t('nav.users') }}</h1>
      <div class="flex items-center gap-3">
        <Select v-model="roleFilter" :options="roleOptions" option-label="label" option-value="value" @change="load" class="w-48" />
        <Button :label="t('admin.addUser')" icon="pi pi-plus" @click="router.push({ name: 'admin-user-create' })" />
      </div>
    </div>

    <div class="rounded-card overflow-hidden border border-brand-100 bg-white">
      <DataTable :value="users" :loading="loading" paginator :rows="15">
        <Column field="name" :header="t('admin.name')" />
        <Column field="email" :header="t('admin.email')" />
        <Column field="phone" :header="t('admin.phone')" />
        <Column field="role" :header="t('admin.role')">
          <template #body="{ data }">
            <RolePill :role="data.role" />
          </template>
        </Column>
        <Column field="status" :header="t('admin.status')">
          <template #body="{ data }">
            <StatusBadge domain="user" :status="data.status" />
          </template>
        </Column>
        <Column header="" :style="{ width: '18rem' }">
          <template #body="{ data }">
            <div class="flex flex-wrap justify-end gap-1.5">
              <Button
                icon="pi pi-eye"
                size="small"
                outlined
                :aria-label="t('admin.view')"
                @click="router.push({ name: 'admin-user-detail', params: { id: data.id } })"
              />
              <Button
                icon="pi pi-pencil"
                size="small"
                outlined
                :aria-label="t('common.edit')"
                @click="router.push({ name: 'admin-user-edit', params: { id: data.id } })"
              />
              <Button
                :label="data.status === 'active' ? t('admin.disable') : t('admin.enable')"
                size="small"
                :severity="data.status === 'active' ? 'danger' : 'success'"
                outlined
                @click="toggleStatus(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                :aria-label="t('common.delete')"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<!--
  Phase 10.2: the DataTable/Paginator brand skin that used to live here
  as a scoped `.phteahnisit-table :deep()` block has moved to a global,
  unscoped rule in src/assets/styles/main.css (targeting `.p-datatable-*`
  / `.p-paginator` directly) so every DataTable and Paginator in the app
  picks it up automatically instead of needing it re-declared per view.
  The two `var(--color-surface)` references that lived in that block
  (the only real usages of that token anywhere in src/) are now literal
  `#fff` in main.css's global rule - identical rendered color, one fewer
  single-purpose token.
-->

