import { IsOptional, IsString } from 'class-validator';

export class UpdateAuthorDto {
  @IsOptional()
  @IsString()
  name?: string;
}
