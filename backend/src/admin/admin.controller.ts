import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CourseModerationDto } from './dto/course-moderation.dto';
import { PayoutActionDto } from './dto/payout-action.dto';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto } from './dto/feature-flag.dto';
import { CreatePlatformSettingDto, UpdatePlatformSettingDto } from './dto/platform-settings.dto';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { AdminCourseFilterDto } from './dto/admin-course-filter.dto';
import { BulkPlatformSettingsDto } from './dto/bulk-settings.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('payments/stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getPaymentStats() {
    return this.adminService.getPaymentStats();
  }

  @Get('payments/transactions')
  @ApiOperation({ summary: 'Get all transactions with filters' })
  async getTransactions(@Query() query: PaginationDto & { status?: string; paymentMethod?: string; courseId?: string }) {
    return this.adminService.getTransactions(query);
  }

  // ==================== USER MANAGEMENT ====================

  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  async getUsers(@Query() filter: UserFilterDto) {
    return this.adminService.getUsersWithFilters(filter);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() createUserDto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.createUser(createUserDto, user.sub);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateUser(id, updateUserDto, user.sub);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (partial)' })
  async patchUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateUser(id, updateUserDto, user.sub);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft delete user' })
  async softDeleteUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.softDeleteUser(id, user.sub);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.suspendUser(id, user.sub);
  }

  @Post('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate user' })
  async reactivateUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.reactivateUser(id, user.sub);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  async resetUserPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.resetUserPassword(id, resetPasswordDto, user.sub);
  }

  @Post('users/:id/verify-teacher')
  @ApiOperation({ summary: 'Verify user as teacher' })
  async verifyTeacher(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.verifyTeacher(id, user.sub);
  }

  @Post('users/:id/remove-teacher-role')
  @ApiOperation({ summary: 'Remove teacher role from user' })
  async removeTeacherRole(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.removeTeacherRole(id, user.sub);
  }

  // ==================== COURSE MANAGEMENT ====================

  @Get('courses')
  @ApiOperation({ summary: 'List all courses for admin' })
  async getCourses(@Query() query: AdminCourseFilterDto) {
    return this.adminService.getCourses(query);
  }

  @Put('courses/:id/moderate')
  @ApiOperation({ summary: 'Moderate course (status, featured)' })
  async moderateCourse(
    @Param('id') id: string,
    @Body() moderationDto: CourseModerationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.moderateCourse(id, moderationDto, user.sub);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update course (partial)' })
  async patchCourse(
    @Param('id') id: string,
    @Body() moderationDto: CourseModerationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.moderateCourse(id, moderationDto, user.sub);
  }

  @Post('courses/:id/publish')
  @ApiOperation({ summary: 'Publish course' })
  async publishCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.publishCourse(id, user.sub);
  }

  @Post('courses/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish course' })
  async unpublishCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.unpublishCourse(id, user.sub);
  }

  @Post('courses/:id/feature')
  @ApiOperation({ summary: 'Feature course' })
  async featureCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.featureCourse(id, user.sub);
  }

  @Post('courses/:id/unfeature')
  @ApiOperation({ summary: 'Unfeature course' })
  async unfeatureCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.unfeatureCourse(id, user.sub);
  }

  @Post('courses/:id/archive')
  @ApiOperation({ summary: 'Archive course' })
  async archiveCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.archiveCourse(id, user.sub);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Delete course' })
  async deleteCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.deleteCourse(id, user.sub);
  }

  // ==================== ANALYTICS ====================

  @Get('analytics/comprehensive')
  @ApiOperation({ summary: 'Get comprehensive platform analytics' })
  async getComprehensiveAnalytics(@Query() filter: AnalyticsFilterDto) {
    return this.adminService.getComprehensiveAnalytics(filter);
  }

  @Get('analytics/growth')
  @ApiOperation({ summary: 'Get growth metrics over time' })
  async getGrowthMetrics(@Query() filter: AnalyticsFilterDto) {
    return this.adminService.getGrowthMetrics(filter);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics (legacy)' })
  async getPlatformAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }

  // ==================== PAYOUT MANAGEMENT ====================

  @Get('payouts')
  @ApiOperation({ summary: 'List all payouts for admin' })
  async getPayouts(@Query() query: PaginationDto) {
    return this.adminService.getPayouts(query);
  }

  @Get('payouts/history')
  @ApiOperation({ summary: 'Get payout history' })
  async getPayoutHistory(@Query() query: PaginationDto, @Query('instructorId') instructorId?: string) {
    return this.adminService.getPayoutHistory(instructorId, query);
  }

  @Get('payouts/teacher/:id/earnings')
  @ApiOperation({ summary: 'Get teacher earnings details' })
  async getTeacherEarnings(@Param('id') id: string) {
    return this.adminService.getTeacherEarnings(id);
  }

  @Put('payouts/:id/approve')
  @ApiOperation({ summary: 'Approve payout' })
  async approvePayout(
    @Param('id') id: string,
    @Body() payoutActionDto: PayoutActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.approvePayout(id, payoutActionDto, user.sub);
  }

  @Put('payouts/:id/reject')
  @ApiOperation({ summary: 'Reject payout' })
  async rejectPayout(
    @Param('id') id: string,
    @Body() payoutActionDto: PayoutActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.rejectPayout(id, payoutActionDto, user.sub);
  }

  @Get('payouts/export')
  @ApiOperation({ summary: 'Export payouts data' })
  async exportPayouts(@Query() filter: { startDate?: string; endDate?: string }) {
    return this.adminService.exportPayouts(filter);
  }

  // ==================== CHALLENGE MANAGEMENT ====================

  @Get('challenges')
  @ApiOperation({ summary: 'List all challenges for admin' })
  async getChallenges(@Query() query: PaginationDto) {
    return this.adminService.getChallenges(query);
  }

  @Get('challenges/:id')
  @ApiOperation({ summary: 'Get challenge by ID' })
  async getChallengeById(@Param('id') id: string) {
    return this.adminService.getChallengeById(id);
  }

  @Post('challenges')
  @ApiOperation({ summary: 'Create a new challenge' })
  async createChallenge(@Body() createChallengeDto: CreateChallengeDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.createChallenge(createChallengeDto, user.sub);
  }

  @Put('challenges/:id')
  @ApiOperation({ summary: 'Update challenge' })
  async updateChallenge(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateChallenge(id, updateChallengeDto, user.sub);
  }

  @Patch('challenges/:id')
  @ApiOperation({ summary: 'Update challenge (partial)' })
  async patchChallenge(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateChallenge(id, updateChallengeDto, user.sub);
  }

  @Delete('challenges/:id')
  @ApiOperation({ summary: 'Delete challenge' })
  async deleteChallenge(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.deleteChallenge(id, user.sub);
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with filters' })
  async getAuditLogsWithFilters(@Query() filter: AuditLogFilterDto) {
    return this.adminService.getAuditLogsWithFilters(filter);
  }

  @Get('deletion-history')
  @ApiOperation({ summary: 'Get deletion history from audit logs' })
  async getDeletionHistory(@Query() query: PaginationDto) {
    return this.adminService.getDeletionHistory(query);
  }

  @Post('audit-logs/:id/restore')
  @ApiOperation({ summary: 'Restore entity from audit log snapshot' })
  async restoreFromAuditLog(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.restoreFromAuditLog(id, user.sub);
  }

  // ==================== FEATURE FLAGS ====================

  @Get('feature-flags')
  @ApiOperation({ summary: 'Get all feature flags' })
  async getFeatureFlags(@Query() query: PaginationDto) {
    return this.adminService.getFeatureFlags(query);
  }

  @Get('feature-flags/key/:key')
  @ApiOperation({ summary: 'Get feature flag by key' })
  async getFeatureFlagByKey(@Param('key') key: string) {
    return this.adminService.getFeatureFlagByKey(key);
  }

  @Post('feature-flags')
  @ApiOperation({ summary: 'Create a new feature flag' })
  async createFeatureFlag(@Body() createFeatureFlagDto: CreateFeatureFlagDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.createFeatureFlag(createFeatureFlagDto, user.sub);
  }

  @Put('feature-flags/:id')
  @ApiOperation({ summary: 'Update feature flag' })
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateFeatureFlag(id, updateFeatureFlagDto, user.sub);
  }

  @Patch('feature-flags/:id')
  @ApiOperation({ summary: 'Update feature flag (partial)' })
  async patchFeatureFlag(
    @Param('id') id: string,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateFeatureFlag(id, updateFeatureFlagDto, user.sub);
  }

  @Put('feature-flags/:id/toggle')
  @ApiOperation({ summary: 'Toggle feature flag (legacy)' })
  async toggleFeatureFlag(@Param('id') id: string) {
    return this.adminService.toggleFeatureFlag(id);
  }

  @Delete('feature-flags/:id')
  @ApiOperation({ summary: 'Delete feature flag' })
  async deleteFeatureFlag(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.deleteFeatureFlag(id, user.sub);
  }

  // ==================== PLATFORM SETTINGS ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get all platform settings' })
  async getPlatformSettings(@Query() query: PaginationDto, @Query('category') category?: string) {
    return this.adminService.getPlatformSettings(category, query);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Bulk update platform settings' })
  async bulkUpdateSettings(
    @Body() dto: BulkPlatformSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.bulkUpdatePlatformSettings(dto, user.sub);
  }

  @Post('settings')
  @ApiOperation({ summary: 'Create a new platform setting' })
  async createPlatformSetting(
    @Body() createPlatformSettingDto: CreatePlatformSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.createPlatformSetting(createPlatformSettingDto, user.sub);
  }

  @Get('settings/key/:key')
  @ApiOperation({ summary: 'Get platform setting by key' })
  async getPlatformSettingByKey(@Param('key') key: string) {
    return this.adminService.getPlatformSettingByKey(key);
  }

  @Get('settings/category/:category')
  @ApiOperation({ summary: 'Get settings by category' })
  async getSettingsByCategory(@Param('category') category: string) {
    return this.adminService.getSettingsByCategory(category);
  }

  // ==================== RECYCLE BIN ====================

  @Get('recycle-bin')
  @ApiOperation({ summary: 'Get all deleted items' })
  async getDeletedItems(@Query() query: PaginationDto) {
    return this.adminService.getDeletedItems(query);
  }

  @Post('recycle-bin/users/:id/restore')
  @ApiOperation({ summary: 'Restore deleted user' })
  async restoreUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.restoreUser(id, user.sub);
  }

  @Post('recycle-bin/courses/:id/restore')
  @ApiOperation({ summary: 'Restore deleted course' })
  async restoreCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.restoreCourse(id, user.sub);
  }

  @Post('recycle-bin/challenges/:id/restore')
  @ApiOperation({ summary: 'Restore deleted challenge' })
  async restoreChallenge(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.restoreChallenge(id, user.sub);
  }

  @Put('settings/:id')
  @ApiOperation({ summary: 'Update platform setting' })
  async updatePlatformSetting(
    @Param('id') id: string,
    @Body() updatePlatformSettingDto: UpdatePlatformSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updatePlatformSetting(id, updatePlatformSettingDto, user.sub);
  }

  @Delete('settings/:id')
  @ApiOperation({ summary: 'Delete platform setting' })
  async deletePlatformSetting(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.deletePlatformSetting(id, user.sub);
  }
}
