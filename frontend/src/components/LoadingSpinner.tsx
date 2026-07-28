export default function LoadingSpinner({ label = 'Loading…', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-stone-500 ${fullScreen ? 'min-h-screen' : 'py-16'}`}>
      <span className="text-4xl inline-block animate-spin">⭐</span>
      <p className="font-display font-bold text-fuchsia-600 animate-pulse">{label}</p>
    </div>
  )
}
