import { Link } from 'react-router-dom'

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-night px-4 text-center">
    <p className="text-xs uppercase tracking-[0.35em] text-neonBlue">Athletes Arena</p>
    <h1 className="mt-3 text-3xl font-semibold text-white">Page not found</h1>
    <p className="mt-2 text-sm text-white/70">
      The route you reached does not exist. Return to the dashboard to keep running.
    </p>
    <Link
      to="/"
      className="mt-6 rounded-2xl bg-neonBlue px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-glow"
    >
      Back to Dashboard
    </Link>
  </div>
)

export default NotFound
