import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Navbar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur',
        className
      )}
    >
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="text-xl">⚔️</span>
          <span>QuestHabit</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="gradient" size="sm">
              Get started
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
