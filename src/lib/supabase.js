import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vdnedclzifihnacpeito.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mAwW95tn2SNt91bD_dhQSA_DrWm18qG'

// 管理员 API 密钥 — RLS 策略通过请求头校验
const ADMIN_SECRET = 'gk_8d7e3a1f9c2b4e6a0d5f8c3b7e2a9d4'

// 管理员密码（明文，你可自行修改后重新部署）
const ADMIN_PASSWORD = 'admin123'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 管理员专用客户端 — 附带密钥请求头，RLS 据此放行 UPDATE/DELETE
const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { 'x-admin-secret': ADMIN_SECRET } },
})

// ========== 管理员密码验证 ==========

export function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD
}

// ========== 管理员 CRUD ==========

export async function updateWish(id, { user_name, message, image_url }) {
  const { error } = await adminClient
    .from('wishes')
    .update({ user_name: user_name.slice(0, 10), message: message.slice(0, 100), image_url })
    .eq('id', id)
  if (error) throw error
}

export async function deleteWish(id) {
  const { error } = await adminClient.from('wishes').delete().eq('id', id)
  if (error) throw error
}

// ========== 公共 API ==========

export async function fetchWishes() {
  const { data, error } = await supabase
    .from('wishes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createWish({ user_name, message, image_file }) {
  const safeName = sanitizeInput(user_name).slice(0, 10)
  const safeMsg = sanitizeInput(message).slice(0, 100)

  let image_url = null
  if (image_file) {
    try {
      const compressed = await compressImage(image_file)
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('wish-images')
        .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('wish-images').getPublicUrl(fileName)
        image_url = publicUrlData.publicUrl
      }
    } catch {}
  }

  // 图片上传失败则用 base64
  if (image_file && !image_url) {
    const compressed = await compressImage(image_file)
    image_url = await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(compressed)
    })
  }

  const { error } = await supabase.from('wishes').insert({
    user_name: safeName, message: safeMsg, image_url,
  })
  if (error) throw error
}

export function subscribeToWishes(onInsert) {
  return supabase
    .channel('wishes-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' },
      (payload) => onInsert(payload.new)
    )
    .subscribe()
}

// ========== 图片压缩 ==========

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size < 500 * 1024) { resolve(file); return }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      const maxDim = 1200
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height / width) * maxDim; width = maxDim }
        else { width = (width / height) * maxDim; height = maxDim }
      }
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      let quality = 0.8
      const go = () => canvas.toBlob(blob => {
        if (!blob) { reject(new Error('压缩失败')); return }
        if (blob.size < 500 * 1024 || quality < 0.2) resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        else { quality -= 0.1; go() }
      }, 'image/jpeg', quality)
      go()
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
