export default function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="mb-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-700 px-4 py-2 text-sm font-medium flex items-center gap-2">
      <span>😬</span> {message}
    </div>
  )
}
