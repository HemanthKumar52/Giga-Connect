import Link from 'next/link'
import { ArrowRight, Shield, Zap, Globe, Users, DollarSign, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/navbar'

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    description: 'Smart algorithms match you with the perfect freelancers or jobs based on skills, experience, and preferences.',
  },
  {
    icon: Shield,
    title: 'Secure Escrow Payments',
    description: 'Your payments are protected. Funds are only released when milestones are approved.',
  },
  {
    icon: Globe,
    title: 'Global Talent Pool',
    description: 'Access top professionals from around the world. Work with the best, regardless of location.',
  },
  {
    icon: Users,
    title: 'Professional Networking',
    description: 'Build your network, share updates, and grow your professional community.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pricing',
    description: 'Clear pricing with AI-powered rate recommendations. No hidden fees.',
  },
  {
    icon: Star,
    title: 'Verified Profiles',
    description: 'Trust verified freelancers with proven track records and authentic reviews.',
  },
]

const stats = [
  { value: '50K+', label: 'Freelancers' },
  { value: '100K+', label: 'Projects Completed' },
  { value: '$10M+', label: 'Paid to Freelancers' },
  { value: '4.9/5', label: 'Average Rating' },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              The <span className="gradient-text">AI-Powered</span> Freelance Marketplace
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Connect with top talent, secure your payments with escrow, and grow your business with intelligent matching and seamless collaboration.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/jobs">Browse Jobs</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete platform for freelancers and clients to connect, collaborate, and grow together.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to get started?</h2>
          <p className="mt-4 text-lg opacity-90">
            Join thousands of freelancers and clients already using GigaConnect.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register?role=freelancer">Join as Freelancer</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/register?role=employer">Hire Talent</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">G</span>
                </div>
                <span className="font-bold">GigaConnect</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                The AI-powered marketplace connecting top talent with amazing opportunities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">For Freelancers</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/jobs" className="hover:text-foreground">Find Work</Link></li>
                <li><Link href="/skills" className="hover:text-foreground">Skill Tests</Link></li>
                <li><Link href="/community" className="hover:text-foreground">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">For Clients</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/post-job" className="hover:text-foreground">Post a Job</Link></li>
                <li><Link href="/freelancers" className="hover:text-foreground">Find Talent</Link></li>
                <li><Link href="/enterprise" className="hover:text-foreground">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GigaConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
