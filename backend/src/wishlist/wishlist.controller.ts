import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  async getUserWishlist(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.getUserWishlist(user.sub);
  }

  @Post(':courseId')
  @ApiOperation({ summary: 'Add course to wishlist' })
  async addToWishlist(@CurrentUser() user: JwtPayload, @Param('courseId') courseId: string) {
    return this.wishlistService.addToWishlist(user.sub, courseId);
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Remove course from wishlist' })
  async removeFromWishlist(@CurrentUser() user: JwtPayload, @Param('courseId') courseId: string) {
    return this.wishlistService.removeFromWishlist(user.sub, courseId);
  }
}
