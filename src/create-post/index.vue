<template>
  <view class="tu-page">
    <view class="tu-nav-bar">
      <text class="tu-nav-back" @click="goBack">←</text>
      <text class="tu-nav-title">开吐</text>
      <text class="tu-nav-placeholder"></text>
    </view>

    <view class="editor-area tu-fade-in">
      <textarea
        v-model="content"
        class="editor-input"
        placeholder="今天发生了什么糟心事？"
        placeholder-class="editor-placeholder"
        :maxlength="500"
        auto-height
      />
      <text class="char-count">{{ content.length }}/500</text>
    </view>

    <view class="tu-section tu-fade-in">
      <text class="tu-section-title">添加图片 (最多3张)</text>
      <view class="image-picker">
        <view v-for="(img, i) in images" :key="i" class="image-item">
          <image :src="img" mode="aspectFill" class="preview-img" />
          <view class="image-delete" @click="removeImage(i)">✕</view>
        </view>
        <view v-if="images.length < 3" class="image-add" @click="chooseImage">
          <text class="image-add-icon">+</text>
        </view>
      </view>
    </view>

    <view class="tu-section tu-fade-in">
      <text class="tu-section-title">选择情绪标签</text>
      <view class="tag-list">
        <text
          v-for="tag in availableTags"
          :key="tag.id"
          class="tag-item"
          :class="{ 'tag-selected': isTagSelected(tag) }"
          @click="toggleTag(tag)"
        >#{{ tag.name }}</text>

        <text
          v-for="(ctag, i) in customTags"
          :key="'custom-' + i"
          class="tag-item tag-custom"
          :class="{ 'tag-selected': true }"
          @click="removeCustomTag(i)"
        >#{{ ctag }}</text>

        <view v-if="!showCustomInput && selectedCount < 5" class="tag-add-btn" @click="showCustomInput = true">
          <text class="tag-add-icon">+</text>
          <text class="tag-add-label">自定义</text>
        </view>
      </view>

      <view v-if="showCustomInput" class="custom-input-row">
        <input
          v-model="customTagInput"
          class="custom-input"
          placeholder="输入标签名，2-8个字"
          placeholder-class="custom-placeholder"
          :maxlength="8"
          confirm-type="done"
          @confirm="addCustomTag"
        />
        <view class="custom-confirm-btn" @click="addCustomTag">
          <text>添加</text>
        </view>
        <view class="custom-cancel-btn" @click="cancelCustomInput">
          <text>取消</text>
        </view>
      </view>
    </view>

    <view class="tu-section tu-fade-in">
      <view class="privacy-toggle">
        <view class="privacy-info">
          <text class="privacy-title">仅树洞可见</text>
          <text class="privacy-desc">开启后仅树洞信箱匹配的人可见</text>
        </view>
        <switch :checked="privacyOnly" @change="onPrivacyChange" color="#111111" />
      </view>
    </view>

    <view class="tu-section tu-fade-in">
      <view class="energy-hint">
        <text>发布吐槽可获得 +10 能量值</text>
      </view>
    </view>

    <view class="bottom-bar tu-fade-in">
      <button class="tu-btn-primary" @click="submitPost" :disabled="!content.trim()">
        发送吐槽
      </button>
    </view>

    <view v-if="showSafetyCard" class="tu-mask safety-overlay">
      <view class="safety-card tu-fade-in">
        <view class="safety-icon-shape"></view>
        <text class="safety-title">你好像很难过</text>
        <text class="safety-desc">需要和专业的倾听者聊聊吗？</text>
        <view class="safety-actions">
          <button class="tu-btn-primary" @click="callHotline">拨打心理援助热线</button>
          <button class="tu-btn-ghost" @click="showSafetyCard = false">我没事，谢谢</button>
        </view>
      </view>
    </view>

    <login-guard desc="登录后才能发布吐槽" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '../../api'
import type { Tag } from '../../types'
import LoginGuard from '../../components/login-guard.vue'

const content = ref('')
const images = ref<string[]>([])
const selectedTags = ref<number[]>([])
const customTags = ref<string[]>([])
const privacyOnly = ref(false)
const showSafetyCard = ref(false)
const showCustomInput = ref(false)
const customTagInput = ref('')

const availableTags = ref<Tag[]>([
  { id: 1, name: '职场内耗', icon: '', sortOrder: 1 },
  { id: 2, name: '恋爱脑', icon: '', sortOrder: 2 },
  { id: 3, name: '原生家庭', icon: '', sortOrder: 3 },
  { id: 4, name: '人间不值得', icon: '', sortOrder: 4 },
  { id: 5, name: '沙雕日常', icon: '', sortOrder: 5 },
  { id: 6, name: '生活琐事', icon: '', sortOrder: 6 },
  { id: 7, name: '人际关系', icon: '', sortOrder: 7 },
  { id: 8, name: '学业压力', icon: '', sortOrder: 8 },
])

const selectedCount = computed(() => selectedTags.value.length + customTags.value.length)

const SENSITIVE_WORDS = ['自杀', '去死', '不想活', '跳楼', '割腕', '了结']

function goBack() {
  uni.navigateBack()
}

function toggleTag(tag: Tag) {
  const idx = selectedTags.value.indexOf(tag.id)
  if (idx > -1) {
    selectedTags.value.splice(idx, 1)
  } else {
    if (selectedCount.value >= 5) {
      uni.showToast({ title: '最多选5个标签', icon: 'none' })
      return
    }
    selectedTags.value.push(tag.id)
  }
}

function isTagSelected(tag: Tag) {
  return selectedTags.value.includes(tag.id)
}

