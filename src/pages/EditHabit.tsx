import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useHabit, useUpdateHabit } from '@/hooks/use-habits'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScheduleEditor } from '@/components/habits/ScheduleEditor'
import { HabitIcon, HABIT_ICON_NAMES } from '@/components/habits/habit-icon'
import { AnimatedPage } from '@/components/AnimatedPage'
import { ArrowLeft } from 'lucide-react'
import type { ScheduleJson } from '@/types/habit'

const schema = z.object({
  title: z.string().min(1, 'Name your habit'),
  description: z.string().optional(),
  goal: z.string().optional(),
  icon: z.string().default('target'),
  xp_value: z.number().min(5).max(50),
  privacy_flag: z.enum(['private', 'friends', 'public']),
  timezone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const XP_OPTIONS = [5, 10, 15, 20, 50]

export default function EditHabit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: habit, isLoading } = useHabit(id)
  const updateHabit = useUpdateHabit(userId)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      goal: '',
      icon: 'target',
      xp_value: 10,
      privacy_flag: 'private',
      timezone: 'UTC',
    },
  })

  const [schedule, setSchedule] = useState<ScheduleJson>({ frequency: 'daily' })

  useEffect(() => {
    if (!habit) return
    setValue('title', habit.title)
    setValue('description', habit.description ?? '')
    setValue('goal', habit.goal ?? '')
    setValue('icon', habit.icon ?? 'target')
    setValue('xp_value', habit.xp_value ?? 10)
    setValue('privacy_flag', habit.privacy_flag)
    setValue('timezone', habit.timezone ?? 'UTC')
    if (habit.schedule_json) setSchedule(habit.schedule_json)
  }, [habit, setValue])

  const onSubmit = async (data: FormValues) => {
    if (!id) return
    await updateHabit.mutateAsync({
      id,
      updates: {
        title: data.title,
        description: data.description || undefined,
        goal: data.goal || undefined,
        icon: data.icon,
        xp_value: data.xp_value,
        privacy_flag: data.privacy_flag,
        timezone: data.timezone || undefined,
        schedule_json: schedule,
      },
    })
    navigate(`/app/habits/${id}`)
  }

  const xpValue = watch('xp_value')

  if (!id) return null

  if (isLoading || !habit) {
    return (
      <AnimatedPage>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="flex items-center gap-2 mb-6">
        <Link to={`/app/habits/${id}`}>
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Edit habit</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Name & icon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Habit name</Label>
              <Input
                id="title"
                placeholder="e.g. Morning run"
                className="mt-1 rounded-xl"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="goal">Short goal (optional)</Label>
              <Input
                id="goal"
                placeholder="e.g. Run 2km every morning"
                className="mt-1 rounded-xl"
                {...register('goal')}
              />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {HABIT_ICON_NAMES.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setValue('icon', iconName)}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${
                      watch('icon') === iconName
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                    aria-label={`Select ${iconName}`}
                  >
                    <HabitIcon name={iconName} size={24} />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleEditor
              value={schedule}
              onChange={setSchedule}
              timezone={watch('timezone') ?? 'UTC'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rewards & privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>XP per completion</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {XP_OPTIONS.map((xp) => (
                  <Button
                    key={xp}
                    type="button"
                    variant={xpValue === xp ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setValue('xp_value', xp)}
                  >
                    {xp}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Visibility</Label>
              <Tabs
                value={watch('privacy_flag')}
                onValueChange={(v) => setValue('privacy_flag', v as FormValues['privacy_flag'])}
              >
                <TabsList className="grid w-full grid-cols-3 mt-2 rounded-xl">
                  <TabsTrigger value="private" className="rounded-lg">Private</TabsTrigger>
                  <TabsTrigger value="friends" className="rounded-lg">Friends</TabsTrigger>
                  <TabsTrigger value="public" className="rounded-lg">Public</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Impact preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Each completion will award <strong className="text-foreground">+{xpValue} XP</strong>.
              Schedule: {schedule.frequency}.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" variant="gradient" className="flex-1 rounded-xl" disabled={updateHabit.isPending || !isDirty}>
            {updateHabit.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Link to={`/app/habits/${id}`}>
            <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
          </Link>
        </div>
      </form>
    </AnimatedPage>
  )
}
