const FollowToggle = ({ isFollowing, onToggle }) => {
  return (
    <div className="pointer-events-auto absolute right-3 top-4 z-[1200] flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? 'Disable follow me' : 'Enable follow me'}
        className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
          isFollowing
            ? 'border-neonBlue bg-neonBlue text-[#0b1423] shadow-glow'
            : 'border-neonBlue/60 bg-[#0b1423]/70 text-neonBlue hover:border-neonBlue'
        }`}
      >
        {isFollowing ? (
          <svg width="25" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.25" />
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M12 8v8M8 12h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <span
        className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.25em] ${
          isFollowing
            ? 'border-neonBlue/40 bg-neonBlue/10 text-neonBlue'
            : 'border-white/10 bg-white/5 text-white/70'
        }`}
      >
      </span>
    </div>
  )
}

export default FollowToggle
