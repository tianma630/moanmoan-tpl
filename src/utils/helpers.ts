import { api } from '../api'
import type { User, Masthead } from '../types'

const ADJECTIVES = [
  '暴躁的', '失眠的', 'emo的', '佛系的', '社恐的', '摸鱼的',
  '加班的', '秃头的', '摆烂的', 'emo的', '躺平的', '破防的',
  '焦虑的', '快乐的', '迷茫的', '倔强的', '傲娇的', '沙雕的',
]

const NOUNS = [
  '秋刀鱼', '奶茶', '仙人掌', '柴犬', '猫薄荷', '电风扇',
  '保温杯', '打工仔', '干饭人', '社畜', '夜猫子', '咸鱼',
  '鸽子', '树懒', '水豚', '柯基', '蜗牛', '企鹅',
]

const AVATAR_EMOJIS = [
  '🎭', '🦊', '🐱', '🐧', '🦉', '🐙', '🦥', '🐳',
  '🍄', '🌵', '🌙', '⚡', '🔥', '💧', '⭐', '🎯',
]

export function generateMasthead(): { nickname: string; avatarEmoji: string } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const avatarEmoji = AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
  return { nickname: `${adj}${noun}`, avatarEmoji }
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

export function formatCountdown(expiresAt: string): string {
  const expires = new Date(expiresAt).getTime()
  const now = Date.now()
  const diff = expires - now
  if (diff <= 0) return '已销毁'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return `${hours}时${minutes}分`
}

export function initUser() {
  const token = uni.getStorageSync('user_token')
  if (token) return

  const deviceId = generateDeviceId()
  uni.setStorageSync('device_id', deviceId)

  api.post('/auth/login', { deviceId }).then((data: any) => {
    uni.setStorageSync('user_token', data.token)
    uni.setStorageSync('user_info', data.user)
    uni.setStorageSync('current_masthead', data.masthead)
  }).catch(() => {
    const masthead = generateMasthead()
    uni.setStorageSync('current_masthead', masthead)
  })
}

export function generateDeviceId(): string {
  const stored = uni.getStorageSync('device_id')
  if (stored) return stored
  return 'dev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

export function getCurrentMasthead(): { nickname: string; avatarEmoji: string } | null {
  return uni.getStorageSync('current_masthead')
}

export function getUserInfo(): any {
  return uni.getStorageSync('user_info')
}

export function getEnergy(): number {
  const user = getUserInfo()
  return user?.energy || 0
}

export function isWxLoggedIn(): boolean {
  return !!uni.getStorageSync('wx_login_code')
}

export function ensureWxLogin(): Promise<boolean> {
  return new Promise((resolve) => {
    if (isWxLoggedIn()) {
      resolve(true)
      return
    }
    uni.login({
      provider: 'weixin',
      success: async (res) => {
        if (res.code) {
          try {
            const data = await api.post('/auth/wx-login', { code: res.code })
            uni.setStorageSync('wx_login_code', res.code)
            if (data?.token) {
              uni.setStorageSync('user_token', data.token)
            }
            if (data?.user) {
              uni.setStorageSync('user_info', data.user)
            }
            if (data?.masthead) {
              uni.setStorageSync('current_masthead', data.masthead)
            }
            resolve(true)
          } catch {
            uni.setStorageSync('wx_login_code', res.code)
            resolve(true)
          }
        } else {
          resolve(false)
        }
      },
      fail: () => {
        uni.showToast({ title: '微信登录失败，请重试', icon: 'none' })
        resolve(false)
      },
    })
  })
}
