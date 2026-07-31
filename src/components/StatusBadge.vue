<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  status: { type: String, required: true }, // 'pending' | 'approved' | 'rejected'
})

const { t } = useI18n()

const styles = {
  pending: 'text-[var(--color-status-pending)] bg-[var(--color-status-pending-bg)]',
  approved: 'text-[var(--color-status-approved)] bg-[var(--color-status-approved-bg)]',
  rejected: 'text-[var(--color-status-rejected)] bg-[var(--color-status-rejected-bg)]',
}

const dotStyles = {
  pending: 'bg-[var(--color-status-pending)]',
  approved: 'bg-[var(--color-status-approved)]',
  rejected: 'bg-[var(--color-status-rejected)]',
}

const classes = computed(() => styles[props.status] ?? styles.pending)
const dotClass = computed(() => dotStyles[props.status] ?? dotStyles.pending)
const label = computed(() => t(`room.status.${props.status}`))
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="classes"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>
