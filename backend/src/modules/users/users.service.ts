import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateProfileDto,
  AddSkillDto,
  AddExperienceDto,
  AddEducationDto,
  AddCertificationDto,
  AddPortfolioItemDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        skills: { include: { skill: true } },
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        portfolioItems: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, mfaSecret, ...sanitized } = user;
    return sanitized;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
  }

  async getProfile(userId: string) {
    return this.findById(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName: dto.displayName,
        headline: dto.headline,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        bannerUrl: dto.bannerUrl,
        location: dto.location,
        timezone: dto.timezone,
        hourlyRate: dto.hourlyRate,
        availability: dto.availability,
        githubUsername: dto.githubUsername,
        linkedinUrl: dto.linkedinUrl,
        websiteUrl: dto.websiteUrl,
      },
    });

    return updatedProfile;
  }

  async addSkill(userId: string, dto: AddSkillDto) {
    let skill = await this.prisma.skill.findUnique({
      where: { slug: dto.skillSlug },
    });

    if (!skill) {
      skill = await this.prisma.skill.create({
        data: {
          name: dto.skillName || dto.skillSlug,
          slug: dto.skillSlug,
          category: dto.category,
        },
      });
    }

    const existingUserSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: skill.id,
        },
      },
    });

    if (existingUserSkill) {
      throw new BadRequestException('Skill already added');
    }

    return this.prisma.userSkill.create({
      data: {
        userId,
        skillId: skill.id,
        proficiency: dto.proficiency,
        yearsOfExp: dto.yearsOfExp,
      },
      include: { skill: true },
    });
  }

  async removeSkill(userId: string, skillId: string) {
    await this.prisma.userSkill.delete({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    return { message: 'Skill removed' };
  }

  async addExperience(userId: string, dto: AddExperienceDto) {
    return this.prisma.experience.create({
      data: {
        userId,
        title: dto.title,
        company: dto.company,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent || false,
        description: dto.description,
      },
    });
  }

  async updateExperience(userId: string, expId: string, dto: AddExperienceDto) {
    const experience = await this.prisma.experience.findFirst({
      where: { id: expId, userId },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    return this.prisma.experience.update({
      where: { id: expId },
      data: {
        title: dto.title,
        company: dto.company,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent,
        description: dto.description,
      },
    });
  }

  async deleteExperience(userId: string, expId: string) {
    const experience = await this.prisma.experience.findFirst({
      where: { id: expId, userId },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    await this.prisma.experience.delete({ where: { id: expId } });
    return { message: 'Experience deleted' };
  }

  async addEducation(userId: string, dto: AddEducationDto) {
    return this.prisma.education.create({
      data: {
        userId,
        institution: dto.institution,
        degree: dto.degree,
        field: dto.field,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        grade: dto.grade,
        description: dto.description,
      },
    });
  }

  async updateEducation(userId: string, eduId: string, dto: AddEducationDto) {
    const education = await this.prisma.education.findFirst({
      where: { id: eduId, userId },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    return this.prisma.education.update({
      where: { id: eduId },
      data: {
        institution: dto.institution,
        degree: dto.degree,
        field: dto.field,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        grade: dto.grade,
        description: dto.description,
      },
    });
  }

  async deleteEducation(userId: string, eduId: string) {
    const education = await this.prisma.education.findFirst({
      where: { id: eduId, userId },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    await this.prisma.education.delete({ where: { id: eduId } });
    return { message: 'Education deleted' };
  }

  async addCertification(userId: string, dto: AddCertificationDto) {
    return this.prisma.certification.create({
      data: {
        userId,
        name: dto.name,
        issuingOrg: dto.issuingOrg,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        credentialId: dto.credentialId,
        credentialUrl: dto.credentialUrl,
      },
    });
  }

  async deleteCertification(userId: string, certId: string) {
    const cert = await this.prisma.certification.findFirst({
      where: { id: certId, userId },
    });

    if (!cert) {
      throw new NotFoundException('Certification not found');
    }

    await this.prisma.certification.delete({ where: { id: certId } });
    return { message: 'Certification deleted' };
  }

  async addPortfolioItem(userId: string, dto: AddPortfolioItemDto) {
    return this.prisma.portfolioItem.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        projectUrl: dto.projectUrl,
        imageUrls: dto.imageUrls || [],
        tags: dto.tags || [],
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async updatePortfolioItem(userId: string, itemId: string, dto: AddPortfolioItemDto) {
    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    return this.prisma.portfolioItem.update({
      where: { id: itemId },
      data: {
        title: dto.title,
        description: dto.description,
        projectUrl: dto.projectUrl,
        imageUrls: dto.imageUrls,
        tags: dto.tags,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async deletePortfolioItem(userId: string, itemId: string) {
    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    await this.prisma.portfolioItem.delete({ where: { id: itemId } });
    return { message: 'Portfolio item deleted' };
  }

  async searchFreelancers(query: {
    search?: string;
    skills?: string[];
    minRate?: number;
    maxRate?: number;
    availability?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, skills, minRate, maxRate, availability, location, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: { in: ['FREELANCER', 'HYBRID'] },
      status: 'ACTIVE',
      profile: {
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { headline: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(minRate && { hourlyRate: { gte: minRate } }),
        ...(maxRate && { hourlyRate: { lte: maxRate } }),
        ...(availability && { availability: availability as any }),
        ...(location && { location: { contains: location, mode: 'insensitive' } }),
      },
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

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          skills: { include: { skill: true } },
        },
        skip,
        take: limit,
        orderBy: { profile: { avgRating: 'desc' } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => {
        const { password, mfaSecret, ...sanitized } = u;
        return sanitized;
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
