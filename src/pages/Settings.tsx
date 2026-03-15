import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Bell, Moon, RefreshCw, Shield } from 'lucide-react'
import { useAdminProfile } from '@/hooks/use-admin'
import type { ThemePreference, SyncFrequency } from '@/types/settings'
import { DEFAULT_USER_SETTINGS } from '@/types/settings'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const SYNC_OPTIONS: { value: SyncFrequency; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual' },
  { value: 'interval', label: 'Interval' },
]

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function isValidQuietHours(start: string, end: string): boolean {
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  if (s === e) return false
  return true
}

export default function Settings() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { canAccessAdmin } = useAdminProfile()
  const { data: settings, isLoading } = useSettings(userId)
  const updateSettings = useUpdateSettings(userId)

  const [pushEnabled, setPushEnabled] = useState(DEFAULT_USER_SETTINGS.pushEnabled)
  const [emailEnabled, setEmailEnabled] = useState(DEFAULT_USER_SETTINGS.emailEnabled)
  const [quietStart, setQuietStart] = useState(DEFAULT_USER_SETTINGS.quietHours.start)
  const [quietEnd, setQuietEnd] = useState(DEFAULT_USER_SETTINGS.quietHours.end)
  const [theme, setTheme] = useState<ThemePreference>(DEFAULT_USER_SETTINGS.theme)
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>(DEFAULT_USER_SETTINGS.syncFrequency)
  const [onboardingCompleted, setOnboardingCompleted] = useState(
    DEFAULT_USER_SETTINGS.onboardingCompleted
  )
  const [timezone, setTimezone] = useState(DEFAULT_USER_SETTINGS.timezone)
  const [quietHoursError, setQuietHoursError] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    setPushEnabled(settings.pushEnabled)
    setEmailEnabled(settings.emailEnabled)
    setQuietStart(settings.quietHours.start)
    setQuietEnd(settings.quietHours.end)
    setTheme(settings.theme)
    setSyncFrequency(settings.syncFrequency)
    setOnboardingCompleted(settings.onboardingCompleted)
    setTimezone(settings.timezone)
  }, [settings])

  const handleSave = () => {
    setQuietHoursError(null)
    if (!isValidQuietHours(quietStart, quietEnd)) {
      setQuietHoursError('Start time must differ from end time')
      return
    }
    updateSettings.mutate(
      {
        pushEnabled,
        emailEnabled,
        quietHours: { start: quietStart, end: quietEnd },
        theme,
        syncFrequency,
        onboardingCompleted,
        timezone,
        preferredChannels: { push: pushEnabled, email: emailEnabled },
      },
      {
        onError: () => setQuietHoursError('Failed to save settings'),
      }
    )
  }

  const handleReset = () => {
    setPushEnabled(DEFAULT_USER_SETTINGS.pushEnabled)
    setEmailEnabled(DEFAULT_USER_SETTINGS.emailEnabled)
    setQuietStart(DEFAULT_USER_SETTINGS.quietHours.start)
    setQuietEnd(DEFAULT_USER_SETTINGS.quietHours.end)
    setTheme(DEFAULT_USER_SETTINGS.theme)
    setSyncFrequency(DEFAULT_USER_SETTINGS.syncFrequency)
    setOnboardingCompleted(DEFAULT_USER_SETTINGS.onboardingCompleted)
    setTimezone(DEFAULT_USER_SETTINGS.timezone)
    setQuietHoursError(null)
  }

  if (isLoading || !settings) {
    return (
      <AnimatedPage>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-48 w-full rounded-2xl mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/app/profile">
          <Button variant="ghost" size="icon" aria-label="Back to profile">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Settings & Preferences</h1>
      </div>

      <Card className="mb-6 rounded-2xl border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-enabled" className="text-sm font-medium">
              Push notifications
            </Label>
            <Switch
              id="push-enabled"
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
              aria-label="Enable push notifications"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-enabled" className="text-sm font-medium">
              Email reminders
            </Label>
            <Switch
              id="email-enabled"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              aria-label="Enable email reminders"
            />
          </div>
          {!pushEnabled && !emailEnabled && (
            <p className="text-xs text-muted-foreground">
              Enable at least one channel to receive habit reminders.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 rounded-2xl border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Quiet hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No notifications will be sent between these times (local time).
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start" className="text-sm">
                Start
              </Label>
              <input
                id="quiet-start"
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <Label htmlFor="quiet-end" className="text-sm">
                End
              </Label>
              <input
                id="quiet-end"
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          {quietHoursError && (
            <p className="text-xs text-destructive">{quietHoursError}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 rounded-2xl border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemePreference)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Theme"
          >
            {THEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="mb-6 rounded-2xl border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync & data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sync-frequency" className="text-sm">
              Sync frequency
            </Label>
            <select
              id="sync-frequency"
              value={syncFrequency}
              onChange={(e) => setSyncFrequency(e.target.value as SyncFrequency)}
              className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Sync frequency"
            >
              {SYNC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="timezone" className="text-sm">
              Timezone
            </Label>
            <input
              id="timezone"
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
              className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Timezone"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 rounded-2xl border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="onboarding-done" className="text-sm font-medium">
              Onboarding completed
            </Label>
            <Switch
              id="onboarding-done"
              checked={onboardingCompleted}
              onCheckedChange={setOnboardingCompleted}
              aria-label="Onboarding completed"
            />
          </div>
        </CardContent>
      </Card>

      {canAccessAdmin && (
        <Card className="mb-6 rounded-2xl border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/app/admin">
              <Button variant="outline" className="rounded-xl w-full sm:w-auto">
                Open Admin Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          variant="gradient"
          className="rounded-xl flex-1"
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </AnimatedPage>
  )
}
