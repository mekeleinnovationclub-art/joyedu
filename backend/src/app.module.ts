import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ChaptersModule } from './chapters/chapters.module';
import { LessonsModule } from './lessons/lessons.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { CodingModule } from './coding/coding.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthModule } from './health/health.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { MessagesModule } from './messages/messages.module';
import { TeacherApplicationsModule } from './teacher-applications/teacher-applications.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ChaptersModule,
    LessonsModule,
    QuizzesModule,
    EnrollmentsModule,
    CertificatesModule,
    ReviewsModule,
    PaymentsModule,
    NotificationsModule,
    ChatModule,
    CodingModule,
    AdminModule,
    UploadsModule,
    CategoriesModule,
    HealthModule,
    WishlistModule,
    BookmarksModule,
    MessagesModule,
    TeacherApplicationsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
