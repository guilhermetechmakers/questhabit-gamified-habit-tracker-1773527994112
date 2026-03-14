import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AnimatedPage } from '@/components/AnimatedPage'
import { AlertCircle, Home } from 'lucide-react'

export default function ServerError() {
  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
          <AlertCircle className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          We hit an error. Please try again or head back home.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gradient" className="rounded-xl" asChild>
            <Link to="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" aria-hidden />
              Go home
            </Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      </div>
    </AnimatedPage>
  )
}
