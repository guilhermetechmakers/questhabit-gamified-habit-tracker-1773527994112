import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExportButtonProps {
  onExport: (format: 'csv' | 'json') => Promise<string | void>
  disabled?: boolean
  className?: string
}

export function ExportButton({
  onExport,
  disabled,
  className,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const handleClick = async (format: 'csv' | 'json') => {
    if (loading || disabled) return
    setLoading(true)
    try {
      const url = await onExport(format)
      if (url) window.open(url, '_blank')
    } catch {
      // error handled by caller
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled={disabled || loading}
        onClick={() => handleClick('csv')}
        aria-busy={loading}
        aria-label="Export as CSV"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="h-4 w-4" aria-hidden />
        )}
        <span className="ml-2">CSV</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled={disabled || loading}
        onClick={() => handleClick('json')}
        aria-busy={loading}
        aria-label="Export as JSON"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="h-4 w-4" aria-hidden />
        )}
        <span className="ml-2">JSON</span>
      </Button>
    </div>
  )
}
