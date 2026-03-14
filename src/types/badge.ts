export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic'

export interface Badge {
  id: string
  name: string
  criteria_json: Record<string, unknown>
  icon_url: string | null
  rarity: BadgeRarity
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
}
