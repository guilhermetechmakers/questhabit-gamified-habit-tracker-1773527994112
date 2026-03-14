import { cn } from '@/lib/utils'

export type InvoiceStatus = 'paid' | 'open' | 'draft' | 'uncollectible' | 'void' | string

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-success/20 text-success border-success/30' },
  open: { label: 'Due', className: 'bg-primary/20 text-primary border-primary/30' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  uncollectible: { label: 'Past due', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  void: { label: 'Void', className: 'bg-muted text-muted-foreground border-border' },
}

export function InvoiceBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
      aria-label={`Invoice status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