function addCustomTag() {
  const name = customTagInput.value.trim()
  if (name.length < 2) {
    uni.showToast({ title: '至少2个字', icon: 'none' })
    return
  }
  if (customTags.value.includes(name)) {
    uni.showToast({ title: '标签已存在', icon: 'none' })
    return
  }
  if (availableTags.value.some(t => t.name === name)) {
    uni.showToast({ title: '标签已存在', icon: 'none' })
    return
  }
  if (selectedCount.value >= 5) {
    uni.showToast({ title: '最多选5个标签', icon: 'none' })
    return
  }
  customTags.value.push(name)
  customTagInput.value = ''
  showCustomInput.value = false
}

function cancelCustomInput() {
  customTagInput.value = ''
  showCustomInput.value = false
}

function removeCustomTag(i: number) {
  customTags.value.splice(i, 1)
}

function chooseImage() {
  uni.chooseImage({
    count: 3 - images.value.length,
    success: (res) => {
      images.value.push(...res.tempFilePaths)
    },
  })
}

function removeImage(i: number) {
  images.value.splice(i, 1)
}

function onPrivacyChange(e: any) {
  privacyOnly.value = e.detail.value
}

function checkSafety(text: string): boolean {
  return SENSITIVE_WORDS.some(w => text.includes(w))
}

async function submitPost() {
  if (!content.value.trim()) {
    uni.showToast({ title: '说点什么吧~', icon: 'none' })
    return
  }

  if (checkSafety(content.value)) {
    showSafetyCard.value = true
    return
  }

  uni.showLoading({ title: '发送中...' })
  try {
    let uploadedImages: string[] | null = null
    if (images.value.length > 0) {
      uploadedImages = []
      for (const img of images.value) {
        const data = await api.upload<{ url: string }>('/upload/image', img)
        uploadedImages.push(data.url)
      }
    }

    await api.post('/posts', {
      content: content.value,
      images: uploadedImages,
      tagIds: selectedTags.value,
      customTags: customTags.value,
      privacyType: privacyOnly.value ? 2 : 1,
    })
    uni.hideLoading()
    uni.showToast({ title: '吐槽成功 +10能量', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '发送失败，请重试', icon: 'none' })
  }
}

function callHotline() {
  showSafetyCard.value = false
  uni.makePhoneCall({ phoneNumber: '4001619995' })
}
</script>

<style scoped>
.editor-area {
  margin: 24rpx 32rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 32rpx;
  position: relative;
}

.editor-input {
  width: 100%;
  min-height: 240rpx;
  font-size: 30rpx;
  line-height: 1.7;
  color: var(--tu-text);
}

.editor-placeholder {
  color: var(--tu-text-3);
}

.char-count {
  text-align: right;
  font-size: 22rpx;
  color: var(--tu-text-3);
  margin-top: 12rpx;
  display: block;
}

.image-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 180rpx;
  height: 180rpx;
}

.preview-img {
  width: 180rpx;
  height: 180rpx;
  border-radius: var(--tu-radius-sm);
}

.image-delete {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background: var(--tu-pale-red-bg);
  color: var(--tu-pale-red-text);
  border-radius: 50%;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-add {
  width: 180rpx;
  height: 180rpx;
  border: 2rpx dashed var(--tu-border);
  border-radius: var(--tu-radius-sm);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-add-icon {
  font-size: 64rpx;
  color: var(--tu-text-3);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  background: var(--tu-bg-card-hover);
  color: var(--tu-text-2);
}

.tag-selected {
  background: var(--tu-pale-yellow-bg);
  color: var(--tu-pale-yellow-text);
}

.tag-custom {
  background: var(--tu-pale-blue-bg);
  color: var(--tu-pale-blue-text);
}

.tag-add-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  border: 1rpx dashed var(--tu-border);
}

.tag-add-icon {
  font-size: 28rpx;
  color: var(--tu-text-3);
}

.tag-add-label {
  font-size: 26rpx;
  color: var(--tu-text-3);
}

.custom-input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
}

.custom-input {
  flex: 1;
  height: 72rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius-xs);
  padding: 0 24rpx;
  font-size: 28rpx;
  color: var(--tu-text);
}

.custom-placeholder {
  color: var(--tu-text-3);
}

.custom-confirm-btn {
  padding: 0 28rpx;
  height: 72rpx;
  background: var(--tu-accent);
  border-radius: var(--tu-radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-confirm-btn text {
  font-size: 26rpx;
  color: #FFFFFF;
}

.custom-cancel-btn {
  padding: 0 28rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-cancel-btn text {
  font-size: 26rpx;
  color: var(--tu-text-2);
}

.privacy-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.privacy-info {
  flex: 1;
}

.privacy-title {
  font-size: 28rpx;
  color: var(--tu-text);
  display: block;
  margin-bottom: 6rpx;
}

.privacy-desc {
  font-size: 22rpx;
  color: var(--tu-text-3);
}

.energy-hint {
  font-size: 24rpx;
  color: var(--tu-pale-yellow-text);
  background: var(--tu-pale-yellow-bg);
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  display: inline-block;
}

.bottom-bar {
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background: var(--tu-bg-nav);
  border-top: 1rpx solid var(--tu-border);
}

.tu-btn-primary[disabled] {
  background: var(--tu-text-3);
  color: rgba(255, 255, 255, 0.7);
}

.safety-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.safety-card {
  width: 600rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.safety-icon-shape {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--tu-pale-yellow-bg);
  border: 2rpx solid var(--tu-pale-yellow-text);
  margin-bottom: 24rpx;
}

.safety-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--tu-text);
  margin-bottom: 12rpx;
  letter-spacing: -0.02em;
}

.safety-desc {
  font-size: 28rpx;
  color: var(--tu-text-2);
  margin-bottom: 40rpx;
  text-align: center;
}

.safety-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
</style>
