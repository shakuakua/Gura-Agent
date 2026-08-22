<template>
  <div ref="modelContainerRef" class="model-container">
    <div class="stage-bg">
      <div class="stage-grid"></div>
      <div class="stage-light"></div>
    </div>

    <Transition name="loader">
      <div v-if="!modelReady" class="model-loader">
        <div class="loader-ring"></div>
        <span>{{ modelError ? '模型加载失败' : '正在唤醒 Gura' }}</span>
      </div>
    </Transition>

    <Transition name="bubble">
      <div v-if="latestAIMessage" class="speech-bubble" :style="bubbleStyle">
        <div class="bubble-head">
          <span class="bubble-avatar">🦈</span>
          <span class="bubble-name">Gura</span>
        </div>
        <p class="bubble-text">{{ latestAIMessage }}</p>
        <span class="bubble-tail"></span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineOptions({ name: 'DigitalModel' })

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import renderer, { camera, resizeRenderer } from '../index.js'
import { useChatStore } from '@/stores/chatStore'
import { getModelHeadPosition, waitForModel } from '@/model.js'

const modelContainerRef = ref(null)
const chatStore = useChatStore()
const modelReady = ref(false)
const modelError = ref(false)

const latestAIMessage = computed(() => {
  const aiMessages = chatStore.messages.filter((msg) => msg.sender === 'ai')
  return aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].text : ''
})

const bubbleStyle = ref({
  left: '50%',
  top: '26%'
})

const updateBubblePosition = () => {
  const container = modelContainerRef.value
  if (!container) return

  const anchor = getModelHeadPosition(new THREE.Vector3()).project(camera)
  const widthHalf = container.clientWidth / 2
  const heightHalf = container.clientHeight / 2

  let x = anchor.x * widthHalf + widthHalf
  let y = -anchor.y * heightHalf + heightHalf - 28

  const halfWidth = 170
  x = THREE.MathUtils.clamp(
    x,
    halfWidth + 12,
    Math.max(halfWidth + 12, container.clientWidth - halfWidth - 12)
  )
  const minY = container.clientWidth <= 600 ? 86 : 150
  y = THREE.MathUtils.clamp(y, minY, Math.max(minY, container.clientHeight - 140))

  bubbleStyle.value = {
    left: `${x}px`,
    top: `${y}px`
  }
}

let resizeObserver = null
let bubbleTick = null

onMounted(() => {
  const container = modelContainerRef.value
  if (renderer.domElement.parentElement !== container) {
    container.appendChild(renderer.domElement)
  }

  resizeRenderer(container.clientWidth, container.clientHeight)
  updateBubblePosition()

  waitForModel().then((gltf) => {
    modelReady.value = Boolean(gltf)
    modelError.value = !gltf
    updateBubblePosition()
  })

  watch(
    () => chatStore.messages,
    () => updateBubblePosition(),
    { deep: true }
  )

  window.addEventListener('resize', updateBubblePosition)
  resizeObserver = new ResizeObserver(() => {
    resizeRenderer(container.clientWidth, container.clientHeight)
    updateBubblePosition()
  })
  resizeObserver.observe(container)
  bubbleTick = window.setInterval(updateBubblePosition, 180)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateBubblePosition)
  if (resizeObserver) resizeObserver.disconnect()
  if (bubbleTick) window.clearInterval(bubbleTick)
})
</script>

<style scoped>
.model-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-1);
  isolation: isolate;
}

.stage-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    linear-gradient(180deg, #0b0e1a 0%, #101627 48%, #090b12 100%);
}

.stage-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(255, 138, 76, 0.14) 0%,
    transparent 34%,
    rgba(57, 214, 208, 0.12) 68%,
    transparent 100%
  );
  mix-blend-mode: screen;
}

.stage-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 78%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 78%);
}

.stage-light {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30%;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(57, 214, 208, 0.06) 55%,
    rgba(255, 138, 76, 0.08)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

:deep(canvas) {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.model-loader {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-soft);
  font-size: 13px;
  background: rgba(10, 13, 22, 0.55);
  backdrop-filter: blur(6px);
}

.loader-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(255, 138, 76, 0.18);
  border-top-color: var(--fox);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-enter-active,
.loader-leave-active {
  transition: opacity 0.35s ease;
}

.loader-enter-from,
.loader-leave-to {
  opacity: 0;
}

.speech-bubble {
  position: absolute;
  z-index: 5;
  min-width: 170px;
  max-width: min(340px, calc(100% - 48px));
  padding: 12px 16px 14px;
  transform: translate(-50%, -100%);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 16px;
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.35),
    0 4px 14px rgba(255, 138, 76, 0.1);
  color: #20222b;
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.bubble-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
}

.bubble-avatar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 13px;
  background: linear-gradient(135deg, rgba(255, 138, 76, 0.2), rgba(255, 138, 76, 0.06));
  border: 1px solid rgba(255, 138, 76, 0.3);
}

.bubble-name {
  font-size: 12px;
  font-weight: 700;
  color: #34364a;
}

.bubble-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  white-space: normal;
}

.bubble-tail {
  position: absolute;
  bottom: -9px;
  left: 50%;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.92);
}

.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translate(-50%, -94%) scale(0.96);
}

@media (max-width: 600px) {
  .speech-bubble {
    min-width: 0;
    max-width: calc(100% - 32px);
    padding: 8px 12px 10px;
    border-radius: 12px;
  }

  .bubble-head,
  .bubble-tail {
    display: none;
  }

  .bubble-text {
    max-height: 2.8em;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
