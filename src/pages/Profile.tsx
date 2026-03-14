import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useUserStats } from '@/hooks/use-stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedPage } from '@/components/AnimatedPage'
import { User, LogOut, Star, Settings } from 'lucide-react'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { data: stats } = useUserStats(user?.id)

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

      <Card className="mb-6">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {user?.email ?? 'Not signed in'}
            </p>
            <p className="text-sm text-muted-foreground">
              Level {stats?.level ?? 1} · {stats?.xp_total ?? 0} total XP
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current streak</span>
            <span className="font-medium">{stats?.current_streak ?? 0} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Longest streak</span>
            <span className="font-medium">{stats?.longest_streak ?? 0} days</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Link to="/app/settings" className="block">
          <Button variant="outline" className="w-full justify-start rounded-xl">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </AnimatedPage>
  )
}
