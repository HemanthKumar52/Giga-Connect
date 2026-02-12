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
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  AddSkillDto,
  AddExperienceDto,
  AddEducationDto,
  AddCertificationDto,
  AddPortfolioItemDto,
  SearchFreelancersDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Public()
  @Get('freelancers')
  @ApiOperation({ summary: 'Search freelancers' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skills', required: false, isArray: true })
  @ApiQuery({ name: 'minRate', required: false })
  @ApiQuery({ name: 'maxRate', required: false })
  @ApiQuery({ name: 'availability', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async searchFreelancers(@Query() query: SearchFreelancersDto) {
    return this.usersService.searchFreelancers(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // Skills
  @UseGuards(JwtAuthGuard)
  @Post('me/skills')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a skill' })
  async addSkill(
    @CurrentUser('id') userId: string,
    @Body() dto: AddSkillDto,
  ) {
    return this.usersService.addSkill(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/skills/:skillId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a skill' })
  async removeSkill(
    @CurrentUser('id') userId: string,
    @Param('skillId') skillId: string,
  ) {
    return this.usersService.removeSkill(userId, skillId);
  }

  // Experience
  @UseGuards(JwtAuthGuard)
  @Post('me/experience')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add work experience' })
  async addExperience(
    @CurrentUser('id') userId: string,
    @Body() dto: AddExperienceDto,
  ) {
    return this.usersService.addExperience(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/experience/:expId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update work experience' })
  async updateExperience(
    @CurrentUser('id') userId: string,
    @Param('expId') expId: string,
    @Body() dto: AddExperienceDto,
  ) {
    return this.usersService.updateExperience(userId, expId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/experience/:expId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete work experience' })
  async deleteExperience(
    @CurrentUser('id') userId: string,
    @Param('expId') expId: string,
  ) {
    return this.usersService.deleteExperience(userId, expId);
  }

  // Education
  @UseGuards(JwtAuthGuard)
  @Post('me/education')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add education' })
  async addEducation(
    @CurrentUser('id') userId: string,
    @Body() dto: AddEducationDto,
  ) {
    return this.usersService.addEducation(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/education/:eduId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update education' })
  async updateEducation(
    @CurrentUser('id') userId: string,
    @Param('eduId') eduId: string,
    @Body() dto: AddEducationDto,
  ) {
    return this.usersService.updateEducation(userId, eduId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/education/:eduId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete education' })
  async deleteEducation(
    @CurrentUser('id') userId: string,
    @Param('eduId') eduId: string,
  ) {
    return this.usersService.deleteEducation(userId, eduId);
  }

  // Certifications
  @UseGuards(JwtAuthGuard)
  @Post('me/certifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add certification' })
  async addCertification(
    @CurrentUser('id') userId: string,
    @Body() dto: AddCertificationDto,
  ) {
    return this.usersService.addCertification(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/certifications/:certId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete certification' })
  async deleteCertification(
    @CurrentUser('id') userId: string,
    @Param('certId') certId: string,
  ) {
    return this.usersService.deleteCertification(userId, certId);
  }

  // Portfolio
  @UseGuards(JwtAuthGuard)
  @Post('me/portfolio')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add portfolio item' })
  async addPortfolioItem(
    @CurrentUser('id') userId: string,
    @Body() dto: AddPortfolioItemDto,
  ) {
    return this.usersService.addPortfolioItem(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/portfolio/:itemId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update portfolio item' })
  async updatePortfolioItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddPortfolioItemDto,
  ) {
    return this.usersService.updatePortfolioItem(userId, itemId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/portfolio/:itemId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete portfolio item' })
  async deletePortfolioItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.usersService.deletePortfolioItem(userId, itemId);
  }
}
