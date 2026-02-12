'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, MessageSquare, Search, Menu, User, LogOut, Settings, Briefcase, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const pathname = usePathname()

  const navLinks = [
    { href: '/jobs', label: 'Find Work' },
    { href: '/freelancers', label: 'Find Talent' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/feed', label: 'Community' },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">G</span>
          </div>
          <span className="hidden font-bold sm:inline-block">GigaConnect</span>
        </Link>

        <div className="hidden md:flex md:items-center md:space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden w-full max-w-sm lg:flex">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs, freelancers..."
                className="pl-8"
              />
            </div>
          </div>

          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>

              <div className="relative group">
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile?.avatarUrl} alt={user?.profile?.firstName} />
                    <AvatarFallback>
                      {user?.profile?.firstName?.[0]}
                      {user?.profile?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover p-1 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.profile?.displayName || `${user?.profile?.firstName} ${user?.profile?.lastName}`}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="h-px bg-border my-1" />
                  <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent">
                    <Briefcase className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link href="/proposals" className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent">
                    <FileText className="h-4 w-4" /> Proposals
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
