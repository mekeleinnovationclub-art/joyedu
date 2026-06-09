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
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto } from './dto/chat.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get user chats' })
  async getUserChats(@CurrentUser() user: JwtPayload) {
    return this.chatService.getUserChats(user.sub);
  }

  @Get('instructor/conversations')
  @ApiOperation({ summary: 'Get instructor conversations with students' })
  async getInstructorConversations(@CurrentUser() user: JwtPayload) {
    return this.chatService.getInstructorConversations(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a chat' })
  async createChat(@CurrentUser() user: JwtPayload, @Body() dto: CreateChatDto) {
    return this.chatService.createChat(user.sub, dto);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  async getChatMessages(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getChatMessages(chatId, user.sub, page, limit);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(@CurrentUser() user: JwtPayload, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.sub, dto);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.chatService.deleteMessage(id, user.sub);
  }
}
