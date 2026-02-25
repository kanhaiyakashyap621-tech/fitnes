import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Signup = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(form)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Unable to sign up.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-night bg-aurora px-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.35em] text-neonBlue">Athletes Arena</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Join the chase</h1>
        <p className="mt-2 text-sm text-white/70">
          Create your Athletes Arena identity to start capturing territory.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm text-white/70">
            Username
            <input
              type="text"
              required
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1423]/70 px-4 py-3 text-white outline-none transition focus:border-neonBlue"
            />
          </label>
          <label className="block text-sm text-white/70">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1423]/70 px-4 py-3 text-white outline-none transition focus:border-neonBlue"
            />
          </label>
          <label className="block text-sm text-white/70">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1423]/70 px-4 py-3 text-white outline-none transition focus:border-neonBlue"
            />
          </label>
          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neonGreen px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b1423] transition hover:shadow-green disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/70">
          Already with Athletes Arena?{' '}
          <Link className="text-neonBlue hover:text-neonGreen" to="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
