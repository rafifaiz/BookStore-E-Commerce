import {
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  bookId: string;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  /** Opsional: ID alamat pengiriman. Jika diberikan, snapshot alamat saat checkout. */
  @IsOptional()
  @IsUUID()
  shippingAddressId?: string;
}
