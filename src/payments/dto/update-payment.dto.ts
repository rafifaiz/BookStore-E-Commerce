import { IsIn, IsOptional, IsString } from 'class-validator';

import { PAYMENT_STATUSES } from '../entities/payment.entity.js';
import type { PaymentStatus } from '../entities/payment.entity.js';

export class UpdatePaymentDto {
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
