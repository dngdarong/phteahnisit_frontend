<script setup>
// Phase 10.3: replaces the near-identical reject-with-reason Dialog
// (modal + hint paragraph + reason Textarea + [Cancel(text), Reject(danger)]
// footer) duplicated in PendingRoomsView.vue (rejecting a room) and
// LandlordBookingsView.vue (rejecting a booking). Both call sites use the
// exact same button labels ('common.cancel' / 'room.reject'), dialog width
// and footer structure - only the header/hint text and the confirm handler
// differ, both passed in by the caller.
//
// Props:
//  - visible (Boolean, required, v-model): dialog open state
//  - reason (String, v-model:reason): the reason Textarea's value
//  - header (String, required): dialog title
//  - hint (String, required): text shown above the reason Textarea
//  - loading (Boolean, default false): disables Cancel and shows a loading
//    state on the Reject button while the confirm action is in flight
//
// Events:
//  - update:visible, update:reason (v-model plumbing)
//  - cancel: Cancel button clicked, or dialog dismissed via ESC/backdrop/X
//  - confirm: Reject button clicked
//
// Example:
//  <RejectDialog
//    :visible="!!rejectDialogRoom" @update:visible="(v) => !v && (rejectDialogRoom = null)"
//    v-model:reason="rejectReason"
//    :header="t('room.rejectListing')" :hint="t('room.rejectReasonHint')"
//    :loading="rejecting"
//    @cancel="rejectDialogRoom = null" @confirm="confirmReject"
//  />
//
// Used in: PendingRoomsView.vue, LandlordBookingsView.vue
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

defineProps({
  visible: { type: Boolean, required: true },
  reason: { type: String, default: '' },
  header: { type: String, required: true },
  hint: { type: String, required: true },
  loading: { type: Boolean, default: false },
})
defineEmits(['update:visible', 'update:reason', 'cancel', 'confirm'])

const { t } = useI18n()
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="header"
    :style="{ width: '28rem' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <p class="mb-3 text-sm text-brand-600">{{ hint }}</p>
    <Textarea
      :model-value="reason"
      class="w-full"
      rows="3"
      @update:model-value="$emit('update:reason', $event)"
    />
    <template #footer>
      <Button :label="t('common.cancel')" text :disabled="loading" @click="$emit('cancel')" />
      <Button :label="t('room.reject')" severity="danger" :loading="loading" @click="$emit('confirm')" />
    </template>
  </Dialog>
</template>
