import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/navbar'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Target, Zap, Shield, Trophy } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Navbar />
      <AnimatedPage className="container mx-auto max-w-4xl px-4 py-12">
        <section className="text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Turn habits into quests.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Quick setup, instant rewards. Build routines with XP, levels, and streaks—without the
            friction.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button variant="gradient" size="lg" className="rounded-xl">
                Start free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="rounded-xl">
                Log in
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 py-12">
          {[
            { icon: Target, title: '30-second setup', desc: 'Create a habit in seconds and start tracking right away.' },
            { icon: Zap, title: 'Instant rewards', desc: 'Earn XP and level up with every completion.' },
            { icon: Shield, title: 'Privacy first', desc: 'Your data stays yours. Opt-in social only.' },
            { icon: Trophy, title: 'Streaks & badges', desc: 'Stay motivated with streaks and achievements.' },
          ].map((item, i) => (
            <Card key={i} className="animate-fade-in-up border-border bg-card/80">
              <CardHeader>
                <item.icon className="h-10 w-10 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
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
