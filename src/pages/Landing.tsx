import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/navbar'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Target, Zap, Shield, Trophy, Plus, CheckCircle, Star } from 'lucide-react'

const features = [
  { icon: Target, title: '30-second setup', desc: 'Create a habit in seconds and start tracking right away.' },
  { icon: Zap, title: 'Instant rewards', desc: 'Earn XP and level up with every completion.' },
  { icon: Shield, title: 'Privacy first', desc: 'Your data stays yours. Opt-in social only.' },
  { icon: Trophy, title: 'Streaks & badges', desc: 'Stay motivated with streaks and achievements.' },
] as const

const steps = [
  { icon: Plus, label: 'Add a habit', text: 'Name it, pick a schedule, and go.' },
  { icon: CheckCircle, label: 'Complete daily', text: 'One tap to mark done and earn XP.' },
  { icon: Trophy, label: 'Level up', text: 'Build streaks and unlock badges.' },
] as const

const testimonials = [
  { quote: 'Finally stuck with morning meditation. The XP and streaks make it feel like a game.', name: 'Alex' },
  { quote: '30-second setup is no joke. I had three habits tracking in under two minutes.', name: 'Sam' },
] as const

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Navbar />
      <AnimatedPage className="container mx-auto max-w-4xl px-4 py-12">
        <section className="relative text-center py-16 md:py-24 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-fade-in" aria-hidden />
          <div className="relative">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              Turn habits into quests.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Quick setup, instant rewards. Build routines with XP, levels, and streaks—without the
              friction.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button variant="gradient" size="lg" className="rounded-xl hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200 shadow-card">
                  Start free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-xl border-2">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 py-12">
          {features.map((item, i) => (
            <Card
              key={i}
              className="animate-fade-in-up border-border bg-card/80 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader>
                <item.icon className="h-10 w-10 text-primary" aria-hidden />
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="py-16">
          <h2 className="text-2xl font-semibold text-foreground text-center">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/80 border border-border animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <step.icon className="h-6 w-6" aria-hidden />
                </div>
                <span className="font-medium text-foreground">{step.label}</span>
                <p className="text-sm text-muted-foreground mt-1">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-2xl font-semibold text-foreground text-center">Loved by habit builders</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            {testimonials.map((t, i) => (
              <Card key={i} className="rounded-2xl border-border bg-card/80 p-6 animate-fade-in-up">
                <div className="flex gap-1 text-primary mb-2" aria-hidden>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm text-muted-foreground mt-2">— {t.name}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">Free to start. Upgrade for more habits and analytics.</p>
          <Link to="/signup">
            <Button variant="outline" className="mt-4 rounded-xl">
              See plans
            </Button>
          </Link>
        </section>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link>
          {' · '}
          <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
        </footer>
      </AnimatedPage>
    </div>
  )
}
