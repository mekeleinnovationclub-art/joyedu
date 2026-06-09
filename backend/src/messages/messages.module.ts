import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [MessagesController],
})
export class MessagesModule {}
