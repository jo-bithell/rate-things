interface Props {
  value: number
  onChange: (value: number) => void
}

/** Score picker for the 0–10 rating scale. Buttons rather than a slider — easier to hit precisely on mobile. */
export default function ScoreInput({ value, onChange }: Props) {
  const scores = Array.from({ length: 11 }, (_, i) => i)
  return (
    <div className="flex flex-wrap gap-1">
      {scores.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`w-9 h-9 rounded-md text-sm font-semibold border ${
            s === value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
