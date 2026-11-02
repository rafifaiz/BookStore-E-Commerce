import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateShipmentDto {
  @IsUUID()
  orderId: string;

  @IsOptional()
  @IsString()
  courier?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}
