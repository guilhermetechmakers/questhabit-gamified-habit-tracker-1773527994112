import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { assetsApi, type AssetType } from '@/api/assets'
import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AssetUploaderProps {
  assetType: AssetType
  onUploadComplete: (url: string, path: string) => void
  accept?: string
  className?: string
}

export function AssetUploader({
  assetType,
  onUploadComplete,
  accept = 'image/*',
  className,
}: AssetUploaderProps) {
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setProgress(0)
    setIsUploading(true)
    try {
      const { signedUrl, path } = await assetsApi.getUploadUrl(
        assetType,
        file.name,
        file.type || 'application/octet-stream'
      )
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
      })
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))))
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
      })
      setProgress(100)
      onUploadComplete(signedUrl.split('?')[0] ?? signedUrl, path)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
        aria-label="Upload file"
      />
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        <ImagePlus className="h-4 w-4 mr-2" />
        {isUploading ? 'Uploading…' : 'Upload image'}
      </Button>
      {isUploading && <Progress value={progress} className="h-2 rounded-full" />}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
