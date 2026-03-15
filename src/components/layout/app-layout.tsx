import { Outlet } from 'react-router-dom'
import { BottomNav } from './bottom-nav'
import { OnboardingModal } from '@/components/auth/OnboardingModal'
import { SyncStatusChip, ConflictResolutionModal } from '@/components/offline'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm px-4 py-2 flex justify-end">
        <SyncStatusChip />
      </header>
      <main className="container mx-auto max-w-lg px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
      <OnboardingModal />
      <ConflictResolutionModal />
    </div>
  )
}
