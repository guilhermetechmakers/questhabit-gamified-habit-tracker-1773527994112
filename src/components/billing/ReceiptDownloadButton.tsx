import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useInvoiceDownloadUrl } from '@/hooks/use-payments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ReceiptDownloadButton({
  invoiceId,
  disabled,
  variant = 'outline',
  size = 'sm',
  className,
}: {
  invoiceId: string
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-lg'
  className?: string
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const downloadMutation = useInvoiceDownloadUrl()

  const handleDownload = async () => {
    if (!invoiceId || isDownloading) return
    setIsDownloading(true)
    try {
      const url = await downloadMutation.mutateAsync(invoiceId)
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        toast.success('Receipt opened')
      } else {
        toast.error('Download not available')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get receipt')
    } finally {
      setIsDownloading(false)
    }
  }

  const loading = isDownloading || downloadMutation.isPending
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={handleDownload}
      className={cn('transition-transform hover:scale-[1.02] active:scale-[0.98]', className)}
      aria-label="Download receipt"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      <span className="sr-only">{loading ? 'Downloading…' : 'Download receipt'}</span>
    </Button>
  )
}
