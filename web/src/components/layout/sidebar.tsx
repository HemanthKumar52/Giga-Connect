'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  MessageSquare,
  Wallet,
  Star,
  ShoppingBag,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const freelancerLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Find Jobs' },
  { href: '/proposals', icon: FileText, label: 'My Proposals' },
  { href: '/contracts', icon: Users, label: 'Contracts' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/earnings', icon: Wallet, label: 'Earnings' },
  { href: '/reviews', icon: Star, label: 'Reviews' },
  { href: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
]

const employerLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/post-job', icon: Briefcase, label: 'Post a Job' },
  { href: '/my-jobs', icon: FileText, label: 'My Jobs' },
  { href: '/freelancers', icon: Users, label: 'Find Talent' },
  { href: '/contracts', icon: Users, label: 'Contracts' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/payments', icon: Wallet, label: 'Payments' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const links = user?.role === 'EMPLOYER' ? employerLinks : freelancerLinks

  return (
    <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 flex-col border-r bg-background">
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          Help & Support
        </Link>
      </div>
    </aside>
  )
}
