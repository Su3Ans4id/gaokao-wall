import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import CardWall from './components/CardWall'
import AddButton from './components/AddButton'
import WishForm from './components/WishForm'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import { fetchWishes, createWish, subscribeToWishes, verifyAdminPassword } from './lib/supabase'

function App() {
  const [wishes, setWishes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adminMode, setAdminMode] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminAuthed, setAdminAuthed] = useState(
    () => sessionStorage.getItem('_admin') === '1'
  )

  useEffect(() => { loadWishes() }, [])

  useEffect(() => {
    const sub = subscribeToWishes((newWish) => {
      setWishes((prev) => [newWish, ...prev])
    })
    return () => { sub.unsubscribe() }
  }, [])

  const loadWishes = async () => {
    try { setError(null); const data = await fetchWishes(); setWishes(data || []) }
    catch (err) { console.error(err); setError('加载失败') }
    finally { setLoading(false) }
  }

  const fireConfetti = () => {
    const dur = 3000; const end = Date.now() + dur
    const colors = ['#E63946', '#F1C40F', '#FF6B6B', '#FFD93D', '#FFFFFF']
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors })
      confetti({ particleCount: 3, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  const handleSubmit = useCallback(async (formData) => {
    await createWish(formData)
    setShowForm(false)
    fireConfetti()
    setTimeout(() => { alert('祝金榜题名！') }, 300)
  }, [])

  const handleAdminLogin = async (password) => {
    const ok = await verifyAdminPassword(password)
    if (!ok) throw new Error('密码错误')
    sessionStorage.setItem('_admin', '1')
    setShowAdminLogin(false)
    setAdminAuthed(true)
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('_admin')
    setAdminAuthed(false)
    setAdminMode(false)
  }

  if (adminAuthed && adminMode) {
    return <AdminDashboard onLogout={handleAdminLogout} />
  }

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden bg-gradient-to-br from-gaokao-red via-red-600 to-red-700 text-white">
        <div className="absolute inset-0 opacity-[0.06] select-none pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-size='80' fill='white' font-weight='bold'%3E%E9%AB%98%E8%80%83%3C/text%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
        <div className="relative px-4 py-10 md:py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-wide inline-flex items-center gap-2">
            <span className="text-gaokao-gold">&#x2728;</span>
            高考加油
            <span className="text-gaokao-gold">&#x2728;</span>
          </h1>
          <p className="text-red-100 text-sm md:text-lg max-w-md mx-auto mt-3 leading-relaxed">
            每一份祝福，都是前行的力量<br/>
            <span className="text-gaokao-gold font-semibold">愿你笔锋所至，梦想花开</span>
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" className="w-full h-8 md:h-12 fill-gaokao-cream">
            <path d="M0 48h1440V0c-133.2 31.8-266.8 47.7-400 48C906.6 48.3 773 32.4 640 16 506.6-.4 373.2-16 240 16 173.4 32.3 106.6 31.8 40 16 26.6 13.2 13.4 7.8 0 0v48z"/>
          </svg>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 text-sm">
          <span className="text-gaokao-red font-bold text-lg">{wishes.length}</span>
          <span className="text-gray-500">条祝福</span>
          <div className="w-px h-4 bg-gray-200" />
          <span className="text-gray-400 text-xs">来自全国各地的加油声</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 md:px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-gaokao-red/20 border-t-gaokao-red rounded-full animate-spin" />
            <p className="mt-4 text-gray-400 text-sm">加载祝福中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-gray-400 mb-4">{error}</p>
            <button onClick={loadWishes} className="px-6 py-2 bg-gaokao-red text-white rounded-full text-sm hover:bg-red-700">重新加载</button>
          </div>
        ) : (
          <CardWall wishes={wishes} />
        )}
      </main>

      <AddButton onClick={() => setShowForm(true)} />
      {showForm && <WishForm onSubmit={handleSubmit} onClose={() => setShowForm(false)} />}

      {/* 管理员入口 */}
      {adminMode && !adminAuthed && (
        <button
          onClick={() => setShowAdminLogin(true)}
          className="fixed bottom-24 right-6 md:right-10 z-40 px-4 py-2 bg-gray-900 text-white text-sm rounded-full shadow-lg hover:bg-black"
        >
          管理员登录
        </button>
      )}
      {adminMode && (
        <button
          onClick={() => setAdminMode(false)}
          className="fixed top-4 right-4 z-40 px-3 py-1.5 bg-white/90 text-gray-500 text-xs rounded-full shadow hover:bg-white"
        >
          返回
        </button>
      )}
      {showAdminLogin && (
        <AdminLogin onLogin={handleAdminLogin} onClose={() => { setShowAdminLogin(false); setAdminMode(false) }} />
      )}

      {/* Footer — 连点5次进入管理员模式 */}
      <footer className="text-center py-8 text-xs text-gray-400">
        <p
          className="cursor-default select-none inline-block"
          onClick={() => {
            const now = Date.now()
            const taps = JSON.parse(sessionStorage.getItem('_admin_taps') || '[]')
              .filter(t => now - t < 5000)
            taps.push(now)
            sessionStorage.setItem('_admin_taps', JSON.stringify(taps))
            if (taps.length >= 5) {
              sessionStorage.removeItem('_admin_taps')
              setAdminMode(true)
            }
          }}
        >
          为所有高考学子加油打气
        </p>
        <p className="mt-1">金榜题名，前程似锦</p>
      </footer>
    </div>
  )
}

export default App
