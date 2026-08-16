<template>
  <view class="tu-page">
    <view class="tu-nav-bar">
      <text class="tu-nav-back" @click="goBack">←</text>
      <text class="tu-nav-title">树洞对话</text>
      <text class="tu-nav-end" @click="endSession">结束</text>
    </view>

    <view class="countdown-bar">
      <view class="countdown-left">
        <view class="countdown-icon">⏳</view>
        <text class="countdown-label">限时对话</text>
      </view>
      <view class="countdown-right">
        <text class="countdown-time">{{ countdownText }}</text>
        <text class="countdown-suffix">后销毁</text>
      </view>
    </view>
    <view class="countdown-track">
      <view class="countdown-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>

    <scroll-view
      scroll-y
      class="chat-scroll"
      :scroll-top="scrollTop"
      :upper-threshold="80"
      @scrolltoupper="loadMore"
    >
      <view v-if="loadingMore" class="load-more-hint">
        <text>正在加载...</text>
      </view>
      <view v-if="!hasMore && messages.length > 0 && page > 1" class="load-more-hint">
        <text>没有更多消息了</text>
      </view>
      <view v-for="msg in messages" :key="msg.id" class="msg-item" :class="{ 'msg-mine': msg.senderId === myId }">
        <view v-if="msg.senderId !== myId" class="msg-avatar">
          <text>{{ receiverEmoji }}</text>
        </view>
        <view class="msg-bubble" :class="{ 'msg-bubble-mine': msg.senderId === myId }">
          <text v-if="msg.msgType === 1" class="msg-text">{{ msg.content }}</text>
          <view v-else-if="msg.msgType === 2" class="msg-voice" @click="playVoice">
            <view class="voice-waveform">
              <view class="wave-bar"></view>
              <view class="wave-bar"></view>
              <view class="wave-bar"></view>
              <view class="wave-bar"></view>
              <view class="wave-bar"></view>
            </view>
            <text class="voice-duration">{{ msg.duration }}s</text>
          </view>
          <text v-else class="msg-emoji">{{ msg.content }}</text>
        </view>
        <view v-if="msg.senderId === myId" class="msg-avatar msg-avatar-mine">
          <text class="msg-avatar-label">我</text>
        </view>
      </view>
      <view class="msg-bottom-space"></view>
    </scroll-view>

    <view class="input-wrap">
      <view v-if="showEmojiPanel" class="emoji-overlay tu-fade-in">
        <scroll-view scroll-y class="emoji-scroll">
          <view class="emoji-grid">
            <text
              v-for="emoji in emojis"
              :key="emoji"
              class="emoji-item"
              @click="sendEmoji(emoji)"
            >{{ emoji }}</text>
          </view>
        </scroll-view>
      </view>
      <view class="input-bar">
        <input
          v-model="inputText"
          class="input-field"
          placeholder="输入文字..."
          confirm-type="send"
          @confirm="sendText"
        />
        <view class="input-btn" @click="showEmojiPanel = !showEmojiPanel">
          <text class="input-btn-label">表情</text>
        </view>
        <view class="input-btn" @touchstart="startRecord" @touchend="stopRecord">
          <text class="input-btn-label">语音</text>
        </view>
      </view>
    </view>

    <view v-if="recording" class="tu-mask" style="display:flex;align-items:center;justify-content:center;">
      <view class="recording-indicator">
        <view class="recording-dot"></view>
        <text class="recording-text">录音中 {{ recordTime }}s</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { api } from '../../api'
import { formatCountdown } from '../../utils/helpers'
import type { TreeholeMessage, TreeholeSession } from '../../types'

const sessionId = ref(0)
const myId = ref(0)
const messages = ref<TreeholeMessage[]>([])
const inputText = ref('')
const showEmojiPanel = ref(false)
const recording = ref(false)
const recordTime = ref(0)
const scrollTop = ref(0)
const session = ref<TreeholeSession | null>(null)
const page = ref(1)
const hasMore = ref(true)
const loadingMore = ref(false)
let recordTimer: any = null
let countdownTimer: any = null
let recorderManager: any = null
let recordedFilePath = ''
let innerAudioContext: any = null

