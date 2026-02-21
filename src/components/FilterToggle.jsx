const FILTERS = [
  { id: '24h', label: 'Last 24 Hours' },
  { id: '7d', label: 'Last 7 Days' },
  { id: 'all', label: 'All Time' },
]

const FilterToggle = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0b1423]/70 p-2">
    {FILTERS.map((filter) => {
      const active = value === filter.id
      return (
        <button
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            active
              ? 'bg-neonBlue text-[#0b1423] shadow-glow'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {filter.label}
        </button>
      )
    })}
  </div>
)

export default FilterToggle
