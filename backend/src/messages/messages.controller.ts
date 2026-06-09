import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from '../chat/chat.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MessagesController {
  constructor(private chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get user messages (alias for chat)' })
  async getUserMessages(@CurrentUser() user: JwtPayload) {
    return this.chatService.getUserChats(user.sub);
  }
}
