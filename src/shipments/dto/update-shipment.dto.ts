import { IsIn, IsOptional, IsString } from 'class-validator';

import { SHIPMENT_STATUSES } from '../entities/shipment.entity.js';
import type { ShipmentStatus } from '../entities/shipment.entity.js';

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  courier?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsIn(SHIPMENT_STATUSES)
  status?: ShipmentStatus;
}
