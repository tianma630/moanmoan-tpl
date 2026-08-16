import type { ApiResponse } from '../types'

const BASE_URL = 'http://localhost:3000/api'

function getHeaders(): Record<string, string> {
  const token = uni.getStorageSync('user_token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  }
}

export function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: getHeaders(),
      success: (res) => {
        const body = res.data as ApiResponse<T>
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (body.code === 0 || body.code === 200) {
            resolve(body.data)
          } else {
            uni.showToast({ title: body.message || '请求失败', icon: 'none' })
            reject(new Error(body.message))
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
    })
  })
}

export function uploadFile<T = any>(url: string, filePath: string, name: string = 'file'): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('user_token') || ''
    uni.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as ApiResponse<T>
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (body.code === 0 || body.code === 200) {
              resolve(body.data)
            } else {
              uni.showToast({ title: body.message || '上传失败', icon: 'none' })
              reject(new Error(body.message))
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        } catch {
          reject(new Error('上传响应解析失败'))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
    })
  })
}

export const api = {
  get: <T = any>(url: string) => request<T>('GET', url),
  post: <T = any>(url: string, data?: any) => request<T>('POST', url, data),
  put: <T = any>(url: string, data?: any) => request<T>('PUT', url, data),
  delete: <T = any>(url: string) => request<T>('DELETE', url),
  upload: <T = any>(url: string, filePath: string, name: string = 'file') => uploadFile<T>(url, filePath, name),
}
