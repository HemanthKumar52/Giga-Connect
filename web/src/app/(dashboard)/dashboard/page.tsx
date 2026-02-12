'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Briefcase,
  FileText,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import { jobApi, proposalApi, contractApi, paymentApi } from '@/lib/api'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isFreelancer = user?.role === 'FREELANCER' || user?.role === 'HYBRID'

  const { data: contracts } = useQuery({
    queryKey: ['contracts', isFreelancer ? 'freelancer' : 'client'],
    queryFn: () => contractApi.list(isFreelancer ? 'freelancer' : 'client', 'ACTIVE'),
  })

  const { data: proposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => proposalApi.myProposals(),
    enabled: isFreelancer,
  })

  const { data: earnings } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => paymentApi.earnings(),
    enabled: isFreelancer,
  })

  const { data: jobs } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => jobApi.myJobs(),
    enabled: !isFreelancer,
  })

  const stats = isFreelancer
    ? [
        {
          label: 'Total Earnings',
          value: formatCurrency(earnings?.data?.totalEarnings || 0),
          icon: DollarSign,
          color: 'text-green-500',
        },
        {
          label: 'Active Contracts',
          value: contracts?.data?.length || 0,
          icon: Briefcase,
          color: 'text-blue-500',
        },
        {
          label: 'Pending Proposals',
          value: proposals?.data?.filter((p: any) => p.status === 'PENDING').length || 0,
          icon: FileText,
          color: 'text-orange-500',
        },
        {
          label: 'Success Rate',
          value: `${user?.profile?.successRate || 0}%`,
          icon: TrendingUp,
          color: 'text-purple-500',
        },
      ]
    : [
        {
          label: 'Active Jobs',
          value: jobs?.data?.filter((j: any) => j.status === 'OPEN').length || 0,
          icon: Briefcase,
          color: 'text-blue-500',
        },
        {
          label: 'Active Contracts',
          value: contracts?.data?.length || 0,
          icon: FileText,
          color: 'text-green-500',
        },
        {
          label: 'Total Spent',
          value: formatCurrency(user?.profile?.totalSpent || 0),
          icon: DollarSign,
          color: 'text-orange-500',
        },
        {
          label: 'Completed Projects',
          value: user?.profile?.completedJobs || 0,
          icon: CheckCircle,
          color: 'text-purple-500',
        },
      ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.profile?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your {isFreelancer ? 'freelance work' : 'projects'} today.
          </p>
        </div>
        <Button asChild>
          <Link href={isFreelancer ? '/jobs' : '/post-job'}>
            {isFreelancer ? 'Find Work' : 'Post a Job'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Contracts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Contracts</CardTitle>
            <CardDescription>Your ongoing projects and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts?.data?.slice(0, 3).map((contract: any) => (
                <div key={contract.id} className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={isFreelancer ? contract.client?.profile?.avatarUrl : contract.freelancer?.profile?.avatarUrl}
                    />
                    <AvatarFallback>
                      {isFreelancer
                        ? contract.client?.profile?.firstName?.[0]
                        : contract.freelancer?.profile?.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{contract.title}</p>
                    <p className="text-sm text-muted-foreground">
                      with {isFreelancer ? contract.client?.profile?.displayName : contract.freelancer?.profile?.displayName}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {formatCurrency(contract.totalAmount)}
                  </Badge>
                </div>
              ))}
              {(!contracts?.data || contracts.data.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No active contracts
                </p>
              )}
            </div>
            {contracts?.data?.length > 0 && (
              <Button variant="link" className="mt-4 w-full" asChild>
                <Link href="/contracts">View all contracts</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity / Proposals */}
        <Card>
          <CardHeader>
            <CardTitle>{isFreelancer ? 'Recent Proposals' : 'Recent Jobs'}</CardTitle>
            <CardDescription>
              {isFreelancer ? 'Track your submitted proposals' : 'Your recently posted jobs'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isFreelancer
                ? proposals?.data?.slice(0, 3).map((proposal: any) => (
                    <div key={proposal.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{proposal.job?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatRelativeTime(proposal.submittedAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          proposal.status === 'ACCEPTED'
                            ? 'success'
                            : proposal.status === 'REJECTED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {proposal.status}
                      </Badge>
                    </div>
                  ))
                : jobs?.data?.slice(0, 3).map((job: any) => (
                    <div key={job.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.proposalCount} proposals
                        </p>
                      </div>
                      <Badge variant={job.status === 'OPEN' ? 'success' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
              {(isFreelancer ? !proposals?.data?.length : !jobs?.data?.length) && (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity
                </p>
              )}
            </div>
            <Button variant="link" className="mt-4 w-full" asChild>
              <Link href={isFreelancer ? '/proposals' : '/my-jobs'}>
                View all {isFreelancer ? 'proposals' : 'jobs'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion (for freelancers) */}
      {isFreelancer && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              A complete profile helps you stand out and get more jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">60% Complete</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile#skills">Add Skills</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile#portfolio">Add Portfolio</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile#experience">Add Experience</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
