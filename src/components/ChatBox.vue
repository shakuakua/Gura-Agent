<template>
  <aside class="chat-panel">
    <header class="panel-header">
      <div class="brand">
        <div class="brand-mark">🦈</div>
        <div class="brand-copy">
          <h1>Gura</h1>
          <p>AI 数字伙伴</p>
        </div>
      </div>

      <div class="connection-pills">
        <span :class="['pill', connectionStatus]">
          <i class="dot"></i>
          {{ connectionStatusText }}
        </span>
        <span :class="['pill', listeningStatusClass]">
          <i class="dot"></i>
          {{ listeningStatusText }}
        </span>
      </div>
    </header>

    <div class="state-line">
      <span :class="['state-pulse', chatStore.digitalHumanState]"></span>
      <span>{{ digitalHumanStateText }}</span>
    </div>

    <div class="action-bar">
      <button
        v-for="action in previewActions"
        :key="action.name"
        class="action-chip"
        @click="triggerAction(action.name)"
      >
        {{ action.label }}
      </button>
    </div>

    <div class="panel-actions">
      <button
        class="action-btn"
        :class="{ active: chatStore.isConnected }"
        @click="toggleConnection"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v9"></path>
          <path d="M5.6 5.6a9 9 0 1 0 12.8 0"></path>
        </svg>
        <span>{{ chatStore.isConnected ? '断开' : '连接' }}</span>
      </button>

      <button
        class="action-btn voice-btn"
        :class="{ active: chatStore.listeningActive }"
        @click="toggleListening"
        :title="chatStore.listeningActive ? '停止监听' : '开始监听'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="2" width="6" height="11" rx="3"></rect>
          <path d="M5 11a7 7 0 0 0 14 0"></path>
          <path d="M12 18v4"></path>
        </svg>
        <span>{{ chatStore.listeningActive ? '停止监听' : '开始监听' }}</span>
      </button>

      <button class="icon-btn" title="清空对话" @click="chatStore.clearMessages">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 10v6"></path>
          <path d="M14 10v6"></path>
        </svg>
      </button>
    </div>

    <div ref="messagesContainerRef" class="messages">
      <article
        v-for="(msg, index) in chatStore.messages"
        :key="index"
        :class="['message', msg.sender]"
      >
        <div class="message-meta">
          <span class="message-avatar">{{ msg.sender === 'user' ? '我' : '🦈' }}</span>
          <span class="message-role">{{ msg.sender === 'user' ? '你' : 'Gura' }}</span>
          <time>{{ formatTime(msg.timestamp) }}</time>
        </div>
        <div class="message-content">{{ msg.text }}</div>
      </article>

      <div v-if="chatStore.messages.length === 0" class="empty-state">
        <div class="empty-mark">🦈</div>
        <p>开始一段对话吧</p>
      </div>
    </div>

    <form class="composer" @submit.prevent="sendMessage">
      <input
        v-model="chatStore.inputMessage"
        type="text"
        maxlength="500"
        :disabled="!chatStore.isConnected"
        placeholder="输入消息…"
        @keydown.enter.prevent="sendMessage"
      />
      <button class="send-btn" type="submit" :disabled="!canSend" title="发送">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2 11 13"></path>
          <path d="M22 2 15 22l-4-9-9-4Z"></path>
        </svg>
      </button>
    </form>
  </aside>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { triggerAction } from '@/model.js'

const chatStore = useChatStore()
const messagesContainerRef = ref(null)

const previewActions = [
  { name: 'idle', label: '待机' },
  { name: 'ParadeWalk', label: '走路' },
  { name: 'GuraRun', label: '跑步' },
  { name: 'GuraShake', label: '摇晃' },
  { name: 'GuraJump', label: '跳跃' },
  { name: 'Shy', label: '害羞' },
  { name: 'Gura Around', label: '转圈' }
]

const connectionStatusText = computed(() => {
  switch (chatStore.connectionStatus) {
    case 'connected':
      return '已连接'
    case 'connecting':
      return '连接中'
    case 'disconnected':
      return '未连接'
    default:
      return '未知'
  }
})

const listeningStatusClass = computed(() => (chatStore.listeningActive ? 'active' : 'inactive'))
const listeningStatusText = computed(() => (chatStore.listeningActive ? '监听中' : '待唤醒'))

const digitalHumanStateText = computed(() => {
  switch (chatStore.digitalHumanState) {
    case 'waiting_wake':
      return '等待唤醒'
    case 'awakened':
      return '已唤醒'
    case 'listening':
      return '聆听中'
    case 'conversing':
      return '对话中'
    case 'processing':
      return '思考中'
    case 'speaking':
      return '回复中'
    case 'idle':
      return '空闲'
    case 'goodbye':
      return '告别中'
    default:
      return '准备就绪'
  }
})

const canSend = computed(
  () => chatStore.isConnected && chatStore.inputMessage.trim().length > 0
)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

const sendMessage = () => {
  if (!canSend.value) return
  chatStore.sendMessage()
  scrollToBottom()
}

const toggleConnection = () => {
  if (chatStore.isConnected) {
    chatStore.disconnect()
  } else {
    chatStore.initWebSocket()
  }
}

