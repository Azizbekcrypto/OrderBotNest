import { Module } from '@nestjs/common';
import { LiveModule } from '../live/live.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [LiveModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
