<script setup>
// Phase 10.2: replaces the byte-for-byte-identical
// `<ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />`
// markup previously copy-pasted across 13 views (PendingRoomsView,
// UserFormView, RoomMapView, UserDetailView, ConversationView,
// RoomListView, RoomDetailView, ConversationsView, MyBookingsView,
// LandlordBookingsView, FavoritesView, MyRoomsView, RoomFormView).
// Same default size/stroke as every existing usage, so swapping the
// tag in is a zero-visual-diff change; `size` is exposed for any future
// call site that needs a different one.
import ProgressSpinner from 'primevue/progressspinner'

defineProps({
  size: { type: String, default: '2.5rem' },
  strokeWidth: { type: [String, Number], default: 4 },
})
</script>

<template>
  <ProgressSpinner :style="{ width: size, height: size }" :stroke-width="strokeWidth" />
</template>
