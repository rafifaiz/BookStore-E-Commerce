import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCustomerAddressDto {
  @IsUUID()
  customerId: string;

  @IsString()
  recipientName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}
