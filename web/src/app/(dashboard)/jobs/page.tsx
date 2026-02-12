'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Search, Filter, MapPin, Clock, DollarSign, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { jobApi } from '@/lib/api'
import { formatCurrency, formatRelativeTime, truncate } from '@/lib/utils'
import { Job } from '@/types'

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    jobType: '',
    experienceLevel: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', search, filters],
    queryFn: () => jobApi.list({ search, ...filters }),
  })

  const jobs: Job[] = data?.data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Work</h1>
        <p className="text-muted-foreground">Discover opportunities that match your skills</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="writing">Writing</option>
              <option value="data">Data Science</option>
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="FIXED_PRICE">Fixed Price</option>
              <option value="HOURLY">Hourly</option>
              <option value="MILESTONE">Milestone</option>
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.experienceLevel}
              onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
            >
              <option value="">All Levels</option>
              <option value="ENTRY">Entry Level</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={job.poster?.profile?.avatarUrl} />
                    <AvatarFallback>
                      {job.poster?.profile?.firstName?.[0]}
                      {job.poster?.profile?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Link href={`/jobs/${job.id}`}>
                        <h3 className="text-lg font-semibold hover:text-primary">
                          {job.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{job.poster?.profile?.displayName || `${job.poster?.profile?.firstName} ${job.poster?.profile?.lastName}`}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(job.createdAt)}
                        </span>
                        {job.isRemote && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Remote
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-muted-foreground">
                      {truncate(job.description, 200)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {job.skills?.slice(0, 5).map((s) => (
                        <Badge key={s.skill.id} variant="secondary">
                          {s.skill.name}
                        </Badge>
                      ))}
                      {job.skills?.length > 5 && (
                        <Badge variant="outline">+{job.skills.length - 5}</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 font-medium">
                          <DollarSign className="h-4 w-4" />
                          {job.fixedPrice
                            ? formatCurrency(job.fixedPrice)
                            : job.budgetMin && job.budgetMax
                            ? `${formatCurrency(job.budgetMin)} - ${formatCurrency(job.budgetMax)}`
                            : 'Budget not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.jobType.replace('_', ' ')}
                        </span>
                        <Badge variant={job.experienceLevel === 'ENTRY' ? 'secondary' : job.experienceLevel === 'EXPERT' ? 'default' : 'outline'}>
                          {job.experienceLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {job.proposalCount} proposals
                        </span>
                        <Button size="sm" asChild>
                          <Link href={`/jobs/${job.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {jobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
