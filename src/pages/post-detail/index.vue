<template>
  <view class="tu-page">
    <view class="tu-nav-bar">
      <text class="tu-nav-back" @click="goBack">←</text>
      <text class="tu-nav-title">吐槽详情</text>
      <text class="tu-nav-placeholder"></text>
    </view>

    <scroll-view scroll-y class="detail-scroll">
      <view v-if="post" class="post-detail tu-fade-in">
        <view class="detail-header">
          <view class="detail-avatar" :style="{ background: avatarBg }">
            <text class="detail-avatar-emoji">{{ post.masthead?.avatarEmoji || '🎭' }}</text>
          </view>
          <view class="detail-header-info">
            <text class="detail-nickname">{{ post.masthead?.nickname || '匿名吐槽侠' }}</text>
            <text class="detail-time">{{ formatTime(post.createdAt) }}</text>
          </view>
        </view>

        <view class="detail-tags">
          <text v-for="tag in post.tags" :key="tag.id" class="tu-tag">#{{ tag.name }}</text>
        </view>

        <view class="detail-content">
          <text>{{ post.content }}</text>
        </view>

        <view v-if="post.images && post.images.length > 0" class="detail-images">
          <image
            v-for="(img, i) in post.images"
            :key="i"
            :src="img"
            mode="aspectFill"
            class="detail-image"
            @click="previewImage(img, post.images!)"
          />
        </view>

        <view class="detail-footer">
          <view class="detail-action" @click="onPat">
            <view class="detail-action-icon" :class="{ 'pat-active': post.isPatted }">
              <view class="icon-hand"></view>
            </view>
            <text class="detail-action-text" :class="{ 'pat-active-text': post.isPatted }">
              拍一拍 {{ post.patCount }}
            </text>
          </view>
          <view class="detail-action">
            <view class="detail-action-icon">
              <view class="icon-echo"></view>
            </view>
            <text class="detail-action-text">回声 {{ post.echoCount }}</text>
          </view>
        </view>
      </view>

      <view class="tu-divider"></view>

      <view class="echo-section tu-fade-in">
        <text class="echo-title">回声 ({{ echoes.length }})</text>
        <text class="echo-hint">回声只能发语音或表情包哦~</text>

        <view v-if="echoes.length === 0" class="tu-empty">
          <view class="empty-circle"></view>
          <text class="empty-text">还没有回声，来第一个回应吧</text>
        </view>

        <view v-for="echo in echoes" :key="echo.id" class="echo-item">
          <view class="echo-avatar">
            <text>{{ echo.masthead?.avatarEmoji || '🎭' }}</text>
          </view>
          <view class="echo-body">
            <text class="echo-nickname">{{ echo.masthead?.nickname || '匿名' }}</text>
            <view class="echo-content">
              <view v-if="echo.type === 1" class="echo-voice" @click="playVoice">
                <view class="echo-voice-wave">
                  <view class="wave-bar"></view>
                  <view class="wave-bar"></view>
                  <view class="wave-bar"></view>
                  <view class="wave-bar"></view>
                </view>
                <text class="echo-voice-text">语音回声 · {{ echo.duration }}s</text>
              </view>
              <view v-else class="echo-emoji">
                <text class="echo-emoji-large">{{ echo.textPreview || '😂' }}</text>
              </view>
            </view>
            <text class="echo-time">{{ formatTime(echo.createdAt) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="echo-input-wrap">
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
      <view class="echo-input-bar">
        <view class="echo-emoji-btn" @click="showEmojiPanel = !showEmojiPanel">
          <text class="echo-emoji-label">表情</text>
        </view>
        <view class="echo-voice-btn" @touchstart="startRecord" @touchend="stopRecord">
          <text class="echo-voice-label">{{ recording ? '松开发送' : '按住说话' }}</text>
        </view>
      </view>
    </view>

    <view v-if="recording" class="tu-mask" style="display:flex;align-items:center;justify-content:center;">
      <view class="recording-indicator tu-fade-in">
        <view class="recording-dot"></view>
        <text class="recording-text">录音中... {{ recordTime }}s</text>
        <text class="recording-hint">松开发送，上滑取消</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../../api'
import { formatTime } from '../../utils/helpers'
import type { Post, Echo } from '../../types'

const post = ref<Post | null>(null)
const echoes = ref<Echo[]>([])
const showEmojiPanel = ref(false)
const recording = ref(false)
const recordTime = ref(0)
let recordTimer: any = null
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

const avatarBg = computed(() => {
  if (!post.value) return ''
  return 'var(--tu-bg-card-hover)'
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const id = currentPage?.options?.id || 1
  loadPost(Number(id))
  loadEchoes(Number(id))
})

function goBack() {
  uni.navigateBack()
}

async function loadPost(id: number) {
  try {
    post.value = await api.get<Post>(`/posts/${id}`)
  } catch {
    post.value = {
      id,
      userId: 1,
      mastheadId: 1,
      masthead: { id: 1, userId: 1, nickname: '暴躁的秋刀鱼', avatarUrl: '', avatarEmoji: '🦊', isFixed: false, usedCount: 3, lastUsedAt: '' },
      content: '方案改了8版，老板说还是觉得第一版比较好。我整个人都不好了，8版的青春谁来赔？',
      images: null,
      privacyType: 1,
      locationCity: '深圳',
      patCount: 128,
      echoCount: 23,
      status: 1,
      tags: [{ id: 1, name: '职场内耗', icon: '', sortOrder: 1 }],
      createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
      updatedAt: '',
      isPatted: false,
    }
  }
}

async function loadEchoes(id: number) {
  try {
    echoes.value = await api.get<Echo[]>(`/posts/${id}/echos`)
  } catch {
    echoes.value = [
      {
        id: 1,
        postId: id,
        userId: 2,
        mastheadId: 2,
        masthead: { id: 2, userId: 2, nickname: '失眠的奶茶', avatarUrl: '', avatarEmoji: '🐱', isFixed: false, usedCount: 1, lastUsedAt: '' },
        type: 1,
        resourceUrl: '',
        duration: 5,
        textPreview: '',
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: 2,
        postId: id,
        userId: 3,
        mastheadId: 3,
        masthead: { id: 3, userId: 3, nickname: '摆烂的仙人掌', avatarUrl: '', avatarEmoji: '🌵', isFixed: false, usedCount: 5, lastUsedAt: '' },
        type: 2,
        resourceUrl: '',
        duration: 0,
        textPreview: '😂',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
    ]
  }
}

async function onPat() {
  if (!post.value || post.value.isPatted) return
  try {
    await api.post(`/posts/${post.value.id}/pat`)
  } catch {}
  post.value.isPatted = true
  post.value.patCount++
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
    if (recordTime.value >= 15) {
      stopRecord()
    }
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
    try {
      let resourceUrl = ''
      if (recordedFilePath) {
        const data = await api.upload<{ url: string }>('/upload/voice', recordedFilePath)
        resourceUrl = data.url
      }
      await api.post(`/posts/${post.value?.id}/echos`, {
        type: 1,
        duration: recordTime.value,
        resourceUrl,
      })
      uni.showToast({ title: '回声已发送', icon: 'none' })
      loadEchoes(post.value!.id)
    } catch {
      echoes.value.unshift({
        id: Date.now(),
        postId: post.value!.id,
        userId: 0,
        mastheadId: 0,
        masthead: { id: 0, userId: 0, nickname: '我', avatarUrl: '', avatarEmoji: '🎭', isFixed: false, usedCount: 1, lastUsedAt: '' },
        type: 1,
        resourceUrl: '',
        duration: recordTime.value,
        textPreview: '',
        createdAt: new Date().toISOString(),
      })
    }
  }, 300)
}

async function sendEmoji(emoji: string) {
  showEmojiPanel.value = false
  try {
    await api.post(`/posts/${post.value?.id}/echos`, {
      type: 2,
      textPreview: emoji,
      resourceUrl: '',
    })
    uni.showToast({ title: '回声已发送', icon: 'none' })
    loadEchoes(post.value!.id)
  } catch {
    echoes.value.unshift({
      id: Date.now(),
      postId: post.value!.id,
      userId: 0,
      mastheadId: 0,
      masthead: { id: 0, userId: 0, nickname: '我', avatarUrl: '', avatarEmoji: '🎭', isFixed: false, usedCount: 1, lastUsedAt: '' },
      type: 2,
      resourceUrl: '',
      duration: 0,
      textPreview: emoji,
      createdAt: new Date().toISOString(),
    })
  }
}

function playVoice() {
  if (innerAudioContext) {
    innerAudioContext.stop()
  }
  innerAudioContext = uni.createInnerAudioContext()
  innerAudioContext.src = ''
  innerAudioContext.play()
}

function previewImage(current: string, urls: string[]) {
  uni.previewImage({ current, urls })
}
</script>

<style scoped>
.detail-scroll {
  height: calc(100vh - 180rpx);
  padding: 24rpx 32rpx;
}

/* ===== Post Detail Card ===== */
.post-detail {
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 32rpx;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.detail-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
}

.detail-avatar-emoji {
  font-size: 40rpx;
}

.detail-header-info {
  flex: 1;
}

.detail-nickname {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--tu-text);
  display: block;
  margin-bottom: 4rpx;
}

