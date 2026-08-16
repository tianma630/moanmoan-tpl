<template>
  <view v-if="visible" class="login-guard tu-fade-in">
    <view class="guard-card">
      <view class="guard-icon">
        <view class="guard-icon-inner"></view>
      </view>
      <text class="guard-title">需要微信登录</text>
      <text class="guard-desc">{{ desc }}</text>
      <button class="tu-btn-primary guard-btn" @click="doLogin">
        微信登录
      </button>
      <text class="guard-cancel" @click="goBack">暂不登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { isWxLoggedIn, ensureWxLogin } from '../utils/helpers'

const props = defineProps<{
  desc?: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'cancel'): void
}>()

const visible = ref(!isWxLoggedIn())

async function doLogin() {
  const ok = await ensureWxLogin()
  if (ok) {
    visible.value = false
    emit('success')
  }
}

function goBack() {
  visible.value = false
  emit('cancel')
  uni.navigateBack()
}
</script>

<style scoped>
.login-guard {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guard-card {
  width: 600rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 56rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.guard-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}

.guard-icon-inner {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: var(--tu-text);
}

.guard-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--tu-text);
  margin-bottom: 12rpx;
  letter-spacing: -0.02em;
}

.guard-desc {
  font-size: 26rpx;
  color: var(--tu-text-2);
  margin-bottom: 40rpx;
  text-align: center;
  line-height: 1.6;
}

.guard-btn {
  width: 100%;
  margin-bottom: 20rpx;
}

.guard-cancel {
  font-size: 26rpx;
  color: var(--tu-text-3);
  padding: 8rpx 24rpx;
}
</style>
