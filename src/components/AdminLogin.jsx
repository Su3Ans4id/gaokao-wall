import { useState } from 'react'

export default function AdminLogin({ onLogin, onClose }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) { setError('请输入密码'); return }
    setLoading(true)
    setError('')
    try {
      await onLogin(password)
    } catch (err) {
      setError(err.message || '密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="modal-content bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900 text-white rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">管理员登录</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">管理员密码</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20"
              autoFocus
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors disabled:bg-gray-400"
          >
            {loading ? '验证中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
