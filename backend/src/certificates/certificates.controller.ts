import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':courseId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate certificate for completed course' })
  async generate(@CurrentUser() user: JwtPayload, @Param('courseId') courseId: string) {
    return this.certificatesService.generate(user.sub, courseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my certificates' })
  async getMyCertificates(@CurrentUser() user: JwtPayload) {
    return this.certificatesService.getMyCertificates(user.sub);
  }

  @Public()
  @Get('verify/:number')
  @ApiOperation({ summary: 'Verify a certificate' })
  async verify(@Param('number') number: string) {
    return this.certificatesService.verify(number);
  }
}
