import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupons.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private service: CouponsService) {}

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon code' })
  async validate(@Body() dto: ValidateCouponDto) {
    return this.service.validate(dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all coupons' })
  async getAll() {
    return this.service.getAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon by ID' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get('course/:courseId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupons for a course' })
  async getByCourse(@Param('courseId') courseId: string) {
    return this.service.getByCourse(courseId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create coupon' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCouponDto) {
    return this.service.create(user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update coupon' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.service.update(id, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete coupon' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user.sub, user.roles);
  }
}
