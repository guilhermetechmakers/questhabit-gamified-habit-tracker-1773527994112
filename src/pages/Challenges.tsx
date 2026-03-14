import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Target, Plus, Users, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface Challenge {
  id: string
  creator_id: string
  name: string
  rules_json: Record<string, unknown>
  starts_at: string
  ends_at: string
  privacy: string
  created_at?: string
}

export default function Challenges() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges', userId],
    queryFn: async (): Promise<Challenge[]> => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .gte('ends_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
      if (error) throw new Error(error.message)
      return (data ?? []) as Challenge[]
    },
    enabled: !!userId,
  })

  const list = Array.isArray(challenges) ? challenges : []

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-2">Challenges</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Join or create time-limited challenges to boost your habits.
      </p>

      <Card className="mb-6 bg-dark-card text-card-foreground border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Create a challenge</p>
              <p className="text-sm text-muted-foreground">Set a goal and invite others.</p>
            </div>
            <Button variant="gradient" size="sm" className="rounded-xl ml-auto shrink-0" disabled>
              <Plus className="h-4 w-4 mr-1" />
              Coming soon
            </Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Active challenges
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground mb-1">No active challenges</p>
              <p className="text-sm">Create one or wait for an invite. Challenges appear here when they start.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {list.map((c) => (
              <li key={c.id}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between gap-2">
                      <span className="truncate">{c.name}</span>
                      <span className={cn(
                        'text-xs font-normal px-2 py-0.5 rounded-full shrink-0',
                        c.privacy === 'public' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {c.privacy}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(c.starts_at), 'MMM d')} – {format(parseISO(c.ends_at), 'MMM d, yyyy')}
                    </span>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AnimatedPage>
  )
}
