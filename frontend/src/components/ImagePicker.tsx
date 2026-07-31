import { ChangeEvent, useEffect, useRef, useState } from 'react'

interface Props {
  file: File | null
  onChange: (file: File | null) => void
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024

/** Stages an image file locally for a create form to submit alongside the rest of the fields. */
export default function ImagePicker({ file, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return

    setError(null)
    if (!picked.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (picked.size > MAX_SIZE_BYTES) {
      setError('Image must be 5 MB or smaller.')
      return
    }
    onChange(picked)
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {previewUrl && (
          <img src={previewUrl} alt="" className="w-12 h-12 rounded-xl border-2 border-stone-900 object-cover shrink-0" />
        )}
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-link">
          {file ? 'Change image' : 'Add image (optional)'}
        </button>
        {file && (
          <button type="button" onClick={() => onChange(null)} className="btn-danger-link">
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  )
}
