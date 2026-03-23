import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

export function getUploadPath(subdir: string, filename: string): string {
  return path.join(UPLOAD_DIR, subdir, filename)
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export function getSubdir(projectId?: string, customerId?: string): string {
  if (projectId) return `projects/${projectId}`
  if (customerId) return `customers/${customerId}`
  return 'misc'
}
