const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card rounded-2xl p-5 shadow-glow ${className}`}>{children}</div>
)

export default GlassCard
