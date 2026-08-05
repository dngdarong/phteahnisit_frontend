<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import chatService from '@/services/chat.service'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import Badge from 'primevue/badge'

const { t } = useI18n()
const toast = useToast()

const conversations = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data } = await chatService.list()
    conversations.value = data.data
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="mb-6 text-h1 text-brand-900">{{ t('nav.chat') }}</h1>

    <div v-if="loading" class="grid place-items-center py-20">
      <LoadingSpinner />
    </div>

    <EmptyState v-else-if="conversations.length === 0" variant="plain" :title="t('chat.noConversations')" />

    <div v-else class="divide-y divide-brand-100 overflow-hidden rounded-card border border-brand-100">
      <router-link
        v-for="conversation in conversations"
        :key="conversation.id"
        :to="{ name: 'chat-thread', params: { id: conversation.id } }"
        class="flex items-center justify-between gap-3 p-4 transition-colors duration-[var(--motion-fast)] hover:bg-brand-50 focus-visible:bg-brand-50"
      >
        <div class="min-w-0">
          <p class="truncate font-medium text-brand-900">{{ conversation.other_participant?.name }}</p>
          <p class="truncate text-sm text-brand-500">{{ conversation.room?.title }}</p>
        </div>
        <Badge v-if="conversation.unread_count" :value="conversation.unread_count" severity="danger" />
      </router-link>
    </div>
  </div>
</template>