.detail-time {
  font-size: 22rpx;
  color: var(--tu-text-3);
}

.detail-tags {
  margin-bottom: 20rpx;
}

.detail-content {
  font-size: 32rpx;
  line-height: 1.8;
  color: var(--tu-text);
  margin-bottom: 24rpx;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.detail-image {
  width: 220rpx;
  height: 220rpx;
  border-radius: var(--tu-radius-sm);
}

/* ===== Detail Footer Actions ===== */
.detail-footer {
  display: flex;
  gap: 48rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--tu-border);
}

.detail-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.detail-action-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-hand {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  border: 2rpx solid var(--tu-text-2);
  position: relative;
}

.icon-hand::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--tu-text-2);
}

.icon-echo {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid var(--tu-text-2);
  border-radius: 50%;
  position: relative;
}

.icon-echo::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid var(--tu-text-2);
  border-radius: 50%;
  opacity: 0.4;
}

.detail-action-text {
  font-size: 26rpx;
  color: var(--tu-text-2);
}

.pat-active .icon-hand {
  border-color: var(--tu-pale-red-text);
}

.pat-active .icon-hand::after {
  background: var(--tu-pale-red-text);
}

.pat-active-text {
  color: var(--tu-pale-red-text);
}

/* ===== Echo Section ===== */
.echo-section {
  margin-top: 16rpx;
}

