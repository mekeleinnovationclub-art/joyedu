import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditRecoveryService } from './audit-recovery.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RestoreFromAuditDto, GetAuditHistoryDto } from './dto/audit-recovery.dto';

@ApiTags('Audit Recovery')
@Controller('admin/audit-recovery')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AuditRecoveryController {
  constructor(private service: AuditRecoveryService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get audit history with optional filters' })
  getHistory(@Query() dto: GetAuditHistoryDto) {
    return this.service.getAuditHistory(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific audit log entry' })
  getById(@Param('id') id: string) {
    return this.service.getAuditLogById(id);
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore entity from audit log' })
  restore(@CurrentUser() user: JwtPayload, @Body() dto: RestoreFromAuditDto) {
    return this.service.restoreFromAudit(dto);
  }
}
