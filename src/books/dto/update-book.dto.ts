import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsNumber()
  publishedYear?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  publisherId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  authorIds?: string[];
}
