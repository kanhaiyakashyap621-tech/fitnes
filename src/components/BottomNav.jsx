import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/run', label: 'Run' },
  { to: '/map', label: 'Map' },
  { to: '/leaderboard', label: 'Leaders' },
  { to: '/profile', label: 'Profile' },
]

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0b1423]/90 backdrop-blur">
    <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-xs uppercase tracking-widest">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex-1 text-center transition ${
              isActive ? 'text-neonGreen' : 'text-white/60 hover:text-neonBlue'
            }`
          }
          end={link.to === '/'}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  </nav>
)

export default BottomNav
