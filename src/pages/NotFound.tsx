import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <AnimatedPage className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-muted-foreground">This page doesn't exist.</p>
      <Link to="/" className="mt-8">
        <Button variant="gradient" className="rounded-xl">
          <Home className="h-4 w-4 mr-2" />
          Go home
        </Button>
      </Link>
    </AnimatedPage>
  )
}
