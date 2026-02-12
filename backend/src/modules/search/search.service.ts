import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalSearchDto } from './dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(dto: GlobalSearchDto) {
    const { query, type, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const results: any = {};

    if (!type || type === 'freelancers') {
      const freelancers = await this.prisma.user.findMany({
        where: {
          role: { in: ['FREELANCER', 'HYBRID'] },
          status: 'ACTIVE',
          OR: [
            { profile: { firstName: { contains: query, mode: 'insensitive' } } },
            { profile: { lastName: { contains: query, mode: 'insensitive' } } },
            { profile: { headline: { contains: query, mode: 'insensitive' } } },
            { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } },
          ],
        },
        include: {
          profile: true,
          skills: { include: { skill: true }, take: 5 },
        },
        skip: type ? skip : 0,
        take: type ? limit : 5,
      });
      results.freelancers = freelancers.map((u) => {
        const { password, mfaSecret, ...rest } = u;
        return rest;
      });
    }

    if (!type || type === 'jobs') {
      const jobs = await this.prisma.job.findMany({
        where: {
          status: 'OPEN',
          visibility: 'PUBLIC',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } },
          ],
        },
        include: {
          poster: { include: { profile: true } },
          skills: { include: { skill: true } },
        },
        skip: type ? skip : 0,
        take: type ? limit : 5,
      });
      results.jobs = jobs;
    }

    if (!type || type === 'products') {
      const products = await this.prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          seller: { include: { profile: true } },
        },
        skip: type ? skip : 0,
        take: type ? limit : 5,
      });
      results.products = products;
    }

    if (!type || type === 'skills') {
      const skills = await this.prisma.skill.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        skip: type ? skip : 0,
        take: type ? limit : 10,
      });
      results.skills = skills;
    }

    return results;
  }

  async getAutocompleteSuggestions(query: string) {
    const [skills, users, jobs] = await Promise.all([
      this.prisma.skill.findMany({
        where: { name: { startsWith: query, mode: 'insensitive' } },
        take: 5,
        select: { name: true, slug: true },
      }),
      this.prisma.profile.findMany({
        where: {
          OR: [
            { firstName: { startsWith: query, mode: 'insensitive' } },
            { lastName: { startsWith: query, mode: 'insensitive' } },
            { displayName: { startsWith: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { firstName: true, lastName: true, userId: true },
      }),
      this.prisma.job.findMany({
        where: {
          status: 'OPEN',
          title: { contains: query, mode: 'insensitive' },
        },
        take: 3,
        select: { id: true, title: true },
      }),
    ]);

    return {
      skills: skills.map((s) => ({ type: 'skill', value: s.name, slug: s.slug })),
      users: users.map((u) => ({ type: 'user', value: `${u.firstName} ${u.lastName}`, id: u.userId })),
      jobs: jobs.map((j) => ({ type: 'job', value: j.title, id: j.id })),
    };
  }

  async getTrendingSearches() {
    // In production, this would be based on actual search analytics
    const popularSkills = await this.prisma.skill.findMany({
      where: { isPopular: true },
      take: 10,
    });

    const trendingCategories = await this.prisma.job.groupBy({
      by: ['category'],
      where: {
        status: 'OPEN',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 5,
    });

    return {
      skills: popularSkills,
      categories: trendingCategories.map((c) => ({ name: c.category, count: c._count.category })),
    };
  }
}
