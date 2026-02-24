const NeonButton = ({
  children,
  variant = 'blue',
  className = '',
  ...props
}) => {
  const styles = {
    blue: 'bg-neonBlue text-[#0b1423] hover:shadow-glow',
    green: 'bg-neonGreen text-[#0b1423] hover:shadow-green',
    ghost: 'border border-white/10 bg-[#0b1423]/70 text-white hover:border-neonBlue',
  }

  return (
    <button
      type="button"
      className={`rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default NeonButton
