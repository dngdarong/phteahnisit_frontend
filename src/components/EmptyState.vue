<script setup>
// Phase 10.3: replaces the dashed-border "nothing here yet" rounded-card
// block duplicated verbatim in 8 views (PendingRoomsView, LandlordBookingsView,
// RoomMapView, ConversationsView, RoomListView, MyRoomsView, FavoritesView,
// MyBookingsView).
//
// Two visual treatments existed and are both preserved exactly (no page
// redesign): RoomListView/FavoritesView show icon + bold title + muted hint;
// MyRoomsView shows bold title + hint with no icon; MyBookingsView shows
// icon + bold title with no hint; PendingRoomsView/LandlordBookingsView/
// RoomMapView/ConversationsView show a single plain muted line. Rather than
// force every call site to the icon+title+hint look, both treatments are
// kept via a `variant` prop so every page renders identically to before.
//
// Props:
//  - variant ('detailed' | 'plain', default 'detailed'): 'plain' reproduces
//    the single muted-line style; 'detailed' reproduces the icon/bold-title
//    /hint style
//  - icon (String, optional): PrimeIcons class suffix, e.g. 'pi-heart'
//    (detailed variant only)
//  - title (String, required): main message
//  - hint (String, optional): secondary muted line (detailed variant only)
//
// Example:
//  <EmptyState variant="plain" :title="t('room.noneWaiting')" />
//  <EmptyState icon="pi-heart" :title="t('favorites.empty')" :hint="t('favorites.emptyHint')" />
//
// Used in: PendingRoomsView.vue, LandlordBookingsView.vue, RoomMapView.vue,
// ConversationsView.vue, RoomListView.vue, MyRoomsView.vue, FavoritesView.vue,
// MyBookingsView.vue
defineProps({
  variant: { type: String, default: 'detailed' }, // 'detailed' | 'plain'
  icon: { type: String, default: null },
  title: { type: String, required: true },
  hint: { type: String, default: null },
})
</script>

<template>
  <div
    v-if="variant === 'plain'"
    class="rounded-card border border-dashed border-brand-200 py-16 text-center text-brand-500"
  >
    {{ title }}
  </div>
  <div v-else class="rounded-card border border-dashed border-brand-200 py-16 text-center">
    <i v-if="icon" class="pi mb-3 text-3xl text-brand-300" :class="icon" />
    <p class="font-medium text-brand-800">{{ title }}</p>
    <p v-if="hint" class="text-sm text-brand-500">{{ hint }}</p>
  </div>
</template>
