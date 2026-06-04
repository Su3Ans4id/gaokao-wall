export default function AddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fab-pulse fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40
                 w-14 h-14 md:w-16 md:h-16
                 bg-gaokao-red hover:bg-red-700
                 text-white rounded-full
                 flex items-center justify-center
                 shadow-lg shadow-gaokao-red/40
                 active:scale-95 transition-transform"
      aria-label="我要加油"
    >
      <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
    </button>
  )
}