.echo-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--tu-text);
  display: block;
  margin-bottom: 6rpx;
}

.echo-hint {
  font-size: 22rpx;
  color: var(--tu-text-3);
  display: block;
  margin-bottom: 24rpx;
}

/* ===== Empty State ===== */
.empty-circle {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2rpx solid var(--tu-border);
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 26rpx;
  color: var(--tu-text-3);
}

/* ===== Echo Items ===== */
.echo-item {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--tu-border);
}

.echo-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}

.echo-body {
  flex: 1;
}

.echo-nickname {
  font-size: 26rpx;
  color: var(--tu-text-2);
  display: block;
  margin-bottom: 8rpx;
}

.echo-content {
  margin-bottom: 8rpx;
}

/* ===== Echo Voice ===== */
.echo-voice {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius-sm);
  padding: 16rpx 24rpx;
}

.echo-voice-wave {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.wave-bar {
  width: 4rpx;
  border-radius: 2rpx;
  background: var(--tu-text-2);
}

.wave-bar:nth-child(1) {
  height: 16rpx;
}

.wave-bar:nth-child(2) {
  height: 24rpx;
}

.wave-bar:nth-child(3) {
  height: 20rpx;
}

.wave-bar:nth-child(4) {
  height: 12rpx;
}

.echo-voice-text {
  font-size: 26rpx;
  color: var(--tu-text-2);
}

.echo-emoji-large {
  font-size: 56rpx;
}

.echo-time {
  font-size: 20rpx;
  color: var(--tu-text-3);
}

/* ===== Input Bar ===== */
.echo-input-wrap {
  position: relative;
}

.echo-input-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--tu-bg-nav);
  border-top: 1rpx solid var(--tu-border);
}

.echo-emoji-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.echo-emoji-label {
  font-size: 26rpx;
  color: var(--tu-text-2);
}

.echo-voice-btn {
  flex: 1;
  height: 80rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.echo-voice-label {
  font-size: 28rpx;
  color: var(--tu-text-2);
}

/* ===== Emoji Overlay ===== */
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

/* ===== Recording Indicator ===== */
.recording-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 48rpx 64rpx;
}

.recording-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: var(--tu-pale-red-text);
  margin-bottom: 20rpx;
  animation: rec-pulse 1s infinite;
}

@keyframes rec-pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.4); }
  100% { opacity: 1; transform: scale(1); }
}

.recording-text {
  font-size: 30rpx;
  color: var(--tu-pale-red-text);
  margin-bottom: 8rpx;
}

.recording-hint {
  font-size: 22rpx;
  color: var(--tu-text-3);
}
</style>
