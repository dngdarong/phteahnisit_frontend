<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import chatService from '@/services/chat.service'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({ id: { type: [String, Number], required: true } })
const { t } = useI18n()
const toast = useToast()

const conversation = ref(null)
const loading = ref(true)
const body = ref('')
const sending = ref(false)
const scrollEl = ref(null)

// Polling, not websockets - no realtime dependency exists in this project yet.
let pollTimer = null

async function load({ silent = false } = {}) {
  if (!silent) loading.value = true
  try {
    const { data } = await chatService.show(props.id)
    conversation.value = data.data
    await nextTick()
    scrollToBottom()
  } catch (e) {
    if (!silent) toast.add({ severity: 'error', summary: t('common.loadFailed'), life: 4000 })
  } finally {
    if (!silent) loading.value = false
  }
}

function scrollToBottom() {
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

async function send() {
  if (!body.value.trim() || sending.value) return
  sending.value = true
  try {
    await chatService.sendMessage(props.id, body.value.trim())
    body.value = ''
    await load({ silent: true })
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  load()
  pollTimer = setInterval(() => load({ silent: true }), 4000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
})
</script>

<template>
  <div class="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-6">
    <div v-if="loading" class="grid flex-1 place-items-center">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" :stroke-width="4" />
    </div>

    <template v-else-if="conversation">
      <div class="mb-3 border-b border-brand-100 pb-3">
        <p class="font-medium text-brand-900">{{ conversation.other_participant?.name }}</p>
        <router-link
          v-if="conversation.room"
          :to="{ name: 'room-detail', params: { id: conversation.room.id } }"
          class="text-sm text-brand-500 hover:underline"
        >
          {{ conversation.room.title }}
        </router-link>
        <p v-else class="text-sm italic text-brand-400">{{ t('chat.roomUnavailable') }}</p>
      </div>

      <div ref="scrollEl" class="flex-1 space-y-2 overflow-y-auto py-2">
        <div
          v-for="message in conversation.messages"
          :key="message.id"
          class="flex"
          :class="message.is_mine ? 'justify-end' : 'justify-start'"
        >
          <p
            class="max-w-[75%] rounded-card px-3 py-2 text-sm"
            :class="message.is_mine ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-900'"
          >
            {{ message.body }}
          </p>
        </div>
      </div>

      <form class="mt-3 flex gap-2" @submit.prevent="send">
        <Textarea v-model="body" class="w-full flex-1" rows="1" auto-resize :placeholder="t('chat.messagePlaceholder')" />
        <Button type="submit" icon="pi pi-send" :loading="sending" :aria-label="t('chat.send')" />
      </form>
    </template>
  </div>
</template>
