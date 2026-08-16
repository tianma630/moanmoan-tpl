<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { initUser } from './utils/helpers'

onLaunch(() => {
  initUser()
})
</script>

<style>
/* ===== CSS Custom Properties — Warm Monochrome Editorial ===== */
page {
  --tu-bg: #FBFBFA;
  --tu-bg-nav: #FFFFFF;
  --tu-bg-card: #FFFFFF;
  --tu-bg-card-hover: #F7F6F3;
  --tu-accent: #111111;
  --tu-accent-hover: #333333;
  --tu-text: #111111;
  --tu-text-2: #787774;
  --tu-text-3: #A8A6A1;
  --tu-border: #EAEAEA;
  --tu-border-light: rgba(0, 0, 0, 0.04);
  --tu-radius: 16rpx;
  --tu-radius-sm: 12rpx;
  --tu-radius-xs: 8rpx;

  --tu-pale-red-bg: #FDEBEC;
  --tu-pale-red-text: #9F2F2D;
  --tu-pale-blue-bg: #E1F3FE;
  --tu-pale-blue-text: #1F6C9F;
  --tu-pale-green-bg: #EDF3EC;
  --tu-pale-green-text: #346538;
  --tu-pale-yellow-bg: #FBF3DB;
  --tu-pale-yellow-text: #956400;
  --tu-pale-purple-bg: #F3F0F7;
  --tu-pale-purple-text: #6B4E8A;

  background-color: var(--tu-bg);
  color: var(--tu-text);
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', sans-serif;
  font-size: 28rpx;
  min-height: 100vh;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

view, text, scroll-view, swiper, button, input, textarea {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  display: none;
}

/* ===== Layout ===== */
.tu-page {
  min-height: 100vh;
  background-color: var(--tu-bg);
}

.tu-card {
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 32rpx;
  margin-bottom: 20rpx;
}

/* ===== Navigation Bar ===== */
.tu-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  height: 88rpx;
  padding-top: var(--status-bar-height, 44rpx);
  background: var(--tu-bg-nav);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1rpx solid var(--tu-border);
}

.tu-nav-back {
  font-size: 40rpx;
  color: var(--tu-text);
  width: 60rpx;
  line-height: 1;
}

.tu-nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--tu-text);
  letter-spacing: -0.02em;
}

.tu-nav-end {
  font-size: 26rpx;
  color: var(--tu-text-2);
  width: 60rpx;
  text-align: right;
}

.tu-nav-placeholder {
  width: 60rpx;
}

/* ===== Tags ===== */
.tu-tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  background: var(--tu-pale-yellow-bg);
  color: var(--tu-pale-yellow-text);
  margin-right: 8rpx;
  line-height: 1.6;
  letter-spacing: 0.02em;
}

/* ===== Buttons ===== */
.tu-btn-primary {
  background: var(--tu-accent);
  color: #FFFFFF;
  border: none;
  border-radius: var(--tu-radius-xs);
  padding: 24rpx 0;
  font-size: 30rpx;
  font-weight: 500;
  text-align: center;
  width: 100%;
  letter-spacing: 0.02em;
  transition: background 0.2s ease, transform 0.15s ease;
}

.tu-btn-primary::after {
  border: none;
}

.tu-btn-primary:active {
  background: var(--tu-accent-hover);
  transform: scale(0.98);
}

.tu-btn-ghost {
  background: transparent;
  color: var(--tu-text-2);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius-xs);
  padding: 24rpx 0;
  font-size: 30rpx;
  text-align: center;
  width: 100%;
  transition: background 0.2s ease;
}

.tu-btn-ghost::after {
  border: none;
}

.tu-btn-ghost:active {
  background: var(--tu-bg-card-hover);
}

/* ===== Avatar ===== */
.tu-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
}

/* ===== Empty State ===== */
.tu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: var(--tu-text-3);
  font-size: 26rpx;
  line-height: 1.8;
}

/* ===== Divider ===== */
.tu-divider {
  height: 1rpx;
  background: var(--tu-border);
  margin: 20rpx 0;
}

/* ===== Section ===== */
.tu-section {
  margin: 0 32rpx 20rpx;
  background: var(--tu-bg-card);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius);
  padding: 28rpx 32rpx;
}

.tu-section-title {
  font-size: 24rpx;
  color: var(--tu-text-2);
  margin-bottom: 20rpx;
  display: block;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* ===== Input ===== */
.tu-input {
  width: 100%;
  height: 72rpx;
  background: var(--tu-bg-card-hover);
  border: 1rpx solid var(--tu-border);
  border-radius: var(--tu-radius-xs);
  padding: 0 28rpx;
  font-size: 28rpx;
  color: var(--tu-text);
}

/* ===== Mask & Sheet ===== */
.tu-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
}

.tu-sheet {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: var(--tu-bg-card);
  border-radius: 32rpx 32rpx 0 0;
  padding: 16rpx 0;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ===== Loading ===== */
.tu-loading {
  text-align: center;
  padding: 28rpx;
  color: var(--tu-text-3);
  font-size: 24rpx;
}

/* ===== Animations ===== */
@keyframes tu-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6rpx); }
  75% { transform: translateX(6rpx); }
}

@keyframes tu-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.03); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes tu-fade-in {
  from { opacity: 0; transform: translateY(16rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.tu-fade-in {
  animation: tu-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
