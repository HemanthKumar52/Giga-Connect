import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { SubmitDeliverableDto, AddTimeEntryDto, CreateReviewDto, RevisionRequestDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { ContractStatus } from '@prisma/client';

@ApiTags('contracts')
@Controller('contracts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get('my-contracts')
  @ApiOperation({ summary: 'Get my contracts' })
  @ApiQuery({ name: 'role', required: true, enum: ['client', 'freelancer'] })
  @ApiQuery({ name: 'status', required: false, enum: ContractStatus })
  async getMyContracts(
    @CurrentUser('id') userId: string,
    @Query('role') role: 'client' | 'freelancer',
    @Query('status') status?: ContractStatus,
  ) {
    return this.contractsService.getMyContracts(userId, role, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.findById(id, userId);
  }

  @Post(':id/milestones/:milestoneId/start')
  @ApiOperation({ summary: 'Start working on a milestone' })
  async startMilestone(
    @Param('id') contractId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.startMilestone(contractId, milestoneId, userId);
  }

  @Post(':id/milestones/:milestoneId/submit')
  @ApiOperation({ summary: 'Submit milestone deliverable' })
  async submitMilestone(
    @Param('id') contractId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitDeliverableDto,
  ) {
    return this.contractsService.submitMilestone(contractId, milestoneId, userId, dto);
  }

  @Post(':id/milestones/:milestoneId/approve')
  @ApiOperation({ summary: 'Approve milestone (client only)' })
  async approveMilestone(
    @Param('id') contractId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.approveMilestone(contractId, milestoneId, userId);
  }

  @Post(':id/milestones/:milestoneId/request-revision')
  @ApiOperation({ summary: 'Request revision on milestone (client only)' })
  async requestRevision(
    @Param('id') contractId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RevisionRequestDto,
  ) {
    return this.contractsService.requestRevision(contractId, milestoneId, userId, dto.feedback);
  }

  @Post(':id/time-entries')
  @ApiOperation({ summary: 'Add time entry (hourly contracts)' })
  async addTimeEntry(
    @Param('id') contractId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddTimeEntryDto,
  ) {
    return this.contractsService.addTimeEntry(contractId, userId, dto);
  }

  @Get(':id/time-entries')
  @ApiOperation({ summary: 'Get time entries' })
  async getTimeEntries(
    @Param('id') contractId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.getTimeEntries(contractId, userId);
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Submit a review' })
  async submitReview(
    @Param('id') contractId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.contractsService.submitReview(contractId, userId, dto);
  }
}
