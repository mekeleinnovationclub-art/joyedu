import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxRetries = 10;
    const retryDelay = 3000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        this.logger.warn(`Database connection attempt ${i + 1}/${maxRetries} failed`);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          this.logger.error('Failed to connect to database after maximum retries');
          throw error;
        }
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
