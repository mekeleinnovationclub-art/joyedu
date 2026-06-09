import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuthModule } from '../auth/auth.module';
import { TelebirrService } from './telebirr/telebirr.service';

@Module({
  imports: [AuthModule, HttpModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, TelebirrService],
  exports: [PaymentsService, TelebirrService],
})
export class PaymentsModule {}
