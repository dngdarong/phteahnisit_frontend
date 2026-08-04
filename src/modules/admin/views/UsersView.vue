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
      <h1 class="text-xl font-semibold text-brand-900">{{ t('nav.users') }}</h1>
      <div class="flex items-center gap-3">
        <Select v-model="roleFilter" :options="roleOptions" option-label="label" option-value="value" @change="load" class="w-48" />
        <Button :label="t('admin.addUser')" icon="pi pi-plus" @click="router.push({ name: 'admin-user-create' })" />
      </div>
    </div>

    <div class="rounded-card overflow-hidden border border-brand-100 bg-white">
      <DataTable :value="users" :loading="loading" paginator :rows="15" class="phteahnisit-table">
        <Column field="name" :header="t('admin.name')" />
        <Column field="email" :header="t('admin.email')" />
        <Column field="phone" :header="t('admin.phone')" />
        <Column field="role" :header="t('admin.role')">
          <template #body="{ data }">
            <span class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              {{ roleLabel(data.role) }}
            </span>
          </template>
        </Column>
        <Column field="status" :header="t('admin.status')">
          <template #body="{ data }">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              :class="data.status === 'active'
                ? 'bg-[var(--color-status-approved-bg)] text-[var(--color-status-approved)]'
                : 'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)]'"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="data.status === 'active' ? 'bg-[var(--color-status-approved)]' : 'bg-[var(--color-status-rejected)]'"
              />
              {{ statusLabel(data.status) }}
            </span>
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

<style scoped>
/* Bring PrimeVue's DataTable chrome (header row, borders, paginator,
   row hover) in line with the app's brand tokens instead of Aura's
   generic surface grays - the rest of the app never shows raw PrimeVue
   default styling this directly since cards/buttons already carry
   brand classes, but a DataTable's internal structure isn't reachable
   via plain utility classes on the wrapper. */
.phteahnisit-table :deep(.p-datatable-thead > tr > th) {
  background: var(--color-brand-50);
  color: var(--color-brand-800);
  border-color: var(--color-brand-100);
  font-weight: 600;
}

.phteahnisit-table :deep(.p-datatable-tbody > tr) {
  background: var(--color-surface);
}

.phteahnisit-table :deep(.p-datatable-tbody > tr > td) {
  border-color: var(--color-brand-100);
}

.phteahnisit-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-brand-50);
}

.phteahnisit-table :deep(.p-paginator) {
  background: var(--color-surface);
  border-color: var(--color-brand-100);
}
</style>
