<template>
  <view class="tu-page">
    <view class="tu-nav-bar">
      <text class="tu-nav-title">树洞信箱</text>
      <view class="nav-match-btn" @click="goMatch">
        <text>换一个</text>
      </view>
    </view>

    <view v-if="!currentSession" class="match-area">
      <view v-if="matching" class="matching tu-fade-in">
        <view class="hourglass">
          <view class="hourglass-shape"></view>
        </view>
        <text class="matching-text">正在为你寻找树洞</text>
        <text class="matching-hint">匹配基于共同情绪标签</text>
      </view>
      <view v-else class="match-start tu-fade-in">
        <view class="match-icon-wrap">
          <view class="match-icon-shape"></view>
        </view>
        <text class="match-title">树洞信箱</text>
        <text class="match-desc">随机匹配一个匿名树洞</text>
        <text class="match-desc">双向匿名，24小时后自动销毁</text>
        <text class="match-desc">把不敢说的话，说给懂的人听</text>
        <button class="tu-btn-primary match-btn" @click="goMatch">开始匹配</button>
      </view>
    </view>

    <view v-else class="session-info tu-fade-in">
      <view class="session-card">
        <view class="session-header">
          <view class="session-avatar">
            <text>{{ currentSession.receiverMasthead?.avatarEmoji || '🎭' }}</text>
          </view>
          <view class="session-info-body">
            <text class="session-name">{{ currentSession.receiverMasthead?.nickname || '神秘树洞' }}</text>
            <text class="session-sign">"{{ currentSession.receiverMasthead?.nickname ? '听你说完' : '' }}"</text>
          </view>
          <view class="session-match">
            <text class="match-score">{{ currentSession.matchScore || 92 }}%</text>
            <text class="match-label">匹配度</text>
          </view>
        </view>
        <view v-if="currentSession.matchedTags && currentSession.matchedTags.length > 0" class="session-tags">
          <text v-for="tag in currentSession.matchedTags" :key="tag" class="tu-tag">#{{ tag }}</text>
        </view>
        <view class="session-countdown">
          <view class="countdown-dot"></view>
          <text class="countdown-text">本对话将在 {{ formatCountdown(currentSession.expiresAt) }} 自动销毁</text>
        </view>
        <view class="session-progress">
          <view class="session-progress-bar" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>

      <view class="chat-history" @click="goChat">
        <text class="chat-history-title">查看对话记录</text>
        <text class="chat-history-arrow">→</text>
      </view>
    </view>

    <view class="history-section tu-fade-in">
      <text class="history-title">已销毁的树洞</text>
      <view v-if="destroyedSessions.length === 0" class="tu-empty">
        <view class="empty-shape"></view>
        <text class="empty-text">还没有已销毁的对话</text>
      </view>
      <view v-for="s in destroyedSessions" :key="s.id" class="history-item">
        <view class="history-item-dot"></view>
        <view class="history-item-body">
          <text class="history-item-name">{{ s.receiverMasthead?.nickname || '神秘树洞' }}</text>
          <text class="history-item-time">已于 {{ formatTime(s.expiresAt) }} 销毁</text>
        </view>
      </view>
    </view>

    <!-- <login-guard desc="登录后才能使用树洞信箱" /> -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '../../api'
import { formatTime, formatCountdown } from '../../utils/helpers'
import type { TreeholeSession } from '../../types'
import LoginGuard from '../../components/login-guard.vue'

const matching = ref(false)
const currentSession = ref<TreeholeSession | null>(null)
const destroyedSessions = ref<TreeholeSession[]>([])

const progressPercent = computed(() => {
  if (!currentSession.value) return 0
  const created = new Date(currentSession.value.createdAt).getTime()
  const expires = new Date(currentSession.value.expiresAt).getTime()
  const now = Date.now()
  const total = expires - created
  const elapsed = now - created
  return Math.max(0, Math.min(100, (elapsed / total) * 100))
})

onMounted(() => {
  loadCurrentSession()
  loadDestroyedSessions()
})

onShow(() => {
  loadCurrentSession()
})

async function loadCurrentSession() {
  try {
    currentSession.value = await api.get<TreeholeSession>('/treehole/current')
  } catch {
    currentSession.value = null
  }
}

async function loadDestroyedSessions() {
  try {
    destroyedSessions.value = await api.get<TreeholeSession[]>('/treehole/destroyed')
  } catch {
    destroyedSessions.value = []
  }
}

async function goMatch() {
  matching.value = true
  try {
    const session = await api.post<TreeholeSession>('/treehole/match')
    currentSession.value = session
  } catch {
    setTimeout(() => {
      currentSession.value = {
        id: Date.now(),
        initiatorId: 0,
        receiverId: 1,
        receiverMasthead: { id: 1, userId: 1, nickname: '会唱歌的仙人掌', avatarUrl: '', avatarEmoji: '🌵', isFixed: false, usedCount: 1, lastUsedAt: '' },
        matchedTags: ['职场内耗', '生活琐事'],
        matchScore: 92,
        expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: 1,
        createdAt: new Date().toISOString(),
      }
    }, 2000)
  } finally {
    setTimeout(() => { matching.value = false }, 2000)
  }
}

function goChat() {
  if (currentSession.value) {
    uni.navigateTo({ url: `/pages/treehole/chat?id=${currentSession.value.id}` })
  }
}
</script>

