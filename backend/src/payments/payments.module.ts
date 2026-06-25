import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WalletController, AdminWalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { AuthModule } from '../auth/auth.module';
import { TelebirrService } from './telebirr/telebirr.service';
import { TelebirrCryptoService } from './telebirr/telebirr-crypto.service';
import { B2CDisbursementService } from './telebirr/b2c-disbursement.service';

@Module({
  imports: [AuthModule, HttpModule],
  controllers: [PaymentsController, WalletController, AdminWalletController],
  providers: [
    PaymentsService,
    WalletService,
    TelebirrService,
    TelebirrCryptoService,
    B2CDisbursementService,
  ],
  exports: [PaymentsService, WalletService, TelebirrService],
})
export class PaymentsModule {}
