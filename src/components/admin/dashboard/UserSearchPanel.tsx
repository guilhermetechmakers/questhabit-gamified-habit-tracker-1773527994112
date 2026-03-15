import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Search, User } from 'lucide-react'
import { useAdminUserSearch } from '@/hooks/use-admin'

export interface UserSearchPanelProps {
  className?: string
}

export function UserSearchPanel({ className }: UserSearchPanelProps) {
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const { data, isLoading, isFetching } = useAdminUserSearch(submittedQuery)
  const results = Array.isArray(data?.data) ? data.data : []

  const handleSearch = useCallback(() => {
    const q = inputValue.trim()
    if (q.length >= 2) setSubmittedQuery(q)
  }, [inputValue])

  const handleSelectUser = useCallback(
    (userId: string) => {
      navigate(`/app/admin/users?q=${encodeURIComponent(userId)}`)
    },
    [navigate]
  )

  return (
    <Card
      className={cn('rounded-2xl border border-border bg-card shadow-card overflow-hidden', className)}
      role="search"
      aria-label="User search"
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" /> User search
        </CardTitle>
        <p className="text-sm text-muted-foreground">Look up by email or ID</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Email or user ID..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="rounded-xl flex-1"
            aria-label="Search users"
          />
          <Button variant="gradient" className="rounded-xl shrink-0" onClick={handleSearch}>
            Search
          </Button>
        </div>
        {submittedQuery.length >= 2 && (
          <div className="rounded-xl border border-border bg-muted/30 max-h-64 overflow-y-auto">
            {isLoading || isFetching ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : results.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No users found</p>
            ) : (
              <ul className="divide-y divide-border">
                {(results ?? []).map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => handleSelectUser(u.id)}
                      aria-label={`View user ${u.email}`}
                    >
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.display_name ?? u.id} · {u.role}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
