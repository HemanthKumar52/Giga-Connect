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
import { ProposalsService } from './proposals.service';
import { CreateProposalDto, UpdateProposalDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole, ProposalStatus } from '@prisma/client';

@ApiTags('proposals')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER, UserRole.HYBRID)
  @Post()
  @ApiOperation({ summary: 'Submit a proposal' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposalsService.create(userId, dto);
  }

  @Get('my-proposals')
  @ApiOperation({ summary: 'Get my submitted proposals' })
  @ApiQuery({ name: 'status', required: false, enum: ProposalStatus })
  async getMyProposals(
    @CurrentUser('id') userId: string,
    @Query('status') status?: ProposalStatus,
  ) {
    return this.proposalsService.getMyProposals(userId, status);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get proposals for a job (job owner only)' })
  async getJobProposals(
    @Param('jobId') jobId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.proposalsService.getJobProposals(jobId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a proposal' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Withdraw a proposal' })
  async withdraw(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.proposalsService.withdraw(id, userId);
  }

  @Post(':id/shortlist')
  @ApiOperation({ summary: 'Shortlist a proposal (job owner only)' })
  async shortlist(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.proposalsService.shortlist(id, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a proposal (job owner only)' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.proposalsService.reject(id, userId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a proposal and create contract (job owner only)' })
  async accept(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.proposalsService.accept(id, userId);
  }
}
