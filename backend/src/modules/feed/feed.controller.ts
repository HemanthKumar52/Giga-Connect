import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { CreatePostDto, CreateCommentDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post' })
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.feedService.createPost(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feed' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feedService.getFeed(userId, page, limit);
  }

  @Public()
  @Get('posts/:id')
  @ApiOperation({ summary: 'Get post by ID' })
  async getPost(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.feedService.getPost(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.feedService.deletePost(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like/unlike a post' })
  async likePost(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.feedService.likePost(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment' })
  async addComment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.feedService.addComment(postId, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.feedService.deleteComment(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow/unfollow a user' })
  async followUser(
    @Param('userId') followingId: string,
    @CurrentUser('id') followerId: string,
  ) {
    return this.feedService.followUser(followerId, followingId);
  }

  @Public()
  @Get('users/:id/followers')
  @ApiOperation({ summary: 'Get followers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowers(
    @Param('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feedService.getFollowers(userId, page, limit);
  }

  @Public()
  @Get('users/:id/following')
  @ApiOperation({ summary: 'Get following' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowing(
    @Param('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feedService.getFollowing(userId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('suggestions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggested connections' })
  @ApiQuery({ name: 'limit', required: false })
  async getSuggestedConnections(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.feedService.getSuggestedConnections(userId, limit);
  }
}
