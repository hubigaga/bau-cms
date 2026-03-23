'use client'
import { FileUploadZone } from '@/components/files/FileUploadZone'

export default function FilesPage() {
  return (
    <div className="p-6">
      <h1 className="text-[#d4d8dd] text-xl font-semibold mb-6">Dateien</h1>
      <FileUploadZone />
    </div>
  )
}
