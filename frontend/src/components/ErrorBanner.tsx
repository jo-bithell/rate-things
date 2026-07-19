export default function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
      {message}
    </div>
  )
}
