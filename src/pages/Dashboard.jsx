import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/GlassCard'
import { formatArea, formatMeters } from '../utils/geo'

const Dashboard = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Runner Control</p>
        <h1 className="text-3xl font-semibold text-white">
          Welcome back{profile?.username ? `, ${profile.username}` : ''}.
        </h1>
        <p className="text-sm text-white/70">
          Every loop you close becomes a glowing territory. Run smart and claim more.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total Distance</p>
          <p className="mt-3 text-2xl font-semibold text-neonGreen">
            {formatMeters(profile?.totalDistance || 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total Area</p>
          <p className="mt-3 text-2xl font-semibold text-neonBlue">
            {formatArea(profile?.totalArea || 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total Captures</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {profile?.totalCaptures || 0}
          </p>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/run')}
          className="rounded-2xl bg-neonBlue px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-glow"
        >
          Start Run
        </button>
        <button
          type="button"
          onClick={() => navigate('/map')}
          className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonBlue"
        >
          View Shared Map
        </button>
      </div>
    </div>
  )
}

export default Dashboard