const emojis = [
  '😂', '😭', '😡', '🤡', '💔', '🫂', '💪', '🙏',
  '👀', '🤷', '😤', '🥲', '🙄', '😴', '🤮', '🤯',
  '😱', '🥵', '🥶', '😵', '🤪', '🤨', '😏', '😒',
  '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😠', '🤬', '👎', '💩',
  '🤦', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '👇', '☝️', '✋', '👋', '🤚', '🖐️', '👌',
  '🤌', '🤏', '✍️', '👏', '🙌', '🤲', '🤝', '🔥',
]
const receiverEmoji = ref('🌵')
const countdownText = ref('')

const progressPercent = computed(() => {
  if (!session.value) return 100
  const created = new Date(session.value.createdAt).getTime()
  const expires = new Date(session.value.expiresAt).getTime()
  const now = Date.now()
  const total = expires - created
  const elapsed = now - created
  return Math.max(0, Math.min(100, 100 - (elapsed / total) * 100))
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  sessionId.value = Number(currentPage?.options?.id || 1)
  loadSession()
  loadMessages()
  startCountdown()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (recordTimer) clearInterval(recordTimer)
  if (innerAudioContext) innerAudioContext.destroy()
})

async function loadSession() {
  try {
    session.value = await api.get<TreeholeSession>(`/treehole/${sessionId.value}`)
    receiverEmoji.value = session.value?.receiverMasthead?.avatarEmoji || '🌵'
  } catch {
    session.value = {
      id: sessionId.value,
      initiatorId: 0,
      receiverId: 1,
      receiverMasthead: { id: 1, userId: 1, nickname: '会唱歌的仙人掌', avatarUrl: '', avatarEmoji: '🌵', isFixed: false, usedCount: 1, lastUsedAt: '' },
      matchedTags: ['职场内耗'],
      matchScore: 92,
      expiresAt: new Date(Date.now() + 23 * 3600000).toISOString(),
      status: 1,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }
  }
}

async function loadMessages() {
  page.value = 1
  hasMore.value = true
  try {
    const res = await api.get<any>(`/treehole/${sessionId.value}/messages?page=1&pageSize=20`)
    const list = res.list || res || []
    messages.value = list
    hasMore.value = list.length >= 20
  } catch {
    messages.value = getMockMessages(1)
    hasMore.value = true
  }
  await nextTick()
  scrollTop.value = 99999
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  page.value++
  try {
    const res = await api.get<any>(`/treehole/${sessionId.value}/messages?page=${page.value}&pageSize=20`)
    const list = res.list || res || []
    if (list.length > 0) {
      messages.value = [...list, ...messages.value]
    }
    hasMore.value = list.length >= 20
  } catch {
    const older = getMockMessages(page.value)
    if (older.length > 0) {
      messages.value = [...older, ...messages.value]
      hasMore.value = page.value < 3
    } else {
      hasMore.value = false
    }
  }
  loadingMore.value = false
}

function startCountdown() {
  const update = () => {
    if (session.value) {
      countdownText.value = formatCountdown(session.value.expiresAt)
    }
  }
  update()
  countdownTimer = setInterval(update, 60000)
}

function goBack() {
  uni.navigateBack()
}

