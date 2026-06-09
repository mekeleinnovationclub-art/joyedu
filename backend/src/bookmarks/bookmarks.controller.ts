import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BookmarksController {
  constructor(private bookmarksService: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: 'Get user bookmarks' })
  async getUserBookmarks(@CurrentUser() user: JwtPayload) {
    return this.bookmarksService.getUserBookmarks(user.sub);
  }

  @Post(':courseId')
  @ApiOperation({ summary: 'Add course to bookmarks' })
  async addBookmark(@CurrentUser() user: JwtPayload, @Param('courseId') courseId: string) {
    return this.bookmarksService.addBookmark(user.sub, courseId);
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Remove course from bookmarks' })
  async removeBookmark(@CurrentUser() user: JwtPayload, @Param('courseId') courseId: string) {
    return this.bookmarksService.removeBookmark(user.sub, courseId);
  }
}
