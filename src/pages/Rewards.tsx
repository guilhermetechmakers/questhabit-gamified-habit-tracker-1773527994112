import { useAuth } from '@/contexts/auth-context'
import { useGamificationProfile } from '@/hooks/use-gamification'
import { useRedeemReward } from '@/hooks/use-gamification'
import { useQuery } from '@tanstack/react-query'
import { rewardsApi } from '@/api/rewards'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Gift, Coins, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Rewards() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: profile, isLoading: profileLoading } = useGamificationProfile(userId)
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards', 'list'],
    queryFn: () => rewardsApi.list(),
  })
  const { data: redeemed = [] } = useQuery({
    queryKey: ['user_rewards', userId],
    queryFn: () => rewardsApi.getRedeemedByUser(userId),
    enabled: !!userId,
  })
  const redeemReward = useRedeemReward(userId)

  const redeemedIds = new Set((redeemed ?? []).map((r) => r.reward_id))
  const points = profile?.rewards_points ?? 0

  if (!userId) return null

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-2">Rewards</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Spend your points on badges and boosts.
      </p>

      <Card className="mb-6 bg-dark-card text-card-foreground border-0">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Coins className="h-7 w-7" />
          </div>
          <div>
            {profileLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-primary">{points}</p>
            )}
            <p className="text-sm text-muted-foreground">Points available</p>
          </div>
        </CardContent>
      </Card>

      {Array.isArray(profile?.badges) && profile.badges.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Your badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(profile?.badges ?? []).map((b) => (
              <Card key={b.badge_id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    {b.icon_url ? (
                      <img src={b.icon_url} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <Award className="h-6 w-6 text-secondary" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate w-full text-center">{b.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Store
        </h2>
        {rewardsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !Array.isArray(rewards) || rewards.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No rewards in the store yet. Complete habits to earn points!</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {(rewards ?? []).map((reward) => {
              const owned = redeemedIds.has(reward.id)
              const canAfford = points >= reward.points_cost
              return (
                <li key={reward.id}>
                  <Card
                    className={cn(
                      'overflow-hidden transition-all duration-200 hover:shadow-card-hover',
                      owned && 'opacity-80'
                    )}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {reward.icon_url ? (
                          <img src={reward.icon_url} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <Gift className="h-7 w-7 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{reward.name}</p>
                        {reward.description && (
                          <p className="text-sm text-muted-foreground truncate">{reward.description}</p>
                        )}
                        <p className="text-sm text-primary font-semibold">{reward.points_cost} pts</p>
                      </div>
                      <Button
                        variant="gradient"
                        size="sm"
                        className="rounded-xl shrink-0"
                        disabled={owned || !canAfford || redeemReward.isPending}
                        onClick={() => redeemReward.mutate(reward.id)}
                      >
                        {owned ? 'Owned' : canAfford ? 'Redeem' : 'Need more pts'}
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </AnimatedPage>
  )
}
