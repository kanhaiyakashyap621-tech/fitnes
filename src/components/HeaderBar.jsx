const HeaderBar = ({ eyebrow, title, subtitle, rightSlot }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-2">
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">{eyebrow}</p>
      )}
      {title && <h1 className="text-2xl font-semibold text-white">{title}</h1>}
      {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
    </div>
    {rightSlot}
  </div>
)

export default HeaderBar