async function sendText() {
  if (!inputText.value.trim()) return
  const text = inputText.value
  inputText.value = ''
  messages.value.push({
    id: Date.now(),
    sessionId: sessionId.value,
    senderId: myId.value,
    msgType: 1,
    content: text,
    resourceUrl: null,
    duration: 0,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  await nextTick()
  scrollTop.value = 99999
  try {
    await api.post(`/treehole/${sessionId.value}/messages`, { msgType: 1, content: text })
  } catch {}
}

async function sendEmoji(emoji: string) {
  showEmojiPanel.value = false
  messages.value.push({
    id: Date.now(),
    sessionId: sessionId.value,
    senderId: myId.value,
    msgType: 3,
    content: emoji,
    resourceUrl: null,
    duration: 0,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  await nextTick()
  scrollTop.value = 99999
  try {
    await api.post(`/treehole/${sessionId.value}/messages`, { msgType: 3, content: emoji })
  } catch {}
}

function startRecord() {
  recording.value = true
  recordTime.value = 0
  recordedFilePath = ''
  recorderManager = uni.getRecorderManager()
  recorderManager.onStop((res: any) => {
    recordedFilePath = res.tempFilePath
  })
  recorderManager.start({ format: 'mp3', duration: 15000 })
  recordTimer = setInterval(() => {
    recordTime.value++
    if (recordTime.value >= 15) stopRecord()
  }, 1000)
}

async function stopRecord() {
  if (!recording.value) return
  clearInterval(recordTimer)
  recording.value = false
  if (recordTime.value < 1) {
    uni.showToast({ title: '录音太短了', icon: 'none' })
    if (recorderManager) recorderManager.stop()
    return
  }
  if (recorderManager) recorderManager.stop()

  setTimeout(async () => {
    let resourceUrl = ''
    try {
      if (recordedFilePath) {
        const data = await api.upload<{ url: string }>('/upload/voice', recordedFilePath)
        resourceUrl = data.url
      }
      messages.value.push({
        id: Date.now(),
        sessionId: sessionId.value,
        senderId: myId.value,
        msgType: 2,
        content: null,
        resourceUrl,
        duration: recordTime.value,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      await nextTick()
      scrollTop.value = 99999
      await api.post(`/treehole/${sessionId.value}/messages`, { msgType: 2, duration: recordTime.value, resourceUrl })
    } catch {}
  }, 300)
}

function playVoice() {
  if (innerAudioContext) {
    innerAudioContext.stop()
  }
  innerAudioContext = uni.createInnerAudioContext()
  innerAudioContext.src = ''
  innerAudioContext.play()
}

function endSession() {
  uni.showModal({
    title: '结束对话',
    content: '结束后对话将被销毁，确定吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.post(`/treehole/${sessionId.value}/end`)
        } catch {}
        uni.navigateBack()
      }
    },
  })
}

function getMockMessages(p: number): TreeholeMessage[] {
  if (p === 1) {
    return [
      {
        id: 101,
        sessionId: sessionId.value,
        senderId: 1,
        msgType: 1,
        content: '我懂，我领导也这样',
        resourceUrl: null,
        duration: 0,
        isRead: true,
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: 102,
        sessionId: sessionId.value,
        senderId: 0,
        msgType: 1,
        content: '真的吗！我以为只有我',
        resourceUrl: null,
        duration: 0,
        isRead: true,
        createdAt: new Date(Date.now() - 28 * 60000).toISOString(),
      },
      {
        id: 103,
        sessionId: sessionId.value,
        senderId: 1,
        msgType: 2,
        content: null,
        resourceUrl: '',
        duration: 3,
        isRead: true,
        createdAt: new Date(Date.now() - 27 * 60000).toISOString(),
      },
    ]
  }

  if (p === 2) {
    return [
      {
        id: 201,
        sessionId: sessionId.value,
        senderId: 1,
        msgType: 1,
        content: '今天又被拉去开会了，开了两小时啥结论没有',
        resourceUrl: null,
        duration: 0,
        isRead: true,
        createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
      },
      {
        id: 202,
        sessionId: sessionId.value,
        senderId: 0,
        msgType: 1,
        content: '同感，我们领导最爱说"再对齐一下"',
        resourceUrl: null,
        duration: 0,
        isRead: true,
        createdAt: new Date(Date.now() - 58 * 60000).toISOString(),
      },
      {
        id: 203,
        sessionId: sessionId.value,
        senderId: 1,
        msgType: 3,
        content: '🙄',
        resourceUrl: null,
        duration: 0,
        isRead: true,
        createdAt: new Date(Date.now() - 57 * 60000).toISOString(),
      },
      {
        id: 204,
        sessionId: sessionId.value,
        senderId: 0,
        msgType: 1,
        content: '哈哈太真实了',
        resourceUrl: null,
        duration: 0,
        isRead: true,
        createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
      },
    ]
  }

  return []
}
</script>

<style scoped>
/* ===== Countdown Bar ===== */
.tu-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.countdown-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 32rpx 10rpx;
  background: var(--tu-bg-nav);
}

.countdown-left {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.countdown-icon {
  font-size: 24rpx;
  line-height: 1;
}

.countdown-label {
  font-size: 22rpx;
  color: var(--tu-text-3);
  letter-spacing: 0.03em;
}

.countdown-right {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}

.countdown-time {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--tu-pale-red-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.countdown-suffix {
  font-size: 22rpx;
  color: var(--tu-text-3);
}

.countdown-track {
  height: 2rpx;
  background: var(--tu-border);
  overflow: hidden;
}

.countdown-fill {
  height: 100%;
  background: var(--tu-pale-red-text);
  border-radius: 1rpx;
  transition: width 0.3s ease;
}

.chat-scroll {
  flex: 1;
  padding: 24rpx 32rpx;
  min-height: 0;
}

.msg-item {
  display: flex;
  margin-bottom: 24rpx;
  align-items: flex-start;
}

.msg-mine {
  justify-content: flex-end;
}

.msg-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
  margin-right: 16rpx;
}

.msg-avatar-mine {
  margin-right: 0;
  margin-left: 16rpx;
  background: var(--tu-accent);
}

.msg-avatar-label {
  font-size: 24rpx;
  color: #FFFFFF;
}

.msg-bubble {
  max-width: 480rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  border-radius: 16rpx 16rpx 16rpx 4rpx;
  padding: 20rpx 28rpx;
}

.msg-bubble-mine {
  background: var(--tu-accent);
  border: 1rpx solid var(--tu-accent);
  border-radius: 16rpx 16rpx 4rpx 16rpx;
}

.msg-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: var(--tu-text);
}

.msg-bubble-mine .msg-text {
  color: #FFFFFF;
}

.msg-voice {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.voice-waveform {
  display: flex;
  align-items: center;
  gap: 4rpx;
  height: 36rpx;
}

.wave-bar {
  width: 4rpx;
  border-radius: 2rpx;
}

.wave-bar:nth-child(1) {
  height: 16rpx;
}

.wave-bar:nth-child(2) {
  height: 28rpx;
}

.wave-bar:nth-child(3) {
  height: 36rpx;
}

.wave-bar:nth-child(4) {
  height: 24rpx;
}

.wave-bar:nth-child(5) {
  height: 14rpx;
}

.msg-bubble:not(.msg-bubble-mine) .wave-bar {
  background: var(--tu-text-2);
}

.msg-bubble-mine .wave-bar {
  background: #FFFFFF;
}

.voice-duration {
  font-size: 26rpx;
  color: var(--tu-text-2);
}

.msg-bubble-mine .voice-duration {
  color: #FFFFFF;
}

.msg-emoji {
  font-size: 56rpx;
}

.msg-bottom-space {
  height: 40rpx;
}

.load-more-hint {
  text-align: center;
  padding: 16rpx 0;
  font-size: 24rpx;
  color: var(--tu-text-3);
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--tu-bg-nav);
  border-top: 1rpx solid var(--tu-border);
}

.input-field {
  flex: 1;
  height: 72rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  border-radius: 8rpx;
  padding: 0 28rpx;
  font-size: 28rpx;
  color: var(--tu-text);
}

.input-btn {
  height: 72rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: 8rpx;
}

.input-btn-label {
  font-size: 26rpx;
  color: var(--tu-text-2);
}

/* ===== Input Wrap & Emoji Overlay ===== */
.input-wrap {
  position: relative;
}

.emoji-overlay {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-bottom: none;
  border-radius: var(--tu-radius) var(--tu-radius) 0 0;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.emoji-scroll {
  max-height: 480rpx;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx 24rpx;
}

.emoji-item {
  font-size: 52rpx;
  width: 84rpx;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recording-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 48rpx 64rpx;
}

.recording-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #E63946;
  animation: tu-pulse 1s infinite;
}

.recording-text {
  font-size: 28rpx;
  color: var(--tu-text-2);
}
</style>
