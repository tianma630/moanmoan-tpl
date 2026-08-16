<template>
  <view class="tu-page">
    <view class="tu-nav-bar">
      <text class="tu-nav-title">消息</text>
    </view>

    <view class="msg-tabs">
      <text
        v-for="tab in tabs"
        :key="tab.key"
        class="msg-tab"
        :class="{ 'msg-tab-active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</text>
    </view>

    <scroll-view scroll-y class="msg-list">
      <view v-if="filteredMessages.length === 0" class="tu-empty">
        <view class="msg-empty-icon">
          <text class="msg-empty-icon-text">空</text>
        </view>
        <text>暂无消息</text>
      </view>

      <view
        v-for="msg in filteredMessages"
        :key="msg.id"
        class="msg-item tu-fade-in"
        @click="onTapMessage(msg)"
      >
        <view class="msg-item-avatar" :style="{ background: getAvatarBg(msg.type) }">
          <text class="msg-item-avatar-text">{{ getAvatarEmoji(msg.type) }}</text>
        </view>
        <view class="msg-item-body">
          <view class="msg-item-header">
            <text class="msg-item-title">{{ msg.title }}</text>
            <text class="msg-item-time">{{ formatTime(msg.createdAt) }}</text>
          </view>
          <text class="msg-item-content">{{ msg.content }}</text>
        </view>
        <view v-if="!msg.isRead" class="msg-item-dot"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../../api'
import { formatTime } from '../../utils/helpers'
import type { MessageItem } from '../../types'

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pat', label: '拍一拍' },
  { key: 'echo', label: '回声' },
  { key: 'system', label: '系统' },
]

const activeTab = ref('all')
const messages = ref<MessageItem[]>([])

const filteredMessages = computed(() => {
  if (activeTab.value === 'all') return messages.value
  return messages.value.filter(m => m.type === activeTab.value)
})

onMounted(() => {
  loadMessages()
})

async function loadMessages() {
  try {
    messages.value = await api.get<MessageItem[]>('/messages')
  } catch {
    messages.value = getMockMessages()
  }
}

function onTapMessage(msg: MessageItem) {
  if (msg.postId) {
    uni.navigateTo({ url: `/pages/post-detail/index?id=${msg.postId}` })
  } else if (msg.sessionId) {
    uni.navigateTo({ url: `/pages/treehole/chat?id=${msg.sessionId}` })
  }
}

function getAvatarBg(type: string): string {
  const map: Record<string, string> = {
    pat: 'var(--tu-pale-yellow-bg)',
    echo: 'var(--tu-pale-red-bg)',
    system: 'var(--tu-pale-blue-bg)',
    treehole: 'var(--tu-pale-green-bg)',
  }
  return map[type] || map.system
}

function getAvatarEmoji(type: string): string {
  const map: Record<string, string> = {
    pat: '拍',
    echo: '声',
    system: '统',
    treehole: '洞',
  }
  return map[type] || '统'
}

function getMockMessages(): MessageItem[] {
  return [
    {
      id: 1,
      type: 'pat',
      title: '暴躁的秋刀鱼',
      content: '拍了拍你的吐槽',
      postId: 1,
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 2,
      type: 'echo',
      title: '失眠的奶茶',
      content: '给你发了一条语音回声',
      postId: 1,
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 3,
      type: 'system',
      title: '系统通知',
      content: '你的吐槽被推荐到「神帖」啦！',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 4,
      type: 'treehole',
      title: '树洞信箱',
      content: '会唱歌的仙人掌 给你发了一条消息',
      sessionId: 1,
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
  ]
}
</script>

<style scoped>
.msg-tabs {
  display: flex;
  padding: 0 24rpx;
  background: var(--tu-bg-nav);
  border-bottom: 1rpx solid var(--tu-border);
}

.msg-tab {
  font-size: 30rpx;
  color: var(--tu-text-2);
  padding: 24rpx 28rpx;
  position: relative;
  transition: color 0.2s ease;
  line-height: 1;
}

.msg-tab-active {
  color: var(--tu-text);
  font-weight: 600;
}

.msg-tab-active::after {
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

.msg-list {
  padding: 24rpx 32rpx;
  height: calc(100vh - 200rpx);
}

.msg-empty-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--tu-bg-card-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  border: 1rpx solid var(--tu-border);
}

.msg-empty-icon-text {
  font-size: 32rpx;
  color: var(--tu-text-3);
}

.msg-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius-sm);
  margin-bottom: 16rpx;
  position: relative;
}

.msg-item-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.msg-item-avatar-text {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--tu-text);
}

.msg-item-body {
  flex: 1;
  min-width: 0;
}

.msg-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.msg-item-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--tu-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-item-time {
  font-size: 22rpx;
  color: var(--tu-text-3);
  flex-shrink: 0;
  margin-left: 16rpx;
}

.msg-item-content {
  font-size: 26rpx;
  color: var(--tu-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-item-dot {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 14rpx;
  height: 14rpx;
  background: var(--tu-pale-red-text);
  border-radius: 50%;
}
</style>
