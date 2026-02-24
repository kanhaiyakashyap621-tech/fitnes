const AppContainer = ({ children }) => (
  <div className="min-h-screen min-h-[100dvh] bg-[#050b14] text-white">
    <div className="relative mx-auto min-h-screen min-h-[100dvh] w-full max-w-[430px] overflow-hidden bg-night">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] flex-col">{children}</div>
    </div>
  </div>
)

export default AppContainer
