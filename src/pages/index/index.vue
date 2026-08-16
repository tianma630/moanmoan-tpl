<template>
  <view class="tu-page">
    <view class="tu-nav-bar">
      <text class="nav-title-editorial">吐了个槽</text>
      <view class="nav-spacer"></view>
    </view>

    <view class="tab-bar">
      <text
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ 'tab-active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >{{ tab.label }}</text>
    </view>

    <scroll-view
      scroll-y
      class="post-list"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="posts.length === 0 && !loading" class="tu-empty">
        <view class="empty-mark"></view>
        <text style="margin-top: 24rpx;">这世界今天居然没人糟心？</text>
        <text style="margin-top: 12rpx; color: var(--tu-text-2);">你来开第一吐</text>
      </view>

      <post-card
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @longpress="onLongPress"
      />

      <view v-if="loading" class="tu-loading">
        <text>正在加载</text>
      </view>
      <view v-else-if="!hasMore && posts.length > 0" class="tu-loading">
        <text>已经到底了</text>
      </view>
    </scroll-view>

    <view class="fab-btn" @click="goCreate">
      <view class="fab-plus"></view>
    </view>

    <view v-if="showActionSheet" class="tu-mask" @click="showActionSheet = false" style="display:flex;align-items:flex-end;">
      <view class="action-sheet" @click.stop>
        <view class="action-item" @click="onAction('collect')">
          <text>收藏</text>
        </view>
        <view class="action-item" @click="onAction('dislike')">
          <text>不感兴趣</text>
        </view>
        <view class="action-item" @click="onAction('report')">
          <text>举报</text>
        </view>
        <view class="action-item action-cancel" @click="showActionSheet = false">
          <text>取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PostCard from '../../components/post-card.vue'
import type { Post } from '../../types'
import { api } from '../../api'

const tabs = [
  { key: 'recommend', label: '推荐' },
  { key: 'latest', label: '最新' },
  { key: 'nearby', label: '附近' },
  { key: 'hot', label: '神帖' },
]

const activeTab = ref('recommend')
const posts = ref<Post[]>([])
const loading = ref(false)
const hasMore = ref(true)
const refreshing = ref(false)
const page = ref(1)
const showActionSheet = ref(false)
const currentPost = ref<Post | null>(null)

onMounted(() => {
  loadPosts()
})

onShow(() => {
  if (posts.value.length > 0) {
    page.value = 1
    loadPosts(true)
  }
})

function switchTab(key: string) {
  activeTab.value = key
  page.value = 1
  posts.value = []
  hasMore.value = true
  loadPosts()
}

async function loadPosts(reset = false) {
  if (loading.value) return
  loading.value = true
  try {
    const res = await api.get<any>(`/posts?tab=${activeTab.value}&page=${page.value}&pageSize=10`)
    const list = res.list || res || []
    if (reset || page.value === 1) {
      posts.value = list
    } else {
      posts.value.push(...list)
    }
    hasMore.value = list.length >= 10
  } catch {
    if (page.value === 1) {
      posts.value = getMockPosts()
    }
    hasMore.value = false
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value++
  loadPosts()
}

function onRefresh() {
  refreshing.value = true
  page.value = 1
  loadPosts(true)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/create-post/index' })
}

function onLongPress(post: Post) {
  currentPost.value = post
  showActionSheet.value = true
}

function onAction(action: string) {
  showActionSheet.value = false
  const msgs: Record<string, string> = {
    collect: '已收藏',
    dislike: '将减少此类推荐',
    report: '感谢举报，我们会核实处理',
  }
  uni.showToast({ title: msgs[action] || '操作成功', icon: 'none' })
}

function getMockPosts(): Post[] {
  return [
    {
      id: 1,
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
    },
    {
      id: 2,
      userId: 2,
      mastheadId: 2,
      masthead: { id: 2, userId: 2, nickname: '失眠的奶茶', avatarUrl: '', avatarEmoji: '🐱', isFixed: false, usedCount: 1, lastUsedAt: '' },
      content: 'ta回消息的速度和WiFi信号一样让人焦虑，时有时无的，我到底该不该继续等？',
      images: null,
      privacyType: 1,
      locationCity: '上海',
      patCount: 56,
      echoCount: 12,
      status: 1,
      tags: [{ id: 2, name: '恋爱脑', icon: '', sortOrder: 2 }],
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      updatedAt: '',
      isPatted: false,
    },
    {
      id: 3,
      userId: 3,
      mastheadId: 3,
      masthead: { id: 3, userId: 3, nickname: '摆烂的仙人掌', avatarUrl: '', avatarEmoji: '🌵', isFixed: false, usedCount: 5, lastUsedAt: '' },
      content: '今天地铁上一个人占了三个座位，我礼貌地说了句"能挪一下吗"，对方回我"你管得着吗"。行吧，我管不着，我站着减肥。',
      images: null,
      privacyType: 1,
      locationCity: '北京',
      patCount: 203,
      echoCount: 45,
      status: 1,
      tags: [{ id: 3, name: '生活琐事', icon: '', sortOrder: 3 }, { id: 4, name: '人际关系', icon: '', sortOrder: 4 }],
      createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
      updatedAt: '',
      isPatted: false,
    },
  ]
}
</script>

<style scoped>
.nav-title-editorial {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--tu-text);
  letter-spacing: -0.03em;
}

.nav-spacer {
  width: 60rpx;
}

.tab-bar {
  display: flex;
  padding: 0 24rpx;
  background: var(--tu-bg-nav);
  position: sticky;
  top: calc(88rpx + var(--status-bar-height, 44rpx));
  z-index: 99;
  border-bottom: 1rpx solid var(--tu-border);
}

.tab-item {
  font-size: 30rpx;
  color: var(--tu-text-2);
  padding: 24rpx 28rpx;
  position: relative;
  transition: color 0.2s ease;
  line-height: 1;
}

.tab-active {
  color: var(--tu-text);
  font-weight: 600;
}

.tab-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: var(--tu-text);
  border-radius: 2rpx;
}

.post-list {
  padding: 24rpx 32rpx;
  height: calc(100vh - 200rpx);
  box-sizing: border-box;
}

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 180rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--tu-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  transition: transform 0.15s ease;
}

.fab-btn:active {
  transform: scale(0.95);
}

.fab-plus {
  width: 32rpx;
  height: 32rpx;
  position: relative;
}

.fab-plus::before,
.fab-plus::after {
  content: '';
  position: absolute;
  background: #FFFFFF;
  border-radius: 2rpx;
}

.fab-plus::before {
  top: 50%;
  left: 0;
  width: 100%;
  height: 4rpx;
  transform: translateY(-50%);
}

.fab-plus::after {
  left: 50%;
  top: 0;
  width: 4rpx;
  height: 100%;
  transform: translateX(-50%);
}

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

.action-sheet {
  width: 100%;
  background: var(--tu-bg-card);
  border-radius: 32rpx 32rpx 0 0;
  padding: 16rpx 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.action-item {
  padding: 32rpx;
  text-align: center;
  font-size: 30rpx;
  color: var(--tu-text);
  border-bottom: 1rpx solid var(--tu-border);
}

.action-cancel {
  color: var(--tu-text-2);
  border-bottom: none;
  margin-top: 12rpx;
  border-top: 12rpx solid var(--tu-bg);
}
</style>
