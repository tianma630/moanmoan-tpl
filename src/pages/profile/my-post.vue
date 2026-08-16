<template>
  <view class="tu-page">

      <view class="tu-nav-bar">
        <text class="tu-nav-back" @click="goBack">←</text>
        <text class="tu-nav-title">{{activeTabLabel}}</text>
        <text class="tu-nav-placeholder"></text>
      </view>

      <scroll-view scroll-y class="my-list">
        <view v-if="myPosts.length === 0" class="tu-empty">
          <view class="empty-mark"></view>
          <text style="margin-top: 24rpx;">{{ emptyText }}</text>
        </view>

        <view v-if="myPosts.length > 0" class="my-post-group tu-fade-in">
          <view
            v-for="post in myPosts"
            :key="post.id"
            class="my-post-item"
            @click="goDetail(post.id)"
          >
            <view class="post-item-body">
              <text class="post-item-icon">📝</text>
              <text class="post-item-content">{{ post.content }}</text>
            </view>
            <view class="post-item-footer">
              <view class="post-stats-group">
                <text class="post-emoji-stat">👋 {{ post.patCount }}</text>
                <text class="post-emoji-stat">🗣️ {{ post.echoCount }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '../../api'
import { getCurrentMasthead, getUserInfo } from '../../utils/helpers'
import type { Post } from '../../types'

const tabs = [
  { key: 'posts', label: '我的吐槽' },
  { key: 'echos', label: '我的回声' },
  { key: 'collect', label: '我的收藏' },
]

const activeTab = ref('posts')
const myPosts = ref<Post[]>([])
const user = ref<any>(null)
const masthead = ref<any>(null)

const activeTabLabel = computed(() => {
  return tabs.find(t => t.key === activeTab.value)?.label || '我的吐槽'
})

const emptyText = computed(() => {
  if (activeTab.value === 'posts') return '还没吐过槽，去开第一吐'
  if (activeTab.value === 'echos') return '还没有回声记录'
  return '还没有收藏'
})

onMounted(() => {
  user.value = getUserInfo()
  masthead.value = getCurrentMasthead()
})

onShow(() => {
  user.value = getUserInfo()
  masthead.value = getCurrentMasthead()
  loadMyPosts()
})

function goBack() {
  uni.navigateBack()
}

async function loadMyPosts() {
  try {
    const res = await api.get<any>(`/users/my-posts?type=${activeTab.value}`)
    myPosts.value = res.list || res || []
  } catch {
    myPosts.value = getMockPosts()
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
}

function getMockPosts(): Post[] {
  const base = [
    {
      id: 1,
      userId: 0,
      mastheadId: 0,
      content: '方案改了8版，老板说还是觉得第一版比较好...',
      images: null,
      privacyType: 1,
      locationCity: null,
      patCount: 128,
      echoCount: 23,
      status: 1,
      tags: [],
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: '',
    },
    {
      id: 2,
      userId: 0,
      mastheadId: 0,
      content: 'ta回消息的速度比我写方案还慢，我写完8版了ta才回了一个"嗯"',
      images: null,
      privacyType: 1,
      locationCity: null,
      patCount: 56,
      echoCount: 12,
      status: 1,
      tags: [],
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      updatedAt: '',
    },
    {
      id: 3,
      userId: 0,
      mastheadId: 0,
      content: '今天地铁上一个人占了三个座位，书包比我还金贵',
      images: null,
      privacyType: 1,
      locationCity: null,
      patCount: 203,
      echoCount: 45,
      status: 1,
      tags: [],
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: '',
    },
  ]

  if (activeTab.value === 'echos') {
    return base.map(p => ({
      ...p,
      content: `我给「${p.content.slice(0, 12)}...」回了声`,
      patCount: Math.floor(p.patCount / 3),
      echoCount: Math.floor(p.echoCount / 2),
    }))
  }

  if (activeTab.value === 'collect') {
    return base.slice(0, 2).map(p => ({
      ...p,
      content: `[收藏] ${p.content}`,
    }))
  }

  return base
}
</script>

<style scoped>
/* ===== Profile Card ===== */
.profile-card {
  display: flex;
  align-items: flex-start;
  padding: 36rpx 32rpx;
  margin: 24rpx 32rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
}

.profile-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 28rpx;
  flex-shrink: 0;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
}

.profile-avatar-emoji {
  font-size: 56rpx;
}

.profile-info {
  flex: 1;
  padding-top: 4rpx;
}

.profile-nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--tu-text);
  display: block;
  margin-bottom: 16rpx;
  letter-spacing: -0.02em;
}

