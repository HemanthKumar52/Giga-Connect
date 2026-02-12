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
import { PaymentsService } from './payments.service';
import { FundEscrowDto, SetupPayoutDto, RequestPayoutDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('escrow/fund')
  @ApiOperation({ summary: 'Fund escrow for a contract' })
  async fundEscrow(
    @CurrentUser('id') userId: string,
    @Body() dto: FundEscrowDto,
  ) {
    return this.paymentsService.fundEscrow(userId, dto);
  }

  @Post('escrow/:contractId/release/:milestoneId')
  @ApiOperation({ summary: 'Release milestone payment' })
  async releaseMilestonePayment(
    @CurrentUser('id') userId: string,
    @Param('contractId') contractId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.paymentsService.releaseMilestonePayment(userId, contractId, milestoneId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTransactionHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getTransactionHistory(userId, page, limit);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get earnings summary' })
  async getEarnings(@CurrentUser('id') userId: string) {
    return this.paymentsService.getEarnings(userId);
  }

  @Get('payout-settings')
  @ApiOperation({ summary: 'Get payout settings' })
  async getPayoutSettings(@CurrentUser('id') userId: string) {
    return this.paymentsService.getPayoutSettings(userId);
  }

  @Post('payout-settings')
  @ApiOperation({ summary: 'Setup payout settings' })
  async setupPayout(
    @CurrentUser('id') userId: string,
    @Body() dto: SetupPayoutDto,
  ) {
    return this.paymentsService.setupPayout(userId, dto);
  }

  @Post('payout/request')
  @ApiOperation({ summary: 'Request payout' })
  async requestPayout(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.paymentsService.requestPayout(userId, dto.amount);
  }
}