<style scoped>
.tu-page {
  background: var(--tu-bg);
  min-height: 100vh;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', sans-serif;
}

.tu-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
}

.tu-nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--tu-text);
  letter-spacing: -0.01em;
}

.nav-match-btn {
  padding: 12rpx 28rpx;
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius-xs);
  font-size: 26rpx;
  color: var(--tu-text-2);
  line-height: 1;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-match-btn:active {
  background: var(--tu-bg-card-hover);
  color: var(--tu-text);
}

.match-area {
  padding: 80rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.matching {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.hourglass {
  margin-bottom: 32rpx;
}

.hourglass-shape {
  width: 48rpx;
  height: 64rpx;
  border: 3rpx solid var(--tu-text-2);
  border-radius: 4rpx;
  position: relative;
  animation: tu-pulse 1.5s infinite;
}

.hourglass-shape::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-left: 18rpx solid transparent;
  border-right: 18rpx solid transparent;
  border-top: 24rpx solid var(--tu-text-2);
}

.hourglass-shape::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 18rpx solid transparent;
  border-right: 18rpx solid transparent;
  border-bottom: 24rpx solid var(--tu-text-2);
}

.matching-text {
  font-size: 32rpx;
  color: var(--tu-text);
  margin-bottom: 12rpx;
  letter-spacing: -0.01em;
}

.matching-hint {
  font-size: 24rpx;
  color: var(--tu-text-3);
}

.match-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.match-icon-wrap {
  margin-bottom: 32rpx;
}

.match-icon-shape {
  width: 80rpx;
  height: 64rpx;
  border: 3rpx solid var(--tu-text-2);
  border-radius: 8rpx;
  position: relative;
}

.match-icon-shape::before {
  content: '';
  position: absolute;
  top: -16rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 44rpx;
  height: 16rpx;
  background: var(--tu-text-2);
  border-radius: 4rpx 4rpx 0 0;
}

.match-icon-shape::after {
  content: '';
  position: absolute;
  bottom: 8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: var(--tu-text-2);
}

.match-title {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--tu-text);
  margin-bottom: 24rpx;
  letter-spacing: -0.02em;
}

.match-desc {
  font-size: 26rpx;
  color: var(--tu-text-2);
  margin-bottom: 8rpx;
  text-align: center;
  line-height: 1.6;
}

.match-btn {
  margin-top: 48rpx;
  width: 400rpx;
}

.tu-btn-primary {
  background: var(--tu-text);
  color: #FFFFFF;
  border-radius: var(--tu-radius-xs);
  font-size: 30rpx;
  font-weight: 500;
  border: none;
  letter-spacing: 0.02em;
}

.tu-btn-primary:active {
  transform: scale(0.98);
}

.session-info {
  padding: 24rpx 32rpx;
}

.session-card {
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.session-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.session-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.session-info-body {
  flex: 1;
}

.session-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--tu-text);
  display: block;
  margin-bottom: 4rpx;
  letter-spacing: -0.01em;
}

.session-sign {
  font-size: 24rpx;
  color: var(--tu-text-2);
}

.session-match {
  text-align: center;
  flex-shrink: 0;
}

.match-score {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--tu-text);
  display: block;
  letter-spacing: -0.02em;
}

.match-label {
  font-size: 20rpx;
  color: var(--tu-text-3);
}

.session-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.tu-tag {
  font-size: 22rpx;
  color: var(--tu-text-2);
  background: var(--tu-bg-card-hover);
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  letter-spacing: 0.01em;
}

.session-countdown {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.countdown-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--tu-pale-red-text);
  flex-shrink: 0;
}

.countdown-text {
  font-size: 24rpx;
  color: var(--tu-pale-red-text);
}

.session-progress {
  height: 4rpx;
  background: var(--tu-border);
  border-radius: 2rpx;
  overflow: hidden;
}

.session-progress-bar {
  height: 100%;
  background: var(--tu-text);
  border-radius: 2rpx;
  transition: width 0.3s;
}

.chat-history {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.chat-history:active {
  background: var(--tu-bg-card-hover);
}

.chat-history-title {
  font-size: 28rpx;
  color: var(--tu-text);
  letter-spacing: -0.01em;
}

.chat-history-arrow {
  font-size: 32rpx;
  color: var(--tu-text-3);
}

.history-section {
  padding: 0 32rpx 48rpx;
}

.history-title {
  font-size: 24rpx;
  color: var(--tu-text-3);
  margin-bottom: 20rpx;
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-shape {
  width: 56rpx;
  height: 56rpx;
  border: 2rpx solid var(--tu-border);
  border-radius: 50%;
  margin-bottom: 20rpx;
  position: relative;
}

.empty-shape::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: var(--tu-border);
}

.empty-text {
  font-size: 26rpx;
  color: var(--tu-text-3);
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--tu-border);
  opacity: 0.5;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--tu-text-3);
  flex-shrink: 0;
}

.history-item-body {
  flex: 1;
}

.history-item-name {
  font-size: 28rpx;
  color: var(--tu-text);
  display: block;
  margin-bottom: 4rpx;
}

.history-item-time {
  font-size: 22rpx;
  color: var(--tu-text-3);
}

.tu-fade-in {
  animation: tu-fade-in 0.4s ease;
}

@keyframes tu-fade-in {
  from { opacity: 0; transform: translateY(8rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes tu-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
