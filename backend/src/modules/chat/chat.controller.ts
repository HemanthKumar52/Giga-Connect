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
import { ChatService } from './chat.service';
import { CreateConversationDto, CreateMessageDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a conversation' })
  async createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(userId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  async getConversation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getConversation(id, userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(conversationId, userId, page, limit);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, userId, dto);
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Edit a message' })
  async editMessage(
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.chatService.editMessage(messageId, userId, content);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.deleteMessage(messageId, userId);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.markAsRead(conversationId, userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread messages count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.chatService.getUnreadCount(userId);
  }
}
