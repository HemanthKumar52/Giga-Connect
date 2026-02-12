import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, SearchJobsDto } from './dto';
import { Prisma, JobStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(posterId: string, dto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: {
        posterId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        subcategory: dto.subcategory,
        jobType: dto.jobType,
        experienceLevel: dto.experienceLevel,
        budgetType: dto.budgetType,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        fixedPrice: dto.fixedPrice,
        hourlyRateMin: dto.hourlyRateMin,
        hourlyRateMax: dto.hourlyRateMax,
        estimatedHours: dto.estimatedHours,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        visibility: dto.visibility,
        status: dto.status || JobStatus.OPEN,
        attachments: dto.attachments || [],
        location: dto.location,
        isRemote: dto.isRemote ?? true,
        skills: {
          create: dto.skills?.map((skill) => ({
            skill: {
              connectOrCreate: {
                where: { slug: skill.slug },
                create: { name: skill.name || skill.slug, slug: skill.slug },
              },
            },
            isRequired: skill.isRequired ?? true,
          })),
        },
      },
      include: {
        poster: {
          include: { profile: true },
        },
        skills: { include: { skill: true } },
      },
    });

    return job;
  }

  async findById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        poster: {
          include: { profile: true },
        },
        skills: { include: { skill: true } },
        proposals: {
          include: {
            freelancer: {
              include: { profile: true },
            },
          },
          take: 5,
        },
        _count: {
          select: { proposals: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Increment view count
    await this.prisma.job.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return job;
  }

  async update(jobId: string, posterId: string, dto: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.posterId !== posterId) {
      throw new ForbiddenException('You can only edit your own jobs');
    }

    if (job.status === JobStatus.IN_PROGRESS || job.status === JobStatus.COMPLETED) {
      throw new BadRequestException('Cannot edit job that is in progress or completed');
    }

    // Delete existing skills if updating
    if (dto.skills) {
      await this.prisma.jobSkill.deleteMany({
        where: { jobId },
      });
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        subcategory: dto.subcategory,
        jobType: dto.jobType,
        experienceLevel: dto.experienceLevel,
        budgetType: dto.budgetType,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        fixedPrice: dto.fixedPrice,
        hourlyRateMin: dto.hourlyRateMin,
        hourlyRateMax: dto.hourlyRateMax,
        estimatedHours: dto.estimatedHours,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        visibility: dto.visibility,
        status: dto.status,
        attachments: dto.attachments,
        location: dto.location,
        isRemote: dto.isRemote,
        ...(dto.skills && {
          skills: {
            create: dto.skills.map((skill) => ({
              skill: {
                connectOrCreate: {
                  where: { slug: skill.slug },
                  create: { name: skill.name || skill.slug, slug: skill.slug },
                },
              },
              isRequired: skill.isRequired ?? true,
            })),
          },
        }),
      },
      include: {
        poster: { include: { profile: true } },
        skills: { include: { skill: true } },
      },
    });
  }

  async delete(jobId: string, posterId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.posterId !== posterId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    if (job.status === JobStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete job that is in progress');
    }

    await this.prisma.job.delete({ where: { id: jobId } });

    return { message: 'Job deleted successfully' };
  }

  async search(query: SearchJobsDto) {
    const {
      search,
      category,
      skills,
      jobType,
      experienceLevel,
      budgetMin,
      budgetMax,
      isRemote,
      status = JobStatus.OPEN,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      status,
      visibility: 'PUBLIC',
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
      ...(jobType && { jobType }),
      ...(experienceLevel && { experienceLevel }),
      ...(budgetMin && {
        OR: [
          { budgetMin: { gte: budgetMin } },
          { fixedPrice: { gte: budgetMin } },
        ],
      }),
      ...(budgetMax && {
        OR: [
          { budgetMax: { lte: budgetMax } },
          { fixedPrice: { lte: budgetMax } },
        ],
      }),
      ...(isRemote !== undefined && { isRemote }),
      ...(skills &&
        skills.length > 0 && {
          skills: {
            some: {
              skill: {
                slug: { in: skills },
              },
            },
          },
        }),
    };

    const orderBy: Prisma.JobOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          poster: {
            include: { profile: true },
          },
          skills: { include: { skill: true } },
          _count: {
            select: { proposals: true },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyJobs(posterId: string, status?: JobStatus) {
    return this.prisma.job.findMany({
      where: {
        posterId,
        ...(status && { status }),
      },
      include: {
        skills: { include: { skill: true } },
        _count: {
          select: { proposals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCategories() {
    const categories = await this.prisma.job.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }));
  }

  async getPopularSkills() {
    const skills = await this.prisma.skill.findMany({
      where: { isPopular: true },
      orderBy: { name: 'asc' },
    });

    return skills;
  }
}
