import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole, UserStatus } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: UserStatus,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(page, limit, status, role);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  async suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate a user' })
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'Get disputes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDisputes(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getDisputes(page, limit);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get recent transactions' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentTransactions(@Query('limit') limit?: number) {
    return this.adminService.getRecentTransactions(limit);
  }

  @Get('fraud-alerts')
  @ApiOperation({ summary: 'Get fraud alerts' })
  @ApiQuery({ name: 'limit', required: false })
  async getFraudAlerts(@Query('limit') limit?: number) {
    return this.adminService.getFraudAlerts(limit);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
