import { Outlet } from 'react-router-dom'
import { BottomNav } from './bottom-nav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-24">
      <main className="container mx-auto max-w-lg px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
