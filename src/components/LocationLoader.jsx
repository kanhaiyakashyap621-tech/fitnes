const LocationLoader = ({ message = 'Locating GPS...' }) => (
  <div className="absolute inset-0 z-30 grid place-items-center bg-[#0b1423]/70">
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neonBlue/30 border-t-neonBlue" />
      {message}
    </div>
  </div>
)

export default LocationLoader
