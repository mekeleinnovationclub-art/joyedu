import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditRecoveryService } from './audit-recovery.service';
import { AuditRecoveryController } from './audit-recovery.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminController, AuditRecoveryController],
  providers: [AdminService, AuditRecoveryService],
  exports: [AdminService, AuditRecoveryService],
})
export class AdminModule {}
