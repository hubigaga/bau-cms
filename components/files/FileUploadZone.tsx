'use client'
import { useRef, useState, useEffect } from 'react'

interface UploadedFile {
  id: string
  filename: string
  mimetype: string
  size: number
  uploadedAt: string
}

interface Props {
  projectId?: string
  customerId?: string
  onUpload?: () => void
}

export function FileUploadZone({ projectId, customerId, onUpload }: Props) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFiles = () => {
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (customerId) params.set('customerId', customerId)
    fetch(`/api/files?${params}`).then(r => r.json()).then(setFiles)
  }

  useEffect(() => { loadFiles() }, [projectId, customerId])

  async function uploadFile(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    if (projectId) fd.append('projectId', projectId)
    if (customerId) fd.append('customerId', customerId)
    await fetch('/api/files', { method: 'POST', body: fd })
    setUploading(false)
    loadFiles()
    onUpload?.()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }

  async function deleteFile(id: string) {
    await fetch(`/api/files/${id}`, { method: 'DELETE' })
    loadFiles()
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[#6b8fa3] bg-[#6b8fa3]/10' : 'border-[#2e3640] hover:border-[#6b8fa3]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={e => Array.from(e.target.files ?? []).forEach(uploadFile)}
        />
        <p className="text-[#7a8694] text-sm">
          {uploading ? 'Wird hochgeladen...' : 'Dateien hier ablegen oder klicken'}
        </p>
        <p className="text-[#7a8694] text-xs mt-1">PDF, Bilder, Word, Excel — max. 50MB</p>
      </div>
      <div className="space-y-1">
        {files.map(f => (
          <div key={f.id} className="flex items-center justify-between p-2 bg-[#1a1e24] border border-[#2e3640]">
            <div>
              <a
                href={`/api/files/${f.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#6b8fa3] hover:underline"
              >
                {f.filename}
              </a>
              <span className="text-xs text-[#7a8694] ml-2">{formatSize(f.size)}</span>
            </div>
            <button
              onClick={() => deleteFile(f.id)}
              className="text-[#8b3a3a] text-xs hover:text-[#d4d8dd]"
            >
              Löschen
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
