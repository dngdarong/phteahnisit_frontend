<script setup>
// Phase 10.2: unifies the app's three separate status-rendering
// patterns into one component instead of leaving them as three
// independent implementations:
//   - domain="room" (default) - the original StatusBadge dot+pill,
//     used by RoomCard.vue (pending/approved/rejected).
//   - domain="user" - previously hand-copied inline span+dot markup,
//     duplicated verbatim in UsersView.vue and UserDetailView.vue
//     (active/inactive), now sharing the same dot+pill styles as room.
//   - domain="booking" - previously a PrimeVue <Tag :severity> declared
//     locally in MyBookingsView.vue and LandlordBookingsView.vue, each
//     with its own copy of the status->severity map. Kept as a <Tag>
//     here deliberately (not redrawn as a dot+pill) - booking has a
//     4th state ("cancelled") the pending/approved/rejected palette
//     doesn't cover, and changing its on-screen look is a visual
//     redesign this token-consolidation phase is not meant to do.
//     Unifying the *code* (one place status->style mapping lives)
//     without unifying the *visual language* keeps every page's
//     rendered output the same as before.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Tag from 'primevue/tag'

const props = defineProps({
  status: { type: String, required: true },
  domain: { type: String, default: 'room' }, // 'room' | 'user' | 'booking'
  label: { type: String, default: null }, // pre-translated override, e.g. for call sites outside this app's i18n key structure
})

const { t } = useI18n()

// room + user both render as the dot+pill; each maps its own status
// vocabulary onto the shared pending/approved/rejected color group.
const pillGroup = {
  room: { pending: 'pending', approved: 'approved', rejected: 'rejected' },
  user: { active: 'approved', inactive: 'rejected' },
}

const bookingSeverity = { pending: 'warn', approved: 'success', rejected: 'danger', cancelled: 'secondary' }

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

const resolvedGroup = computed(() => pillGroup[props.domain]?.[props.status] ?? 'pending')
const classes = computed(() => styles[resolvedGroup.value])
const dotClass = computed(() => dotStyles[resolvedGroup.value])

const resolvedLabel = computed(() => {
  if (props.label) return props.label
  return props.domain === 'user' ? t(`admin.statuses.${props.status}`) : t(`room.status.${props.status}`)
})
</script>

<template>
  <Tag
    v-if="domain === 'booking'"
    :value="label ?? t(`booking.status.${status}`)"
    :severity="bookingSeverity[status]"
  />
  <span
    v-else
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="classes"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="dotClass" />
    {{ resolvedLabel }}
  </span>
</template>
