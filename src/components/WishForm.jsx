import { useState, useRef } from 'react'

export default function WishForm({ onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    setImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedMsg = message.trim()

    if (!trimmedName) { alert('请输入你的名字'); return }
    if (trimmedName.length > 10) { alert('姓名最多10个字符'); return }
    if (!trimmedMsg) { alert('请输入祝福语'); return }
    if (trimmedMsg.length > 100) { alert('祝福语最多100个字符'); return }

    setSubmitting(true)
    try {
      await onSubmit({ user_name: trimmedName, message: trimmedMsg, image_file: image })
      setName('')
      setMessage('')
      setImage(null)
      setPreview(null)
    } catch (err) {
      alert('发布失败：' + (err.message || '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="modal-content bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gaokao-red text-white rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">我也要加油</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 姓名 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">你的名字</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
              placeholder="请输入你的名字"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:border-gaokao-red focus:ring-2 focus:ring-gaokao-red/20
                         transition-all placeholder:text-gray-300"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{name.length}/10</p>
          </div>

          {/* 照片 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">鼓励照片（可选）</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} alt="预览" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setPreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl
                           flex flex-col items-center justify-center gap-2 text-gray-400
                           hover:border-gaokao-red hover:text-gaokao-red transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                </svg>
                <span className="text-sm">点击上传照片</span>
                <span className="text-[10px]">支持 jpg、png，自动压缩</span>
              </button>
            )}
          </div>

          {/* 祝福语 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">祝福寄语</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={100}
              rows={3}
              placeholder="写下你对高考学子的祝福..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none
                         focus:outline-none focus:border-gaokao-red focus:ring-2 focus:ring-gaokao-red/20
                         transition-all placeholder:text-gray-300"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{message.length}/100</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gaokao-red hover:bg-red-700 disabled:bg-gray-300
                       text-white font-bold rounded-xl transition-colors
                       flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                发布中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
                </svg>
                送出祝福
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
