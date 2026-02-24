const StatCard = ({ label, value, accent = 'text-white', className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ${className}`}>
    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">{label}</p>
    <p className={`mt-2 text-lg font-semibold ${accent}`}>{value}</p>
  </div>
)

export default StatCard
