const getInitials = (name = 'Runner') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R'

const Avatar = ({ src, name = 'Runner', size = 48, className = '' }) => {
  const initials = getInitials(name)

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full border border-neonBlue/40 bg-[#0b1423] text-sm font-semibold text-neonBlue shadow-glow ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export default Avatar
