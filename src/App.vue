<template>
  <div class="app-shell">
    <main class="stage">
      <Model />

      <header class="stage-header">
        <div class="stage-brand">
          <span class="stage-logo">🦈</span>
          <div class="stage-copy">
            <h1>Gura 数字人</h1>
            <p>AI 数字伙伴</p>
          </div>
        </div>

        <div class="stage-live" :class="{ live: chatStore.isConnected }">
          <span class="live-dot"></span>
          <span>{{ liveText }}</span>
        </div>
      </header>
    </main>

    <ChatBox />
  </div>
</template>

<script setup>
import { computed } from "vue";
import Model from "./components/Model.vue";
import ChatBox from "./components/ChatBox.vue";
import { useChatStore } from "./stores/chatStore";

const chatStore = useChatStore();
const liveText = computed(() => (chatStore.isConnected ? "已连接" : "离线"));
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(380px, 1fr);
  height: 100vh;
  background: var(--bg-0);
}

.stage {
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg-1);
}

.stage-header {
  position: absolute;
  top: 22px;
  right: 26px;
  left: 26px;
  z-index: 6;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  pointer-events: none;
}

.stage-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(10, 12, 20, 0.55);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(14px);
}

.stage-logo {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 138, 76, 0.35);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 138, 76, 0.28), rgba(255, 138, 76, 0.06));
  font-size: 22px;
}

.stage-copy h1 {
  margin: 0;
  font-size: 16px;
  line-height: 1.25;
  letter-spacing: 0;
}

.stage-copy p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.stage-live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 13px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: rgba(10, 12, 20, 0.5);
  color: var(--text-muted);
  font-size: 12px;
  backdrop-filter: blur(12px);
}

.stage-live.live {
  border-color: rgba(57, 214, 208, 0.25);
  color: var(--voice);
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
}

.stage-live.live .live-dot {
  background: var(--voice);
  box-shadow: 0 0 10px var(--voice);
  animation: livePulse 2s ease-in-out infinite;
}

@keyframes livePulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: 48vh 52vh;
  }

  .stage-header {
    top: 14px;
    right: 16px;
    left: 16px;
  }

  .stage-brand {
    padding: 8px 11px 8px 8px;
  }

  .stage-logo {
    width: 34px;
    height: 34px;
    font-size: 19px;
  }

  .stage-live {
    display: none;
  }
}
</style>
