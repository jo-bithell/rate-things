import { ChangeEvent, useRef, useState } from 'react'
import { ApiError } from '../api/client'

interface Props {
  imageUrl?: string
  alt: string
  placeholder?: string
  shape?: 'circle' | 'square'
  onUpload: (file: File) => Promise<void>
  onRemove: () => Promise<void>
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024

export default function ImageUploader({ imageUrl, alt, placeholder, shape = 'square', onUpload, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || busy) return

    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be 5 MB or smaller.')
      return
    }

    setBusy(true)
    try {
      await onUpload(file)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload image.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      await onRemove()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-20 h-20 shrink-0 border-2 border-stone-900 ${shapeClass} bg-amber-100 flex items-center justify-center overflow-hidden text-3xl`}
      >
        {imageUrl ? <img src={imageUrl} alt={alt} className="w-full h-full object-cover" /> : placeholder ?? null}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-link disabled:opacity-50">
            {busy ? 'Uploading…' : imageUrl ? 'Change image' : 'Upload image'}
          </button>
          {imageUrl && (
            <button type="button" onClick={handleRemove} disabled={busy} className="btn-danger-link disabled:opacity-50">
              Remove
            </button>
          )}
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  )
}
