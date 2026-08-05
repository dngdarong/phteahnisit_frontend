<script setup>
// Phase 10.7 (Final Polish): extracts the small role-label pill that
// UsersView.vue and UserDetailView.vue previously hand-rolled as
// identical inline markup (`bg-brand-50 ... text-brand-700` rounded
// pill showing "student"/"landlord"/"admin"). Deliberately left
// duplicated through Phase 10.6 as "not a migration bug" since it's
// a single static style with no per-role color variation (unlike
// StatusBadge's pending/approved/rejected mapping) - but by this
// closing phase the 2 call sites are byte-for-byte identical, so a
// one-prop, no-slot component (no color map, no domain switch -
// simpler than StatusBadge, not a reimplementation of it) removes
// the duplication without over-building for a 2-instance pattern.
import { useI18n } from 'vue-i18n'

defineProps({
  role: { type: String, required: true }, // 'student' | 'landlord' | 'admin'
})

const { t } = useI18n()
</script>

<template>
  <span class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
    {{ t(`admin.roles.${role}`) }}
  </span>
</template>
