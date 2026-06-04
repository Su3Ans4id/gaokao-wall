import { useState, useEffect } from 'react'
import { fetchWishes, updateWish, deleteWish } from '../lib/supabase'

export default function AdminDashboard({ onLogout }) {
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { loadWishes() }, [])

  const loadWishes = async () => {
    try {
      const data = await fetchWishes()
      setWishes(data || [])
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteWish(id)
      setWishes(prev => prev.filter(w => w.id !== id))
      setConfirmDelete(null)
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const handleEdit = (wish) => {
    setEditing({ ...wish })
  }

  const handleSave = async () => {
    if (!editing) return
    try {
      await updateWish(editing.id, {
        user_name: editing.user_name.slice(0, 10),
        message: editing.message.slice(0, 100),
        image_url: editing.image_url,
      })
      setWishes(prev => prev.map(w => w.id === editing.id ? { ...w, ...editing } : w))
      setEditing(null)
    } catch (err) {
      alert('更新失败: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶栏 */}
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h1 className="text-lg font-bold">管理后台</h1>
          <p className="text-gray-400 text-xs">共 {wishes.length} 条祝福</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
        >
          退出登录
        </button>
      </header>

      {/* 列表面板 */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3 w-14">ID</th>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">祝福语</th>
                  <th className="px-4 py-3 w-14">图片</th>
                  <th className="px-4 py-3 w-36">时间</th>
                  <th className="px-4 py-3 w-28">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wishes.map(wish => (
                  <tr key={wish.id} className="hover:bg-gray-50">
                    {editing?.id === wish.id ? (
                      <>
                        <td className="px-4 py-2 text-gray-400 text-xs">{wish.id}</td>
                        <td className="px-4 py-2">
                          <input
                            value={editing.user_name}
                            onChange={e => setEditing({ ...editing, user_name: e.target.value })}
                            maxLength={10}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editing.message}
                            onChange={e => setEditing({ ...editing, message: e.target.value })}
                            maxLength={100}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          {wish.image_url ? <span className="text-green-500">有</span> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">{fmt(wish.created_at)}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button onClick={handleSave} className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">保存</button>
                            <button onClick={() => setEditing(null)} className="px-3 py-1 bg-gray-300 text-xs rounded hover:bg-gray-400">取消</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-gray-400 text-xs">{wish.id}</td>
                        <td className="px-4 py-2 font-medium truncate max-w-[80px]">{wish.user_name}</td>
                        <td className="px-4 py-2 text-gray-600 truncate max-w-[180px]">{wish.message}</td>
                        <td className="px-4 py-2 text-center">
                          {wish.image_url ? <span className="text-green-500">有</span> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">{fmt(wish.created_at)}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => handleEdit(wish)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">编辑</button>
                            <button onClick={() => setConfirmDelete(wish.id)} className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">删除</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {wishes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 确认删除弹窗 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">确认删除</h3>
            <p className="text-gray-500 text-sm mb-4">此操作不可撤销，确定要删除这条祝福吗？</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-gray-200 text-sm rounded-lg hover:bg-gray-300">取消</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
