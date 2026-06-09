import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapters.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Chapters')
@Controller('chapters')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER')
@ApiBearerAuth()
export class ChaptersController {
  constructor(private chaptersService: ChaptersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chapter' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateChapterDto) {
    return this.chaptersService.create(user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a chapter' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.chaptersService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chapter' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.chaptersService.delete(id, user.sub);
  }

  @Post('reorder/:courseId')
  @ApiOperation({ summary: 'Reorder chapters' })
  async reorder(
    @CurrentUser() user: JwtPayload,
    @Param('courseId') courseId: string,
    @Body() body: { chapterIds: string[] },
  ) {
    return this.chaptersService.reorder(courseId, user.sub, body.chapterIds);
  }
}
