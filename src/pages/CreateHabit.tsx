import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useCreateHabit } from '@/hooks/use-habits'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedPage } from '@/components/AnimatedPage'
import { ScheduleEditor } from '@/components/habits'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { HabitIcon } from '@/components/habits/habit-icon'
import type { ScheduleJson } from '@/types/habit'

const step1Schema = z.object({
  title: z.string().min(1, 'Name your habit'),
  goal: z.string().optional(),
  icon: z.string().default('target'),
})

const step2Schema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  days: z.array(z.number()).optional(),
})

const step3Schema = z.object({
  xp_value: z.number().min(5).max(50).default(10),
  privacy_flag: z.enum(['private', 'friends', 'public']).default('private'),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>

const ICONS = ['target', 'dumbbell', 'book', 'droplets', 'moon', 'sun', 'coffee', 'heart']

export default function CreateHabit() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id
  const createHabit = useCreateHabit()
  const [step, setStep] = useState(1)
  const [form1, setForm1] = useState<Step1>({ title: '', goal: '', icon: 'target' })
  const [form2, setForm2] = useState<Step2>({ frequency: 'daily', days: [] })
  const [form3, setForm3] = useState<Step3>({ xp_value: 10, privacy_flag: 'private' })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: form1,
  })

  const onStep1 = (data: Step1) => {
    setForm1(data)
    setStep(2)
  }

  const onStep2 = () => {
    setStep(3)
  }

  const onStep3 = async () => {
    if (!userId) return
    const schedule_json: ScheduleJson = {
      frequency: form2.frequency,
      days: form2.days?.length ? form2.days : undefined,
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
    await createHabit.mutateAsync({
      user_id: userId,
      title: form1.title,
      goal: form1.goal || undefined,
      icon: form1.icon,
      schedule_json,
      xp_value: form3.xp_value,
      privacy_flag: form3.privacy_flag,
      timezone,
    })
    navigate('/app/dashboard')
  }

  return (
    <AnimatedPage>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/app/habits">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">New habit</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Name & icon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
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
                  placeholder="e.g. Run 5k"
                  className="mt-1 rounded-xl"
                  {...register('goal')}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setValue('icon', icon)}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${
                        form1.icon === icon
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <HabitIcon name={icon} size={24} />
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" variant="gradient" className="w-full rounded-xl">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frequency & schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleEditor
              value={{
                frequency: form2.frequency,
                days: form2.days,
              }}
              onChange={(s) =>
                setForm2({
                  frequency: s.frequency as Step2['frequency'],
                  days: s.days ?? [],
                })
              }
            />
            <Button
              onClick={onStep2}
              variant="gradient"
              className="w-full mt-6 rounded-xl"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rewards & privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>XP per completion</Label>
              <div className="flex gap-2 mt-2">
                {[5, 10, 15, 20, 50].map((xp) => (
                  <Button
                    key={xp}
                    type="button"
                    variant={form3.xp_value === xp ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setForm3({ ...form3, xp_value: xp })}
                  >
                    {xp}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Visibility</Label>
              <Tabs
                value={form3.privacy_flag}
                onValueChange={(v) =>
                  setForm3({ ...form3, privacy_flag: v as Step3['privacy_flag'] })
                }
              >
                <TabsList className="grid w-full grid-cols-3 mt-2 rounded-xl">
                  <TabsTrigger value="private" className="rounded-lg">Private</TabsTrigger>
                  <TabsTrigger value="friends" className="rounded-lg">Friends</TabsTrigger>
                  <TabsTrigger value="public" className="rounded-lg">Public</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">{form1.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                +{form3.xp_value} XP · {form2.frequency} · {form3.privacy_flag}
              </p>
            </div>
            <Button
              onClick={onStep3}
              variant="gradient"
              className="w-full rounded-xl"
              disabled={createHabit.isPending}
            >
              {createHabit.isPending ? 'Creating…' : 'Create habit'}
            </Button>
          </CardContent>
        </Card>
      )}
    </AnimatedPage>
  )
}