const toggleListening = () => {
  if (chatStore.listeningActive) {
    chatStore.stopListening()
  } else {
    chatStore.startListening()
  }
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

watch(() => chatStore.messages, scrollToBottom, { deep: true })

onMounted(() => {
  chatStore.startListening()
  chatStore.initWebSocket()
  scrollToBottom()
})
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(14, 17, 28, 0.96), rgba(9, 11, 18, 0.98));
  border-left: 1px solid var(--line);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid var(--line);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  font-size: 22px;
  background: linear-gradient(135deg, rgba(255, 138, 76, 0.28), rgba(255, 138, 76, 0.06));
  border: 1px solid rgba(255, 138, 76, 0.35);
  box-shadow: 0 6px 18px rgba(255, 138, 76, 0.12);
}

.brand-copy {
  min-width: 0;
}

.brand-copy h1 {
  margin: 0;
  font-size: 17px;
  line-height: 1.2;
  letter-spacing: 0;
}

.brand-copy p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.connection-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-soft);
  font-size: 12px;
  white-space: nowrap;
}

.pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  box-shadow: 0 0 8px currentColor;
}

.pill.connected .dot {
  background: var(--voice);
  color: var(--voice);
}

.pill.connecting .dot {
  background: var(--gold);
  color: var(--gold);
  animation: pulse 1.2s ease-in-out infinite;
}

.pill.disconnected .dot {
  background: var(--danger);
  color: var(--danger);
}

.pill.active .dot {
  background: var(--voice);
  color: var(--voice);
  animation: pulse 1.6s ease-in-out infinite;
}

.state-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-bottom: 1px solid var(--line);
  color: var(--text-muted);
  font-size: 12px;
}

.state-pulse {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.state-pulse.listening,
.state-pulse.conversing,
.state-pulse.speaking {
  background: var(--voice);
  box-shadow: 0 0 10px var(--voice);
  animation: pulse 1.6s ease-in-out infinite;
}

.state-pulse.awakened {
  background: var(--fox);
  box-shadow: 0 0 10px var(--fox);
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 22px;
  border-bottom: 1px solid var(--line);
}

.action-chip {
  height: 28px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-soft);
  font-size: 11px;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.action-chip:hover {
  border-color: rgba(57, 214, 208, 0.4);
  background: rgba(57, 214, 208, 0.08);
  color: var(--voice);
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--line);
}

.action-btn,
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-soft);
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.action-btn {
  gap: 7px;
  padding: 0 12px;
  font-size: 12px;
}

.icon-btn {
  width: 34px;
  padding: 0;
}

.action-btn:hover,
.icon-btn:hover {
  border-color: var(--line-strong);
  color: var(--text);
  transform: translateY(-1px);
}

.action-btn.active {
  border-color: rgba(57, 214, 208, 0.45);
  background: rgba(57, 214, 208, 0.08);
  color: var(--voice);
}

.action-btn svg,
.icon-btn svg {
  width: 16px;
  height: 16px;
}

.messages {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 22px;
  overflow-y: auto;
}

.message {
  max-width: 86%;
  animation: messageIn 0.28s ease-out;
}

.message.user {
  align-self: flex-end;
}

.message.ai {
  align-self: flex-start;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
  color: var(--text-muted);
  font-size: 12px;
}

.message-avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 50%;
  font-size: 15px;
  background: rgba(57, 214, 208, 0.12);
  border: 1px solid rgba(57, 214, 208, 0.28);
}

.message.user .message-avatar {
  font-size: 12px;
  background: rgba(255, 138, 76, 0.12);
  border-color: rgba(255, 138, 76, 0.32);
}

.message-role {
  color: var(--text-soft);
  font-weight: 600;
}

.message-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}

.message-content {
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.045);
  color: var(--text);
  font-size: 14px;
  line-height: 1.55;
  word-break: break-word;
}

.message.user .message-content {
  border-color: rgba(255, 138, 76, 0.28);
  background: rgba(255, 138, 76, 0.1);
}

.message.ai .message-content {
  border-color: rgba(57, 214, 208, 0.22);
  background: rgba(57, 214, 208, 0.08);
}

.empty-state {
  margin: auto;
  text-align: center;
  color: var(--text-muted);
}

.empty-mark {
  margin-bottom: 8px;
  font-size: 38px;
  filter: drop-shadow(0 8px 16px rgba(255, 138, 76, 0.15));
  opacity: 0.75;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.composer {
  display: flex;
  gap: 10px;
  padding: 14px 22px 20px;
  border-top: 1px solid var(--line);
}

.composer input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  outline: none;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.composer input::placeholder {
  color: var(--text-muted);
}

.composer input:focus {
  border-color: rgba(57, 214, 208, 0.55);
  box-shadow: 0 0 0 3px rgba(57, 214, 208, 0.12);
}

.composer input:disabled {
  opacity: 0.55;
}

.send-btn {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--fox), var(--fox-deep));
  color: #160c06;
  transition: box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.send-btn svg {
  width: 17px;
  height: 17px;
}

.send-btn:disabled {
  border-color: var(--line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  box-shadow: 0 0 18px rgba(255, 138, 76, 0.45);
  transform: translateY(-1px);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .chat-panel {
    border-left: none;
    border-top: 1px solid var(--line-strong);
  }

  .panel-header {
    padding: 14px 16px 12px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
    font-size: 20px;
  }

  .state-line {
    padding: 8px 16px;
  }

  .action-bar {
    padding: 8px 16px;
  }

  .panel-actions {
    padding: 10px 16px;
  }

  .messages {
    padding: 14px 16px;
  }

  .composer {
    padding: 12px 16px 16px;
  }
}
</style>
