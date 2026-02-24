const FloatingActionButton = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={`flex h-11 w-11 items-center justify-center rounded-full border border-neonBlue/40 bg-[#0b1423]/70 text-neonBlue transition hover:border-neonBlue hover:shadow-glow ${className}`}
    {...props}
  >
    {children}
  </button>
)

export default FloatingActionButton
