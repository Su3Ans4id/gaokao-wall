import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasSupabase = !!(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ========== 本地存储（Supabase 未配置时的 fallback） ==========

const STORAGE_KEY = 'gaokao_wishes'

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveLocal(wishes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes))
  // 通知同源其他标签页刷新
  try { window.dispatchEvent(new Event('wishes-changed')) } catch {}
}

const localListeners = new Set()

export async function fetchWishes() {
  if (hasSupabase) {
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  return loadLocal()
}

export async function createWish({ user_name, message, image_file }) {
  const safeName = sanitizeInput(user_name).slice(0, 10)
  const safeMsg = sanitizeInput(message).slice(0, 100)

  if (hasSupabase) {
    let image_url = null
    if (image_file) {
      const compressed = await compressImage(image_file)
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wish-images')
        .upload(fileName, compressed, {
          contentType: 'image/jpeg',
          upsert: false,
        })
      if (uploadError) throw uploadError
      const { data: publicUrlData } = supabase.storage
        .from('wish-images')
        .getPublicUrl(fileName)
      image_url = publicUrlData.publicUrl
    }
    const { error } = await supabase.from('wishes').insert({
      user_name: safeName,
      message: safeMsg,
      image_url,
    })
    if (error) throw error
    return
  }

  // localStorage 路径：图片转 base64 存储
  let image_url = null
  if (image_file) {
    const compressed = await compressImage(image_file)
    image_url = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(compressed)
    })
  }

  const wish = {
    id: Date.now(),
    user_name: safeName,
    message: safeMsg,
    image_url,
    created_at: new Date().toISOString(),
  }

  const all = loadLocal()
  all.unshift(wish)
  saveLocal(all)

  // 通知所有监听者（包括当前标签页）
  for (const fn of localListeners) {
    try { fn(wish) } catch {}
  }
}

export function subscribeToWishes(onInsert) {
  if (hasSupabase) {
    return supabase
      .channel('wishes-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wishes' },
        (payload) => onInsert(payload.new)
      )
      .subscribe()
  }

  // localStorage 路径：监听 storage 事件（跨标签页）和自定义事件（同页面）
  localListeners.add(onInsert)

  const onStorage = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const arr = JSON.parse(e.newValue)
        const prev = JSON.parse(e.oldValue || '[]')
        const newItems = arr.filter((w) => !prev.some((p) => p.id === w.id))
        for (const w of newItems) onInsert(w)
      } catch {}
    }
  }
  window.addEventListener('storage', onStorage)

  return {
    unsubscribe: () => {
      localListeners.delete(onInsert)
      window.removeEventListener('storage', onStorage)
    },
  }
}

// ========== 图片压缩 ==========

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size < 500 * 1024) {
      resolve(file)
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      const maxDim = 1200
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim
          width = maxDim
        } else {
          width = (width / height) * maxDim
          height = maxDim
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.8
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('压缩失败')); return }
            if (blob.size < 500 * 1024 || quality < 0.2) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              quality -= 0.1
              tryCompress()
            }
          },
          'image/jpeg',
          quality
        )
      }
      tryCompress()
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

// ========== 敏感词过滤 ==========

const SENSITIVE_WORDS = [
  'fuck', 'shit', 'damn',
  '法轮功', '台独', '藏独', '疆独', '港独',
  '色情', '赌博', '毒品', '枪支',
  '自杀', '杀人', '暴力',
  '广告', '微信号', 'QQ群', '加微信',
]

function sanitizeInput(text) {
  let result = text
  for (const word of SENSITIVE_WORDS) {
    if (result.toLowerCase().includes(word.toLowerCase())) {
      result = result.replace(new RegExp(word, 'gi'), '***')
    }
  }
  return result
}
