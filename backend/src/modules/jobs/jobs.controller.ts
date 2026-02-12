import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto, SearchJobsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles, Public } from '../../common/decorators';
import { UserRole, JobStatus } from '@prisma/client';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.HYBRID, UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job posting' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.create(userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search jobs' })
  async search(@Query() query: SearchJobsDto) {
    return this.jobsService.search(query);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get job categories' })
  async getCategories() {
    return this.jobsService.getCategories();
  }

  @Public()
  @Get('skills/popular')
  @ApiOperation({ summary: 'Get popular skills' })
  async getPopularSkills() {
    return this.jobsService.getPopularSkills();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-jobs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my posted jobs' })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  async getMyJobs(
    @CurrentUser('id') userId: string,
    @Query('status') status?: JobStatus,
  ) {
    return this.jobsService.getMyJobs(userId, status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  async findOne(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a job' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a job' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.jobsService.delete(id, userId);
  }
}
