<template>
  <view
    class="post-card tu-fade-in"
    @longpress="onLongPress"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <view class="post-header">
      <view class="post-avatar">
        <text class="post-avatar-emoji">{{ post.masthead?.avatarEmoji || 'T' }}</text>
      </view>
      <view class="post-header-info">
        <text class="post-nickname">{{ post.masthead?.nickname || '匿名吐槽侠' }}</text>
        <view class="post-meta">
          <text v-for="tag in post.tags" :key="tag.id" class="tu-tag">#{{ tag.name }}</text>
          <text class="post-time">{{ formatTime(post.createdAt) }}</text>
        </view>
      </view>
    </view>

    <view class="post-body" @click="goDetail">
      <text class="post-content">{{ post.content }}</text>
      <view v-if="post.images && post.images.length > 0" class="post-images">
        <image
          v-for="(img, i) in post.images"
          :key="i"
          :src="img"
          mode="aspectFill"
          class="post-image"
          @click.stop="previewImage(img, post.images!)"
        />
      </view>
    </view>

    <view class="post-footer">
      <view class="post-action" @click.stop="onPat">
        <view class="post-action-icon" :class="{ 'pat-active': post.isPatted }">
          <view class="icon-hand"></view>
        </view>
        <text class="post-action-text" :class="{ 'pat-active-text': post.isPatted }">
          拍一拍 {{ post.patCount }}
        </text>
      </view>
      <view class="post-action" @click.stop="goDetail">
        <view class="post-action-icon">
          <view class="icon-echo"></view>
        </view>
        <text class="post-action-text">回声 {{ post.echoCount }}</text>
      </view>
    </view>

    <view v-if="showPatAnim" class="pat-animation">
      <view class="pat-handprint"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Post } from '../types'
import { formatTime } from '../utils/helpers'
import { api } from '../api'

const props = defineProps<{ post: Post }>()
const emit = defineEmits<{ (e: 'longpress', post: Post): void }>()

const showPatAnim = ref(false)
const lastTap = ref(0)

function onTouchStart(e: any) {
  const now = Date.now()
  if (now - lastTap.value < 300) {
    onPat()
  }
  lastTap.value = now
}

function onTouchEnd() {}

function onLongPress() {
  emit('longpress', props.post)
}

async function onPat() {
  if (props.post.isPatted) {
    uni.showToast({ title: '已经拍过了', icon: 'none' })
    return
  }
  showPatAnim.value = true
  setTimeout(() => { showPatAnim.value = false }, 800)

  try {
    await api.post(`/posts/${props.post.id}/pat`)
    props.post.isPatted = true
    props.post.patCount++
  } catch {
    props.post.isPatted = true
    props.post.patCount++
  }
}

function goDetail() {
  uni.navigateTo({ url: `/pages/post-detail/index?id=${props.post.id}` })
}

function previewImage(current: string, urls: string[]) {
  uni.previewImage({ current, urls })
}
</script>

<style scoped>
.post-card {
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 28rpx 32rpx;
  margin-bottom: 16rpx;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.post-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.post-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 20rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
}

.post-avatar-emoji {
  font-size: 36rpx;
}

.post-header-info {
  flex: 1;
}

.post-nickname {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--tu-text);
  margin-bottom: 6rpx;
  display: block;
  letter-spacing: -0.01em;
}

.post-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.post-time {
  font-size: 22rpx;
  color: var(--tu-text-3);
  margin-left: 8rpx;
}

.post-body {
  margin-bottom: 20rpx;
}

.post-content {
  font-size: 30rpx;
  line-height: 1.7;
  color: var(--tu-text);
  word-break: break-all;
}

.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.post-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: var(--tu-radius-sm);
}

.post-footer {
  display: flex;
  align-items: center;
  gap: 48rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid var(--tu-border);
}

.post-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.post-action-icon {
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

.post-action-text {
  font-size: 24rpx;
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

.pat-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.pat-handprint {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--tu-pale-red-bg);
  animation: pat-pop 0.8s ease-out forwards;
}

@keyframes pat-pop {
  0% { transform: scale(0); opacity: 0; }
  30% { transform: scale(1.3); opacity: 1; }
  60% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