.profile-energy {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.energy-label {
  font-size: 26rpx;
  color: var(--tu-text-2);
  letter-spacing: 0.01em;
}

.energy-value {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--tu-pale-yellow-text);
}

.profile-sub-stats {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sub-stat {
  font-size: 24rpx;
  color: var(--tu-text-2);
}

.sub-stat-sep {
  font-size: 24rpx;
  color: var(--tu-text-3);
}

/* ===== Vertical Menu List ===== */
.menu-list {
  margin: 0 32rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  overflow: hidden;
}

.menu-row {
  display: flex;
  align-items: center;
  padding: 32rpx 32rpx;
  position: relative;
  transition: background 0.15s ease;
}

.menu-row:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 32rpx;
  right: 32rpx;
  height: 1rpx;
  background: var(--tu-border);
}

.menu-row:active {
  background: var(--tu-bg-card-hover);
}

.menu-row-icon {
  font-size: 32rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
  line-height: 1;
}

.menu-row-text {
  flex: 1;
  font-size: 30rpx;
  color: var(--tu-text);
  letter-spacing: -0.01em;
}

.menu-row-arrow {
  font-size: 36rpx;
  color: var(--tu-text-3);
  line-height: 1;
}

/* ===== List View Nav ===== */
.list-nav {
  justify-content: flex-start;
}

.list-nav-back {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.list-nav-back-arrow {
  font-size: 36rpx;
  color: var(--tu-text);
  line-height: 1;
}

.list-nav-back-text {
  font-size: 28rpx;
  color: var(--tu-text-2);
  line-height: 1;
}

.list-nav-divider {
  width: 1rpx;
  height: 36rpx;
  background: var(--tu-border);
  margin: 0 20rpx;
  flex-shrink: 0;
}

.list-nav-title {
  flex: 1;
  text-align: left;
}

/* ===== Content List ===== */
.my-list {
  height: calc(100vh - 88rpx - var(--status-bar-height, 44rpx));
}

.my-post-group {
  margin: 24rpx 32rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  overflow: hidden;
}

.my-post-item {
  padding: 28rpx 32rpx;
  transition: background 0.15s ease;
  position: relative;
}

.my-post-item:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 32rpx;
  right: 32rpx;
  height: 1rpx;
  background: var(--tu-border);
}

.my-post-item:active {
  background: var(--tu-bg-card-hover);
}

.post-item-body {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.post-item-icon {
  font-size: 28rpx;
  flex-shrink: 0;
  line-height: 1.7;
}

.post-item-content {
  font-size: 28rpx;
  color: var(--tu-text);
  line-height: 1.7;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-item-footer {
  display: flex;
  align-items: center;
}

.post-stats-group {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.post-emoji-stat {
  font-size: 24rpx;
  color: var(--tu-text-2);
  letter-spacing: 0.02em;
}

/* ===== Empty State ===== */
.empty-mark {
  width: 64rpx;
  height: 64rpx;
  border: 2rpx solid var(--tu-border);
  border-radius: 50%;
  position: relative;
}

.empty-mark::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24rpx;
  height: 24rpx;
  border: 2rpx solid var(--tu-border);
  border-radius: 50%;
}
</style>
