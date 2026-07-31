interface Props {
  value: number | null
  onChange: (value: number | null) => void
}

/** Score picker for the 0–10 rating scale, plus a "No score" option for comment-only entries. */
export default function ScoreInput({ value, onChange }: Props) {
  const scores = Array.from({ length: 11 }, (_, i) => i)
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`h-9 px-3 rounded-full text-xs font-bold border-2 transition-all ${
          value === null
            ? 'bg-fuchsia-500 text-white border-stone-900 shadow-pop-sm -translate-y-0.5'
            : 'bg-white text-stone-500 border-stone-300 hover:border-fuchsia-400 hover:text-fuchsia-600'
        }`}
      >
        No score
      </button>
      {scores.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition-all ${
            s === value
              ? 'bg-fuchsia-500 text-white border-stone-900 shadow-pop-sm -translate-y-0.5'
              : 'bg-white text-stone-500 border-stone-300 hover:border-fuchsia-400 hover:text-fuchsia-600'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
