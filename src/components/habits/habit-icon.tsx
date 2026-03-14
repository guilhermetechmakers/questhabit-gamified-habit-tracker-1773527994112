import {
  Target,
  Dumbbell,
  BookOpen,
  Droplets,
  Moon,
  Sun,
  Coffee,
  Heart,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  target: Target,
  dumbbell: Dumbbell,
  book: BookOpen,
  droplets: Droplets,
  moon: Moon,
  sun: Sun,
  coffee: Coffee,
  heart: Heart,
}

const DEFAULT_ICON = Target

export const HABIT_ICON_NAMES = Object.keys(ICON_MAP)

export function getHabitIcon(name: string | null | undefined): LucideIcon {
  const key = (name ?? 'target').toLowerCase()
  return ICON_MAP[key] ?? DEFAULT_ICON
}

export interface HabitIconProps {
  name?: string | null
  className?: string
  size?: number
}

export function HabitIcon({ name, className, size = 24 }: HabitIconProps) {
  const Icon = getHabitIcon(name)
  return <Icon className={className} size={size} aria-hidden />
}
