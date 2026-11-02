import { IsOptional, IsString, IsNumber, IsUUID, IsArray } from 'class-validator';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  isbn: string;

  @IsNumber()
  publishedYear: number;

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

  /** Daftar ID penulis. Relasi many-to-many melalui book_authors. */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  authorIds?: string[];
}
