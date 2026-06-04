import Masonry from 'react-masonry-css'

const breakpointCols = {
  default: 4,
  1280: 3,
  768: 2,
  480: 1,
}

export default function CardWall({ wishes }) {
  if (!wishes || wishes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <svg className="w-24 h-24 mb-6 text-gaokao-gold/30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
        </svg>
        <p className="text-lg">还没有人送上祝福，快来抢沙发吧！</p>
      </div>
    )
  }

  return (
    <Masonry
      breakpointCols={breakpointCols}
      className="masonry-grid"
      columnClassName="masonry-grid-column"
    >
      {wishes.map((wish) => (
        <WishCard key={wish.id} wish={wish} />
      ))}
    </Masonry>
  )
}

function WishCard({ wish }) {
  return (
    <div className="wish-card bg-white rounded-2xl overflow-hidden mb-4 shadow-md break-inside-avoid">
      {wish.image_url && (
        <div className="overflow-hidden">
          <img
            src={wish.image_url}
            alt={`${wish.user_name} 的照片`}
            className="w-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {wish.message}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gaokao-red/10 flex items-center justify-center text-gaokao-red text-xs font-bold">
              {wish.user_name?.charAt(0) || '?'}
            </div>
            <span className="text-xs text-gray-500 font-medium">{wish.user_name}</span>
          </div>
          <time className="text-[10px] text-gray-400">
            {formatTime(wish.created_at)}
          </time>
        </div>
      </div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
